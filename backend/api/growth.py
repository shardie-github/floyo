"""Growth and analytics API endpoints."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.growth import RetentionEngine, ViralGrowthEngine, GrowthAnalytics
from backend.auth.utils import get_current_user
from database.models import User

router = APIRouter(prefix="/api/growth", tags=["growth"])


@router.get("/retention/cohort")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_retention_cohort(
    request: Request,
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get retention cohort data for current user."""
    cohort = RetentionEngine.get_user_retention_cohort(db, current_user.id, days)
    return cohort


@router.get("/retention/at-risk")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_at_risk_users(
    request: Request,
    days_inactive: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get users at risk of churning (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    at_risk = RetentionEngine.get_at_risk_users(db, days_inactive)
    return {"at_risk_users": at_risk, "count": len(at_risk)}


@router.post("/retention/digest")
@limiter.limit("5/hour")  # Restrictive - email sending
async def send_retention_digest(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and send weekly retention digest."""
    digest = RetentionEngine.send_retention_digest(db, current_user.id)
    return digest


@router.post("/referral/create")
@limiter.limit("10/hour")  # Restrictive for referral creation
async def create_referral_code(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a referral code for current user.
    
    Share Floyo with others and earn rewards when they sign up.
    """
    referral = ViralGrowthEngine.create_referral_code(db, current_user.id)
    return {
        "referral_code": referral.code,
        "referral_url": f"/signup?ref={referral.code}",
        "usage_count": referral.usage_count
    }


@router.get("/referral/stats")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_referral_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get referral statistics for current user."""
    stats = ViralGrowthEngine.calculate_viral_coefficient(db, current_user.id)
    return stats


@router.get("/viral-coefficient")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_viral_coefficient(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get platform viral coefficient (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    viral = ViralGrowthEngine.calculate_viral_coefficient(db)
    return viral


@router.post("/workflows/{workflow_id}/share")
@limiter.limit("20/hour")  # Restrictive for workflow sharing
async def share_workflow(
    request: Request,
    workflow_id: UUID,
    share_type: str = "public",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Share a workflow publicly or via link.
    
    Share your workflows with the community and discover workflows created by others.
    """
    share = ViralGrowthEngine.share_workflow(db, current_user.id, workflow_id, share_type)
    return share


@router.get("/metrics")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_growth_metrics(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get growth metrics for platform (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    metrics = GrowthAnalytics.get_growth_metrics(db, days)
    return metrics


@router.post("/retention/process-campaigns")
@limiter.limit("5/hour")  # Very restrictive - admin operation
async def process_retention_campaigns(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process retention campaigns (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    from backend.retention_campaigns import RetentionCampaignService
    service = RetentionCampaignService(db)
    results = service.process_campaigns()
    return results
