"""Analytics helper functions for authentication events."""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from database.models import User, Event, Workflow, Suggestion, AuditLog
from backend.audit import log_audit


def track_event(
    db: Session,
    user_id: str,
    event_type: str,
    properties: Optional[dict] = None
) -> None:
    """
    Track an analytics event.
    
    Args:
        db: Database session
        user_id: User ID
        event_type: Type of event
        properties: Optional event properties
    """
    try:
        # Log to audit log for analytics tracking
        log_audit(
            db=db,
            user_id=user_id,
            action=event_type,
            resource_type="analytics_event",
            resource_id=None,
            details=properties or {}
        )
    except Exception:
        # Don't fail if tracking fails
        pass


def check_user_activation(db: Session, user_id: str) -> bool:
    """
    Check if a user is activated (has created at least one workflow or applied a suggestion).
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        True if user is activated, False otherwise
    """
    try:
        from uuid import UUID
        user_uuid = UUID(user_id)
        
        # Check if user has created a workflow
        workflow_count = db.query(func.count(Workflow.id)).filter(
            Workflow.user_id == user_uuid
        ).scalar() or 0
        
        # Check if user has applied a suggestion
        suggestion_count = db.query(func.count(Suggestion.id)).filter(
            and_(
                Suggestion.user_id == user_uuid,
                Suggestion.is_applied == True
            )
        ).scalar() or 0
        
        # User is activated if they have at least one workflow or applied suggestion
        return workflow_count > 0 or suggestion_count > 0
    except Exception:
        return False


def mark_user_activated(db: Session, user_id: str, activation_method: str) -> None:
    """
    Mark a user as activated and track the activation event.
    
    Args:
        db: Database session
        user_id: User ID
        activation_method: Method of activation (e.g., "login", "workflow_created", "suggestion_applied")
    """
    try:
        from uuid import UUID
        user_uuid = UUID(user_id)
        
        # Track activation event
        track_event(
            db=db,
            user_id=user_id,
            event_type="user_activated",
            properties={
                "activation_method": activation_method,
                "activated_at": datetime.utcnow().isoformat()
            }
        )
        
        # Log audit event
        log_audit(
            db=db,
            user_id=user_id,
            action="user_activated",
            resource_type="user",
            resource_id=user_id,
            details={"activation_method": activation_method}
        )
    except Exception:
        # Don't fail if tracking fails
        pass


def get_user_retention_metrics(db: Session, user_id: str) -> dict:
    """
    Get retention metrics for a user.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Dictionary with retention metrics
    """
    try:
        from uuid import UUID
        user_uuid = UUID(user_id)
        
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            return {}
        
        # Get event count
        event_count = db.query(func.count(Event.id)).filter(
            Event.user_id == user_uuid
        ).scalar() or 0
        
        # Get workflow count
        workflow_count = db.query(func.count(Workflow.id)).filter(
            Workflow.user_id == user_uuid
        ).scalar() or 0
        
        # Get suggestion count
        suggestion_count = db.query(func.count(Suggestion.id)).filter(
            Suggestion.user_id == user_uuid
        ).scalar() or 0
        
        # Get last activity date
        last_event = db.query(func.max(Event.timestamp)).filter(
            Event.user_id == user_uuid
        ).scalar()
        
        return {
            "event_count": event_count,
            "workflow_count": workflow_count,
            "suggestion_count": suggestion_count,
            "last_activity": last_event.isoformat() if last_event else None,
            "is_activated": check_user_activation(db, user_id)
        }
    except Exception:
        return {}
