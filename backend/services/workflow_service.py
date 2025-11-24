"""
Workflow Service

Business logic for workflow operations.
Handles workflow creation, execution, and management.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from backend.logging_config import get_logger
from database.models import Workflow, WorkflowExecution, WorkflowVersion

logger = get_logger(__name__)


class WorkflowService:
    """Service for workflow operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_workflow(
        self,
        user_id: Optional[str],
        organization_id: Optional[str],
        name: str,
        description: Optional[str],
        definition: Dict[str, Any],
    ) -> Workflow:
        """
        Create a new workflow.
        
        Args:
            user_id: User ID (optional if organization_id provided)
            organization_id: Organization ID (optional if user_id provided)
            name: Workflow name
            description: Workflow description
            definition: Workflow definition/configuration
        
        Returns:
            Created workflow
        """
        workflow = Workflow(
            user_id=user_id,
            organization_id=organization_id,
            name=name,
            description=description,
            definition=definition,
            is_active=True
        )
        
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        
        # Create initial version
        self.create_workflow_version(workflow.id, definition)
        
        logger.info(f"Workflow created: id={workflow.id}, name={name}, user_id={user_id}")
        
        return workflow
    
    def get_user_workflows(
        self,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        active_only: bool = False,
    ) -> List[Workflow]:
        """
        Get workflows for a user or organization.
        
        Args:
            user_id: User ID (optional)
            organization_id: Organization ID (optional)
            active_only: Only return active workflows
        
        Returns:
            List of workflows
        """
        query = self.db.query(Workflow)
        
        if user_id:
            query = query.filter(Workflow.user_id == user_id)
        if organization_id:
            query = query.filter(Workflow.organization_id == organization_id)
        if active_only:
            query = query.filter(Workflow.is_active == True)
        
        return query.order_by(desc(Workflow.created_at)).all()
    
    def get_workflow(
        self,
        workflow_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[Workflow]:
        """
        Get a specific workflow.
        
        Args:
            workflow_id: Workflow ID
            user_id: User ID (for authorization check)
        
        Returns:
            Workflow or None
        """
        query = self.db.query(Workflow).filter(Workflow.id == workflow_id)
        
        if user_id:
            query = query.filter(Workflow.user_id == user_id)
        
        return query.first()
    
    def update_workflow(
        self,
        workflow_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        definition: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Workflow]:
        """
        Update a workflow.
        
        Args:
            workflow_id: Workflow ID
            name: New name (optional)
            description: New description (optional)
            definition: New definition (optional)
            is_active: Active status (optional)
        
        Returns:
            Updated workflow or None
        """
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        
        if not workflow:
            return None
        
        if name is not None:
            workflow.name = name
        if description is not None:
            workflow.description = description
        if definition is not None:
            workflow.definition = definition
            # Create new version when definition changes
            self.create_workflow_version(workflow_id, definition)
        if is_active is not None:
            workflow.is_active = is_active
        
        self.db.commit()
        self.db.refresh(workflow)
        
        logger.info(f"Workflow updated: id={workflow_id}")
        
        return workflow
    
    def create_workflow_version(
        self,
        workflow_id: str,
        definition: Dict[str, Any],
    ) -> WorkflowVersion:
        """
        Create a new workflow version.
        
        Args:
            workflow_id: Workflow ID
            definition: Workflow definition
        
        Returns:
            Created workflow version
        """
        # Get current max version
        max_version = self.db.query(WorkflowVersion).filter(
            WorkflowVersion.workflow_id == workflow_id
        ).order_by(desc(WorkflowVersion.version)).first()
        
        next_version = (max_version.version + 1) if max_version else 1
        
        version = WorkflowVersion(
            workflow_id=workflow_id,
            version=next_version,
            definition=definition
        )
        
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        
        logger.info(f"Workflow version created: workflow_id={workflow_id}, version={next_version}")
        
        return version
    
    def execute_workflow(
        self,
        workflow_id: str,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> WorkflowExecution:
        """
        Execute a workflow.
        
        Args:
            workflow_id: Workflow ID
            input_data: Input data for workflow execution
        
        Returns:
            Workflow execution record
        """
        workflow = self.get_workflow(workflow_id)
        
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")
        
        if not workflow.is_active:
            raise ValueError(f"Workflow is not active: {workflow_id}")
        
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            status="pending",
            input=input_data or {}
        )
        
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)
        
        # TODO: Trigger actual workflow execution via background job
        # This would use the workflow execution engine
        
        logger.info(f"Workflow execution created: id={execution.id}, workflow_id={workflow_id}")
        
        return execution
    
    def get_workflow_executions(
        self,
        workflow_id: str,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[WorkflowExecution]:
        """
        Get executions for a workflow.
        
        Args:
            workflow_id: Workflow ID
            status: Filter by status (optional)
            limit: Maximum number of executions
        
        Returns:
            List of workflow executions
        """
        query = self.db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == workflow_id
        )
        
        if status:
            query = query.filter(WorkflowExecution.status == status)
        
        return query.order_by(desc(WorkflowExecution.started_at)).limit(limit).all()
    
    def delete_workflow(
        self,
        workflow_id: str,
    ) -> bool:
        """
        Delete a workflow.
        
        Args:
            workflow_id: Workflow ID
        
        Returns:
            True if deleted, False if not found
        """
        workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
        
        if not workflow:
            return False
        
        self.db.delete(workflow)
        self.db.commit()
        
        logger.info(f"Workflow deleted: id={workflow_id}")
        
        return True
