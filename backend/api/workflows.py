"""Workflow API endpoints (legacy - use v1/workflows for new code)."""

from typing import Dict, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.workflow_scheduler import WorkflowScheduler
from backend.audit import log_audit
from backend.auth.utils import get_current_user
from backend.auth.analytics_helpers import track_event, mark_user_activated
from backend.api.models import WorkflowCreate, WorkflowUpdate
from database.models import User, Workflow

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.post("", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Create a new workflow.
    
    Automate repetitive tasks by creating intelligent workflows based on your
    file usage patterns. Build once, run automatically.
    """
    workflow = Workflow(
        user_id=current_user.id,
        organization_id=workflow_data.organization_id,
        name=workflow_data.name,
        description=workflow_data.description,
        steps=workflow_data.steps,
        schedule_config=workflow_data.schedule_config,
        is_active=True,
        version=1
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    
    # Create initial version
    WorkflowScheduler.create_version(
        db=db,
        workflow=workflow,
        created_by=current_user.id,
        change_summary="Initial version"
    )
    
    # Track workflow creation event
    track_event(
        db=db,
        user_id=str(current_user.id),
        event_type="workflow_created",
        properties={
            "workflow_id": str(workflow.id),
            "workflow_name": workflow.name,
            "has_schedule": workflow_data.schedule_config is not None
        }
    )
    
    # Check if this is user's first workflow (activation)
    workflow_count = db.query(Workflow).filter(
        Workflow.user_id == current_user.id
    ).count()
    
    if workflow_count == 1:
        mark_user_activated(db, str(current_user.id), "workflow_created")
    
    log_audit(
        db=db,
        action="create",
        resource_type="workflow",
        user_id=current_user.id,
        organization_id=workflow_data.organization_id,
        resource_id=workflow.id,
        request=request
    )
    
    return {"id": workflow.id, "name": workflow.name, "version": workflow.version}


@router.post("/{workflow_id}/rollback")
async def rollback_workflow(
    workflow_id: UUID,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Rollback workflow to a previous version."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = WorkflowScheduler.rollback_to_version(
        db=db,
        workflow=workflow,
        version_number=version_number,
        rollback_by=current_user.id
    )
    
    log_audit(
        db=db,
        action="rollback",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow.id,
        details={"version": version_number},
        request=request
    )
    
    return {"message": f"Rolled back to version {version_number}"}


@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Execute a workflow manually."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    execution = WorkflowScheduler.execute_workflow(
        db=db,
        workflow=workflow,
        triggered_by=current_user.id
    )
    
    log_audit(
        db=db,
        action="execute",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow.id,
        request=request
    )
    
    return {"execution_id": execution.id, "status": execution.status}


@router.get("")
async def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user workflows."""
    workflows = db.query(Workflow).filter(
        Workflow.user_id == current_user.id
    ).all()
    return workflows


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workflow details."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow


@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: UUID,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Update a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update workflow fields
    if workflow_data.name:
        workflow.name = workflow_data.name
    if workflow_data.description is not None:
        workflow.description = workflow_data.description
    if workflow_data.steps:
        workflow.steps = workflow_data.steps
    if workflow_data.schedule_config is not None:
        workflow.schedule_config = workflow_data.schedule_config
    if workflow_data.is_active is not None:
        workflow.is_active = workflow_data.is_active
    
    # Create new version
    WorkflowScheduler.create_version(
        db=db,
        workflow=workflow,
        created_by=current_user.id,
        change_summary="Workflow updated"
    )
    
    db.commit()
    db.refresh(workflow)
    
    log_audit(
        db=db,
        action="update",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow.id,
        request=request
    )
    
    return workflow


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Delete a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    
    log_audit(
        db=db,
        action="delete",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow_id,
        request=request
    )
    
    return {"message": "Workflow deleted successfully"}


@router.get("/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: UUID,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get execution history for a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    executions = WorkflowScheduler.get_execution_history(
        db=db,
        workflow_id=workflow_id,
        limit=limit,
        offset=offset
    )
    
    return executions


@router.get("/{workflow_id}/versions")
async def list_workflow_versions(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all versions of a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    versions = WorkflowScheduler.get_workflow_versions(db, workflow_id)
    return versions
