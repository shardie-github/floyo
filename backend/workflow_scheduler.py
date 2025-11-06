"""Workflow scheduling and execution engine."""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
import json
import croniter

from database.models import Workflow, WorkflowExecution, WorkflowVersion
from backend.audit import log_audit
from backend.ml.model_manager import ModelManager
from backend.ml.workflow_trigger_predictor import WorkflowTriggerPredictor
from backend.ml.sequence_predictor import SequencePredictor
from backend.logging_config import get_logger


logger = get_logger(__name__)


class WorkflowScheduler:
    """Manages workflow scheduling and execution with ML-powered predictions."""
    
    @staticmethod
    def create_version(
        db: Session,
        workflow: Workflow,
        created_by: UUID,
        change_summary: Optional[str] = None
    ) -> WorkflowVersion:
        """Create a new version of a workflow."""
        # Get current version number
        max_version = db.query(WorkflowVersion).filter(
            WorkflowVersion.workflow_id == workflow.id
        ).order_by(WorkflowVersion.version_number.desc()).first()
        
        version_number = (max_version.version_number + 1) if max_version else 1
        
        version = WorkflowVersion(
            workflow_id=workflow.id,
            version_number=version_number,
            name=workflow.name,
            description=workflow.description,
            steps=workflow.steps,
            change_summary=change_summary,
            created_by=created_by
        )
        
        db.add(version)
        
        # Update workflow version
        workflow.version = version_number
        db.commit()
        db.refresh(version)
        
        return version
    
    @staticmethod
    def rollback_to_version(
        db: Session,
        workflow: Workflow,
        version_number: int,
        rollback_by: UUID
    ) -> Workflow:
        """Rollback workflow to a previous version."""
        version = db.query(WorkflowVersion).filter(
            WorkflowVersion.workflow_id == workflow.id,
            WorkflowVersion.version_number == version_number
        ).first()
        
        if not version:
            raise ValueError(f"Version {version_number} not found")
        
        # Create new version from the old one
        new_version = WorkflowScheduler.create_version(
            db=db,
            workflow=workflow,
            created_by=rollback_by,
            change_summary=f"Rollback to version {version_number}"
        )
        
        # Restore workflow from version
        workflow.name = version.name
        workflow.description = version.description
        workflow.steps = version.steps
        
        db.commit()
        db.refresh(workflow)
        
        return workflow
    
    @staticmethod
    def should_run(workflow: Workflow, db: Session = None, use_ml: bool = True) -> bool:
        """Check if a workflow should run based on schedule and ML predictions.
        
        Args:
            workflow: Workflow to check
            db: Database session (optional, needed for ML predictions)
            use_ml: Whether to use ML predictions for smart triggering
            
        Returns:
            True if workflow should run
        """
        if not workflow.is_active:
            return False
        
        if not workflow.schedule_config:
            # Check ML prediction for predictive triggering
            if use_ml and db:
                try:
                    model_manager = ModelManager(db)
                    sequence_predictor = model_manager.get_model("sequence_predictor")
                    
                    if sequence_predictor and sequence_predictor.is_trained:
                        # Get recent events
                        from database.models import Event
                        from datetime import timedelta
                        
                        recent_events = db.query(Event).filter(
                            Event.user_id == workflow.user_id,
                            Event.timestamp >= datetime.utcnow() - timedelta(hours=1)
                        ).order_by(Event.timestamp.desc()).limit(10).all()
                        
                        if recent_events:
                            # Convert to dict format
                            events_data = [{
                                "timestamp": e.timestamp,
                                "event_type": e.event_type,
                                "file_path": e.file_path,
                                "tool": e.tool,
                                "hour_of_day": e.timestamp.hour,
                                "day_of_week": e.timestamp.weekday(),
                                "file_extension": e.file_path.split('.')[-1] if e.file_path and '.' in e.file_path else None,
                            } for e in recent_events]
                            
                            prediction = sequence_predictor.predict(events_data)
                            if prediction.get("will_trigger", False):
                                logger.info(f"ML prediction triggered workflow {workflow.id}")
                                return True
                except Exception as e:
                    logger.warning(f"Error in ML prediction: {e}")
            
            return False
        
        schedule_type = workflow.schedule_config.get("type")
        
        if schedule_type == "cron":
            cron_expr = workflow.schedule_config.get("cron")
            if cron_expr:
                # Check if current time matches cron expression
                cron = croniter.croniter(cron_expr, datetime.utcnow())
                next_run = cron.get_next(datetime)
                last_run = workflow.schedule_config.get("last_run")
                
                if not last_run:
                    return True
                
                last_run_dt = datetime.fromisoformat(last_run) if isinstance(last_run, str) else last_run
                return datetime.utcnow() >= next_run
        
        elif schedule_type == "interval":
            # Interval-based (e.g., every 5 minutes)
            interval_seconds = workflow.schedule_config.get("interval", 0)
            last_run = workflow.schedule_config.get("last_run")
            
            if not last_run:
                return True
            
            last_run_dt = datetime.fromisoformat(last_run) if isinstance(last_run, str) else last_run
            time_since = (datetime.utcnow() - last_run_dt).total_seconds()
            return time_since >= interval_seconds
        
        elif schedule_type == "predictive" and use_ml and db:
            # ML-based predictive scheduling
            try:
                model_manager = ModelManager(db)
                trigger_predictor = model_manager.get_model("workflow_trigger_predictor")
                
                if trigger_predictor and trigger_predictor.is_trained:
                    from database.models import Event
                    from datetime import timedelta
                    
                    recent_events = db.query(Event).filter(
                        Event.user_id == workflow.user_id,
                        Event.timestamp >= datetime.utcnow() - timedelta(hours=24)
                    ).order_by(Event.timestamp.desc()).limit(50).all()
                    
                    events_data = [{
                        "timestamp": e.timestamp,
                        "event_type": e.event_type,
                        "file_path": e.file_path,
                        "tool": e.tool,
                    } for e in recent_events]
                    
                    prediction = trigger_predictor.predict_optimal_time(workflow, events_data, db)
                    optimal_time = datetime.fromisoformat(prediction["optimal_time"])
                    
                    if datetime.utcnow() >= optimal_time:
                        logger.info(f"ML optimal time reached for workflow {workflow.id}")
                        return True
            except Exception as e:
                logger.warning(f"Error in ML predictive scheduling: {e}")
        
        return False
    
    @staticmethod
    def execute_workflow(
        db: Session,
        workflow: Workflow,
        triggered_by: Optional[UUID] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> WorkflowExecution:
        """Execute a workflow."""
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            status="running",
            triggered_by=triggered_by,
            started_at=datetime.utcnow()
        )
        
        db.add(execution)
        db.flush()
        
        try:
            # Execute workflow steps
            execution_log = []
            
            for step in workflow.steps:
                step_result = {
                    "step": step,
                    "started_at": datetime.utcnow().isoformat(),
                    "status": "completed"
                }
                
                # Here you would actually execute the step
                # For now, we'll just log it
                execution_log.append(step_result)
            
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.execution_log = execution_log
            
        except Exception as e:
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
        
        db.commit()
        db.refresh(execution)
        
        # Update last_run in schedule_config
        if workflow.schedule_config:
            workflow.schedule_config["last_run"] = datetime.utcnow().isoformat()
            db.commit()
        
        return execution
    
    @staticmethod
    def get_execution_history(
        db: Session,
        workflow_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[WorkflowExecution]:
        """Get execution history for a workflow."""
        return db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == workflow_id
        ).order_by(WorkflowExecution.started_at.desc()).limit(limit).offset(offset).all()
