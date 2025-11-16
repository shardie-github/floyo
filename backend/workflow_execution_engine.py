"""
Workflow Execution Engine
Executes workflows defined by users with error handling, retries, and monitoring
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging
import json
import asyncio
from database.models import (
    Workflow, WorkflowExecution, WorkflowStep, WorkflowStepExecution,
    Event, User
)

logger = logging.getLogger(__name__)


class ExecutionStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class WorkflowExecutionEngine:
    """Engine for executing user-defined workflows."""
    
    def __init__(self, db: Session):
        self.db = db
        self.max_retries = 3
        self.retry_delay_seconds = 5
    
    def execute_workflow(
        self,
        workflow_id: UUID,
        user_id: UUID,
        trigger_data: Optional[Dict[str, Any]] = None
    ) -> WorkflowExecution:
        """
        Execute a workflow.
        
        Args:
            workflow_id: ID of workflow to execute
            user_id: ID of user executing the workflow
            trigger_data: Optional data from trigger event
        
        Returns:
            WorkflowExecution object
        """
        # Get workflow
        workflow = self.db.query(Workflow).filter(
            and_(
                Workflow.id == workflow_id,
                Workflow.user_id == user_id
            )
        ).first()
        
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        # Create execution record
        execution = WorkflowExecution(
            id=uuid4(),
            workflow_id=workflow_id,
            user_id=user_id,
            status=ExecutionStatus.PENDING.value,
            started_at=datetime.utcnow(),
            trigger_data=json.dumps(trigger_data) if trigger_data else None,
        )
        self.db.add(execution)
        self.db.commit()
        
        try:
            # Parse workflow definition
            workflow_def = json.loads(workflow.definition) if isinstance(workflow.definition, str) else workflow.definition
            
            # Execute workflow steps
            execution.status = ExecutionStatus.RUNNING.value
            self.db.commit()
            
            result = self._execute_steps(
                execution.id,
                workflow_def.get('steps', []),
                workflow_def.get('connections', []),
                trigger_data or {}
            )
            
            execution.status = ExecutionStatus.COMPLETED.value
            execution.completed_at = datetime.utcnow()
            execution.result = json.dumps(result)
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}", exc_info=True)
            execution.status = ExecutionStatus.FAILED.value
            execution.completed_at = datetime.utcnow()
            execution.error = str(e)
        
        finally:
            self.db.commit()
        
        return execution
    
    def _execute_steps(
        self,
        execution_id: UUID,
        steps: List[Dict[str, Any]],
        connections: List[Dict[str, str]],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute workflow steps in order based on connections.
        
        Args:
            execution_id: Execution ID
            steps: List of step definitions
            connections: List of connections between steps
            context: Execution context/data
        
        Returns:
            Final execution result
        """
        # Build execution graph
        step_map = {step['id']: step for step in steps}
        step_results = {}
        
        # Find trigger steps (no incoming connections)
        trigger_steps = [
            step_id for step_id in step_map.keys()
            if not any(conn['target'] == step_id for conn in connections)
        ]
        
        # Execute starting from triggers
        executed = set()
        queue = list(trigger_steps)
        
        while queue:
            step_id = queue.pop(0)
            if step_id in executed:
                continue
            
            step = step_map[step_id]
            step_type = step.get('type', 'action')
            
            # Check if dependencies are met
            dependencies = [
                conn['source'] for conn in connections
                if conn['target'] == step_id
            ]
            
            if dependencies and not all(dep in step_results for dep in dependencies):
                # Dependencies not met, skip for now
                continue
            
            # Prepare step input
            step_input = context.copy()
            for dep_id in dependencies:
                if dep_id in step_results:
                    step_input.update(step_results[dep_id])
            
            # Execute step
            try:
                step_result = self._execute_step(
                    execution_id,
                    step_id,
                    step,
                    step_input
                )
                step_results[step_id] = step_result
                executed.add(step_id)
                
                # Add dependent steps to queue
                dependent_steps = [
                    conn['target'] for conn in connections
                    if conn['source'] == step_id
                ]
                queue.extend(dependent_steps)
                
            except Exception as e:
                logger.error(f"Step {step_id} failed: {e}")
                # Handle step failure based on workflow configuration
                raise
        
        return {
            'steps_executed': len(executed),
            'results': step_results,
            'context': context
        }
    
    def _execute_step(
        self,
        execution_id: UUID,
        step_id: str,
        step_def: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a single workflow step.
        
        Args:
            execution_id: Execution ID
            step_id: Step ID
            step_def: Step definition
            input_data: Input data for step
        
        Returns:
            Step execution result
        """
        step_type = step_def.get('type', 'action')
        step_config = step_def.get('config', {})
        
        # Create step execution record
        step_execution = WorkflowStepExecution(
            id=uuid4(),
            execution_id=execution_id,
            step_id=step_id,
            step_type=step_type,
            status=ExecutionStatus.RUNNING.value,
            started_at=datetime.utcnow(),
            input_data=json.dumps(input_data),
        )
        self.db.add(step_execution)
        self.db.commit()
        
        try:
            # Execute based on step type
            if step_type == 'trigger':
                result = self._execute_trigger(step_config, input_data)
            elif step_type == 'action':
                result = self._execute_action(step_config, input_data)
            elif step_type == 'condition':
                result = self._execute_condition(step_config, input_data)
            else:
                raise ValueError(f"Unknown step type: {step_type}")
            
            step_execution.status = ExecutionStatus.COMPLETED.value
            step_execution.completed_at = datetime.utcnow()
            step_execution.output_data = json.dumps(result)
            
        except Exception as e:
            logger.error(f"Step execution failed: {e}")
            step_execution.status = ExecutionStatus.FAILED.value
            step_execution.completed_at = datetime.utcnow()
            step_execution.error = str(e)
            raise
        
        finally:
            self.db.commit()
        
        return result
    
    def _execute_trigger(
        self,
        config: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a trigger step."""
        trigger_type = config.get('trigger_type', 'manual')
        
        # Return trigger data
        return {
            'triggered': True,
            'trigger_type': trigger_type,
            'data': input_data
        }
    
    def _execute_action(
        self,
        config: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an action step."""
        action_type = config.get('action_type', 'custom')
        
        # Execute action based on type
        if action_type == 'send_email':
            return self._action_send_email(config, input_data)
        elif action_type == 'create_event':
            return self._action_create_event(config, input_data)
        elif action_type == 'webhook':
            return self._action_webhook(config, input_data)
        elif action_type == 'transform':
            return self._action_transform(config, input_data)
        else:
            # Custom action - pass through
            return {
                'action_type': action_type,
                'input': input_data,
                'config': config
            }
    
    def _execute_condition(
        self,
        config: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a condition step."""
        condition_type = config.get('condition_type', 'equals')
        field = config.get('field', '')
        value = config.get('value', '')
        
        field_value = input_data.get(field)
        
        result = False
        if condition_type == 'equals':
            result = field_value == value
        elif condition_type == 'contains':
            result = str(value) in str(field_value)
        elif condition_type == 'greater_than':
            result = float(field_value) > float(value)
        elif condition_type == 'less_than':
            result = float(field_value) < float(value)
        
        return {
            'condition_met': result,
            'field': field,
            'value': value,
            'field_value': field_value
        }
    
    def _action_send_email(
        self,
        config: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send email action."""
        # TODO: Integrate with email service
        return {
            'email_sent': True,
            'to': config.get('to', ''),
            'subject': config.get('subject', ''),
        }
    
    def _action_create_event(
        self,
        config: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create event action."""
        # Create event in database
        event = Event(
            id=uuid4(),
            user_id=input_data.get('user_id'),
            event_type=config.get('event_type', 'workflow_event'),
            metadata=json.dumps(input_data),
            timestamp=datetime.utcnow(),
        )
        self.db.add(event)
        self.db.commit()
        
        return {
            'event_created': True,
            'event_id': str(event.id)
        }
    
    def _action_webhook(
        self,
        config: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Webhook action."""
        import requests
        
        url = config.get('url', '')
        method = config.get('method', 'POST')
        headers = config.get('headers', {})
        
        try:
            response = requests.request(
                method=method,
                url=url,
                json=input_data,
                headers=headers,
                timeout=30
            )
            return {
                'webhook_sent': True,
                'status_code': response.status_code,
                'response': response.text[:500]  # Limit response size
            }
        except Exception as e:
            raise Exception(f"Webhook failed: {str(e)}")
    
    def _action_transform(
        self,
        config: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Transform data action."""
        transform_type = config.get('transform_type', 'map')
        
        if transform_type == 'map':
            # Map fields
            field_mapping = config.get('field_mapping', {})
            result = {}
            for new_field, old_field in field_mapping.items():
                result[new_field] = input_data.get(old_field)
            return result
        elif transform_type == 'filter':
            # Filter fields
            fields_to_keep = config.get('fields', [])
            return {k: v for k, v in input_data.items() if k in fields_to_keep}
        else:
            return input_data
    
    def get_execution_history(
        self,
        workflow_id: UUID,
        user_id: UUID,
        limit: int = 50
    ) -> List[WorkflowExecution]:
        """Get execution history for a workflow."""
        return self.db.query(WorkflowExecution).filter(
            and_(
                WorkflowExecution.workflow_id == workflow_id,
                WorkflowExecution.user_id == user_id
            )
        ).order_by(WorkflowExecution.started_at.desc()).limit(limit).all()
    
    def cancel_execution(
        self,
        execution_id: UUID,
        user_id: UUID
    ) -> bool:
        """Cancel a running execution."""
        execution = self.db.query(WorkflowExecution).filter(
            and_(
                WorkflowExecution.id == execution_id,
                WorkflowExecution.user_id == user_id,
                WorkflowExecution.status == ExecutionStatus.RUNNING.value
            )
        ).first()
        
        if execution:
            execution.status = ExecutionStatus.CANCELLED.value
            execution.completed_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False
