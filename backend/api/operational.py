"""Operational and monitoring API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.operational_alignment import OperationalAlignment, OperationalMetrics
from backend.kpi_alerts import KPIAlertSystem
from backend.data_quality import DataQualityMonitor
from backend.automated_reporting import AutomatedReporting
from backend.auth.utils import get_current_user
from database.models import User

router = APIRouter(prefix="/api/operational", tags=["operational"])


@router.get("/alignment-score")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_alignment_score(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get operational alignment score (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    score = OperationalAlignment.calculate_alignment_score(db, days)
    return score


@router.get("/kpi-status")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_kpi_status(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get KPI status vs targets (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    status_data = OperationalAlignment.get_kpi_status(db, days)
    return status_data


@router.get("/priority-actions")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_priority_actions(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get prioritized actions based on KPI gaps (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    actions = OperationalAlignment.get_priority_actions(db, days)
    return {"actions": actions, "count": len(actions)}


@router.get("/real-time-metrics")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")  # Can be polled frequently
async def get_real_time_metrics(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time operational metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    metrics = OperationalMetrics.get_real_time_metrics(db)
    return metrics


@router.get("/system-health")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")  # Can be polled frequently
async def get_system_health(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system health indicators (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    health = OperationalMetrics.get_system_health(db)
    return health


@router.get("/kpi-alerts")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def check_kpi_alerts(
    request: Request,
    days: int = 30,
    send_email: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check KPI alerts (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    alerts = KPIAlertSystem.check_and_alert(db, days, send_email)
    return alerts


@router.get("/data-quality")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def check_data_quality(
    request: Request,
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check data quality (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    quality = DataQualityMonitor.check_data_quality(db, days)
    return quality


@router.get("/daily-report")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_daily_report(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily business report (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    report = AutomatedReporting.generate_daily_report(db)
    return report


@router.get("/weekly-report")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_weekly_report(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly business report (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    report = AutomatedReporting.generate_weekly_report(db)
    return report


@router.post("/send-daily-report")
@limiter.limit("5/hour")  # Very restrictive - email sending
async def send_daily_report_email(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send daily report via email (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = AutomatedReporting.send_daily_report_email(db)
    return {"sent": success, "message": "Daily report sent" if success else "Failed to send report"}


@router.post("/send-weekly-report")
@limiter.limit("5/hour")  # Very restrictive - email sending
async def send_weekly_report_email(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send weekly report via email (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = AutomatedReporting.send_weekly_report_email(db)
    return {"sent": success, "message": "Weekly report sent" if success else "Failed to send report"}
