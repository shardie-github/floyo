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
from backend.auth.utils import get_current_user
from backend.auth.analytics_helpers import check_user_activation, get_user_retention_metrics
from backend.services.analytics_service import AnalyticsService as AnalyticsDashboard
from backend.jobs.metrics_aggregation import (
    calculate_dau_wau_mau,
    calculate_revenue_metrics,
    calculate_engagement_metrics
)
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


@router.get("/activation")
async def get_activation_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user activation status."""
    is_activated = check_user_activation(db, str(current_user.id))
    retention_metrics = get_user_retention_metrics(db, str(current_user.id))
    
    return {
        "is_activated": is_activated,
        "retention": retention_metrics
    }


@router.get("/funnel")
async def get_funnel_metrics_endpoint(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get funnel metrics (admin only or for own data)."""
    # For now, return user-specific metrics
    # In production, this would be admin-only for full funnel
    retention_metrics = get_user_retention_metrics(db, str(current_user.id))
    
    return {
        "user_retention": retention_metrics,
        "period_days": days
    }


@router.get("/dashboard")
async def get_analytics_dashboard(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics dashboard (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    dashboard = AnalyticsDashboard.get_comprehensive_dashboard(db, days)
    return dashboard


@router.get("/activation-metrics")
async def get_activation_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activation metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    metrics = AnalyticsDashboard.get_activation_metrics(db, days)
    return metrics


@router.get("/retention-cohorts")
async def get_retention_cohorts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get retention cohort data (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cohorts = AnalyticsDashboard.get_retention_cohorts(db)
    return cohorts


@router.get("/conversion-funnel")
async def get_conversion_funnel(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get conversion funnel metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    funnel = AnalyticsDashboard.get_conversion_funnel(db, days)
    return funnel


@router.get("/revenue-metrics")
async def get_revenue_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get revenue metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    metrics = calculate_revenue_metrics(db)
    return metrics


@router.get("/dau-wau-mau")
async def get_dau_wau_mau(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get DAU, WAU, MAU metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    metrics = calculate_dau_wau_mau(db)
    return metrics


@router.get("/engagement-metrics")
async def get_engagement_metrics_endpoint(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get engagement metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    metrics = calculate_engagement_metrics(db, days)
    return metrics


@router.get("/unit-economics")
async def get_unit_economics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unit economics (CAC, LTV, LTV:CAC, payback period) (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get revenue metrics
    revenue = calculate_revenue_metrics(db)
    arpu = revenue.get("arpu", 0)
    
    # TODO: Get marketing spend from external source (Google Ads API, etc.)
    # For now, return placeholder structure
    marketing_spend = 0  # Placeholder - needs to be filled from actual marketing data
    
    # Calculate CAC (requires new signups and marketing spend)
    from datetime import timedelta
    from database.models import User
    new_customers_30d = db.query(func.count(User.id)).filter(
        User.created_at >= datetime.utcnow() - timedelta(days=30)
    ).scalar() or 0
    
    cac = marketing_spend / new_customers_30d if new_customers_30d > 0 else 0
    
    # Calculate LTV (assume 12-month average lifetime)
    ltv = arpu * 12
    
    # Calculate LTV:CAC
    ltv_cac_ratio = ltv / cac if cac > 0 else 0
    
    # Calculate payback period (months)
    payback_period = cac / arpu if arpu > 0 else 0
    
    return {
        "cac": round(cac, 2),
        "ltv": round(ltv, 2),
        "ltv_cac_ratio": round(ltv_cac_ratio, 2),
        "payback_period_months": round(payback_period, 2),
        "arpu": arpu,
        "new_customers_30d": new_customers_30d,
        "marketing_spend_30d": marketing_spend,
        "note": "Marketing spend needs to be updated from actual marketing platform data"
    }


@router.get("/acquisition-channels")
async def get_acquisition_channels(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get acquisition channel breakdown (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from database.models import UTMTrack
    start_date = datetime.utcnow() - timedelta(days=days)
    
    channels = db.query(
        UTMTrack.source,
        UTMTrack.medium,
        func.count(func.distinct(UTMTrack.user_id)).label('signups')
    ).filter(
        UTMTrack.timestamp >= start_date,
        UTMTrack.firstTouch == True
    ).group_by(UTMTrack.source, UTMTrack.medium).all()
    
    total_signups = sum(c.signups for c in channels)
    
    return {
        "period_days": days,
        "channels": [
            {
                "source": c.source or "direct",
                "medium": c.medium or "none",
                "signups": c.signups,
                "percentage": round((c.signups / total_signups * 100) if total_signups > 0 else 0, 2)
            }
            for c in channels
        ],
        "total_signups": total_signups
    }


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
