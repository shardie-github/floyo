"""Workflow scheduling and execution engine."""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
import json
import croniter

from database.models import Workflow, WorkflowExecution, WorkflowVersion
from backend.audit import log_audit


class WorkflowScheduler:
    """Manages workflow scheduling and execution."""
    
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
    def should_run(workflow: Workflow) -> bool:
        """Check if a workflow should run based on schedule."""
        if not workflow.is_active:
            return False
        
        if not workflow.schedule_config:
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
