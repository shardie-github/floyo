"""Analytics and event tracking for market fit metrics."""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database.models import User, Event, Workflow, Suggestion, UserSession
from backend.logging_config import get_logger

logger = get_logger(__name__)


def track_event(
    db: Session,
    user_id: str,
    event_type: str,
    properties: Optional[Dict[str, Any]] = None
):
    """Track analytics event."""
    try:
        event = Event(
            user_id=user_id,
            event_type=f"analytics_{event_type}",
            details=properties or {},
            timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to track event {event_type}: {e}")
        db.rollback()


def check_user_activation(db: Session, user_id: str) -> bool:
    """
    Check if user is activated.
    Activation criteria:
    1. Created at least one workflow, OR
    2. Applied at least one suggestion, OR
    3. Connected at least one integration
    """
    # Check if user has created a workflow
    workflow_count = db.query(Workflow).filter(
        Workflow.user_id == user_id
    ).count()
    
    if workflow_count > 0:
        return True
    
    # Check if user has applied a suggestion
    suggestion_count = db.query(Suggestion).filter(
        and_(
            Suggestion.user_id == user_id,
            Suggestion.is_applied == True
        )
    ).count()
    
    if suggestion_count > 0:
        return True
    
    # Check if user has connected an integration
    # (This would require UserIntegration model check)
    # For now, we'll check if user has events tracked
    event_count = db.query(Event).filter(
        and_(
            Event.user_id == user_id,
            Event.event_type.in_([
                "file_created",
                "file_modified",
                "file_deleted",
                "tool_used"
            ])
        )
    ).count()
    
    if event_count >= 5:  # User has tracked at least 5 events
        return True
    
    return False


def mark_user_activated(db: Session, user_id: str, activation_type: str):
    """Mark user as activated and track activation event."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    # Track activation event
    track_event(
        db=db,
        user_id=user_id,
        event_type="user_activated",
        properties={
            "activation_type": activation_type,
            "activated_at": datetime.utcnow().isoformat()
        }
    )
    
    # Update user metadata (if we add activated_at field)
    # For now, we'll track it via events
    logger.info(f"User {user_id} activated via {activation_type}")


def get_user_retention_metrics(db: Session, user_id: str) -> Dict[str, Any]:
    """Get retention metrics for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    
    created_at = user.created_at
    now = datetime.utcnow()
    
    # Check D7 retention (user active within 7 days)
    d7_threshold = now - timedelta(days=7)
    d7_active = db.query(Event).filter(
        and_(
            Event.user_id == user_id,
            Event.timestamp >= d7_threshold
        )
    ).count() > 0
    
    # Check D30 retention
    d30_threshold = now - timedelta(days=30)
    d30_active = db.query(Event).filter(
        and_(
            Event.user_id == user_id,
            Event.timestamp >= d30_threshold
        )
    ).count() > 0
    
    # Check D90 retention
    d90_threshold = now - timedelta(days=90)
    d90_active = db.query(Event).filter(
        and_(
            Event.user_id == user_id,
            Event.timestamp >= d90_threshold
        )
    ).count() > 0
    
    return {
        "d7_retention": d7_active,
        "d30_retention": d30_active,
        "d90_retention": d90_active,
        "days_since_signup": (now - created_at).days if created_at else 0,
        "is_activated": check_user_activation(db, user_id)
    }


def get_funnel_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
    """Get funnel metrics for signup → activation → retention."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Signups in period
    signups = db.query(User).filter(
        User.created_at >= cutoff_date
    ).count()
    
    # Activations in period
    activated_users = []
    all_users = db.query(User).filter(
        User.created_at >= cutoff_date
    ).all()
    
    for user in all_users:
        if check_user_activation(db, str(user.id)):
            activated_users.append(user.id)
    
    activations = len(activated_users)
    
    # Retained users (active in last 7 days)
    d7_threshold = datetime.utcnow() - timedelta(days=7)
    retained = db.query(Event.user_id).filter(
        Event.timestamp >= d7_threshold
    ).distinct().count()
    
    return {
        "signups": signups,
        "activations": activations,
        "activation_rate": (activations / signups * 100) if signups > 0 else 0,
        "retained_users": retained,
        "retention_rate": (retained / signups * 100) if signups > 0 else 0,
        "period_days": days
    }
