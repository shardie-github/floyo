"""Analytics endpoint for Web Vitals tracking and activation events."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from backend.database import get_db
from backend.logging_config import get_logger
from database.models import User, AuditLog

logger = get_logger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class WebVitalsMetric(BaseModel):
    name: str
    value: float
    rating: str  # 'good' | 'needs-improvement' | 'poor'
    delta: float
    id: str


class ActivationEvent(BaseModel):
    """Activation event model for tracking user activation milestones."""
    event_type: str = Field(..., description="Event type: signup, onboarding_completion, first_insight_view, first_event_tracked")
    user_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    properties: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class AnalyticsEventBatch(BaseModel):
    """Batch of analytics events."""
    events: List[ActivationEvent]


@router.post("/web-vitals")
async def track_web_vitals(
    metric: WebVitalsMetric,
    db: Session = Depends(get_db)
):
    """Track Web Vitals metrics from frontend."""
    try:
        # Log the metric
        logger.info(
            f"Web Vitals: {metric.name}={metric.value:.2f} "
            f"({metric.rating}, delta={metric.delta:.2f})"
        )

        # In production, you might want to store these in a database
        # For now, we'll just log them
        
        # Example: Store in database if you have a WebVitalsMetric model
        # db_metric = WebVitalsMetric(
        #     name=metric.name,
        #     value=metric.value,
        #     rating=metric.rating,
        #     delta=metric.delta,
        #     metric_id=metric.id,
        #     created_at=datetime.utcnow()
        # )
        # db.add(db_metric)
        # db.commit()

        return {"status": "ok", "message": "Metric tracked"}
    except Exception as e:
        logger.error(f"Error tracking Web Vitals: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/track")
async def track_activation_events(
    batch: AnalyticsEventBatch,
    db: Session = Depends(get_db)
):
    """
    Track activation events (signup, onboarding completion, first insight view, etc.).
    
    This endpoint accepts batches of events and stores them in the audit_logs table
    with event_type='activation_event' for querying activation funnels.
    """
    try:
        if not batch.events:
            return {"status": "ok", "message": "No events to track", "tracked": 0}
        
        tracked_count = 0
        
        for event in batch.events:
            # Use event user_id if provided
            event_user_id = event.user_id
            
            if not event_user_id:
                logger.warning(f"Skipping event {event.event_type} - no user_id")
                continue
            
            # Store in audit_logs table with event_type='activation_event'
            audit_log = AuditLog(
                user_id=event_user_id,
                action=f"activation_event:{event.event_type}",
                resource_type="activation",
                resource_id=None,
                details={
                    "event_type": event.event_type,
                    "properties": event.properties or {},
                    "session_id": event.session_id,
                    "timestamp": (event.timestamp or datetime.utcnow()).isoformat()
                },
                ip_address=None,
                user_agent=None
            )
            db.add(audit_log)
            
            # Update user activation timestamps based on event type
            if event_user_id:
                user = db.query(User).filter(User.id == event_user_id).first()
                if user:
                    # Check if we need to update user activation fields
                    # Note: These fields may need to be added to User model
                    # For now, we'll track via audit logs
                    pass
            
            tracked_count += 1
        
        db.commit()
        
        logger.info(f"Tracked {tracked_count} activation events")
        return {
            "status": "ok",
            "message": f"Tracked {tracked_count} events",
            "tracked": tracked_count
        }
    except Exception as e:
        logger.error(f"Error tracking activation events: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track events: {str(e)}"
        )


@router.get("/activation-funnel")
async def get_activation_funnel(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get activation funnel metrics (signup → onboarding → first event → first insight).
    
    Returns conversion rates at each stage of the activation funnel.
    """
    try:
        # Query activation events from audit_logs using SQLAlchemy ORM
        from sqlalchemy import func, and_
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Query distinct event types and user counts
        results = db.query(
            AuditLog.action,
            func.count(func.distinct(AuditLog.user_id)).label('user_count'),
            func.count(AuditLog.id).label('event_count')
        ).filter(
            and_(
                AuditLog.action.like('activation_event:%'),
                AuditLog.created_at >= cutoff_date
            )
        ).group_by(AuditLog.action).all()
        
        # Parse results
        funnel_data = {}
        for row in results:
            event_type = row.action.replace('activation_event:', '')
            user_count = row.user_count
            event_count = row.event_count
            funnel_data[event_type] = {
                "user_count": user_count,
                "event_count": event_count
            }
        
        # Calculate conversion rates
        signups = funnel_data.get('signup', {}).get('user_count', 0)
        onboarding_completed = funnel_data.get('onboarding_completion', {}).get('user_count', 0)
        first_event = funnel_data.get('first_event_tracked', {}).get('user_count', 0)
        first_insight = funnel_data.get('first_insight_view', {}).get('user_count', 0)
        
        conversion_rates = {}
        if signups > 0:
            conversion_rates['onboarding'] = (onboarding_completed / signups) * 100
            conversion_rates['first_event'] = (first_event / signups) * 100
            conversion_rates['first_insight'] = (first_insight / signups) * 100
            conversion_rates['activation'] = (first_insight / signups) * 100  # Activation = first insight
        
        return {
            "funnel": funnel_data,
            "conversion_rates": conversion_rates,
            "period_days": days,
            "signups": signups,
            "activated": first_insight,
            "activation_rate": conversion_rates.get('activation', 0)
        }
    except Exception as e:
        logger.error(f"Error getting activation funnel: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get activation funnel: {str(e)}"
        )
