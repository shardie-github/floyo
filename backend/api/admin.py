"""Admin API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.data_retention import get_retention_policy
from backend.audit import log_audit
from backend.auth.utils import get_current_user
from database.models import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/data-retention/cleanup")
async def run_data_retention_cleanup(
    dry_run: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run data retention cleanup (admin only).
    
    Clean up old data according to retention policies for compliance and storage optimization.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can run data retention cleanup"
        )
    
    policy = get_retention_policy()
    results = policy.cleanup_all(db, dry_run=dry_run)
    
    log_audit(
        db=db,
        user_id=current_user.id,
        action="data_retention_cleanup",
        resource_type="data",
        resource_id=None,
        details={"dry_run": dry_run, "results": results}
    )
    
    return results


@router.get("/data-retention/policy")
async def get_data_retention_policy(
    current_user: User = Depends(get_current_user)
):
    """
    Get current data retention policy (admin only).
    
    View configured data retention policies for compliance monitoring.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view data retention policy"
        )
    
    policy = get_retention_policy()
    return {
        "events_retention_days": policy.events_retention_days,
        "patterns_retention_days": policy.patterns_retention_days,
        "sessions_retention_days": policy.sessions_retention_days,
        "audit_logs_retention_days": policy.audit_logs_retention_days,
        "workflow_executions_retention_days": policy.workflow_executions_retention_days,
        "suggestions_retention_days": policy.suggestions_retention_days,
    }
