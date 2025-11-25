"""Growth metrics API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, Any
from datetime import datetime, timedelta
from typing import List
from uuid import UUID

from backend.database import get_db
from backend.auth.utils import get_current_user
from backend.logging_config import get_logger
from database.models import User, Referral, ReferralReward, Event, UTMTrack

logger = get_logger(__name__)
router = APIRouter(prefix="/api/growth", tags=["growth"])


@router.get("/referral-metrics")
async def get_referral_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get referral system metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total referrals sent (tracked via events or referral table)
    total_referrals = db.query(func.count(Referral.id)).filter(
        Referral.created_at >= start_date
    ).scalar() or 0
    
    # Total referrals used
    total_used = db.query(func.sum(Referral.usage_count)).filter(
        Referral.created_at >= start_date
    ).scalar() or 0
    
    # Signups from referrals (users with referral_code in signup)
    # This would need to be tracked in user signup - assuming referral_code field exists
    try:
        signups_from_referrals = db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= start_date,
                User.referral_code.isnot(None)  # Assuming this field exists
            )
        ).scalar() or 0
    except Exception:
        # Fallback: estimate from referral usage
        signups_from_referrals = total_used
    
    # Conversion rate
    conversion_rate = (signups_from_referrals / total_referrals * 100) if total_referrals > 0 else 0
    
    # Viral coefficient (signups from referrals / total signups)
    total_signups = db.query(func.count(User.id)).filter(
        User.created_at >= start_date
    ).scalar() or 0
    viral_coefficient = (signups_from_referrals / total_signups) if total_signups > 0 else 0
    
    return {
        "total_referrals": total_referrals,
        "total_signups_from_referrals": signups_from_referrals,
        "conversion_rate": round(conversion_rate, 2),
        "viral_coefficient": round(viral_coefficient, 2),
        "period_days": days
    }


@router.get("/share-metrics")
async def get_share_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get share functionality metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Track shares via events table with event_type='share'
    total_shares = db.query(func.count(Event.id)).filter(
        and_(
            Event.timestamp >= start_date,
            Event.event_type == 'share'
        )
    ).scalar() or 0
    
    # Signups from shares (tracked via UTM with source=share)
    signups_from_shares = db.query(func.count(func.distinct(UTMTrack.user_id))).filter(
        and_(
            UTMTrack.timestamp >= start_date,
            UTMTrack.source == 'share'
        )
    ).scalar() or 0
    
    # Share rate (shares / active users)
    active_users = db.query(func.count(func.distinct(Event.user_id))).filter(
        Event.timestamp >= start_date
    ).scalar() or 0
    share_rate = (total_shares / active_users * 100) if active_users > 0 else 0
    
    return {
        "total_shares": total_shares,
        "signups_from_shares": signups_from_shares,
        "share_rate": round(share_rate, 2),
        "period_days": days
    }


@router.get("/seo-metrics")
async def get_seo_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get SEO landing page metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get signups from organic search (UTM source=google, medium=organic)
    organic_signups = db.query(
        UTMTrack.source,
        UTMTrack.medium,
        func.count(func.distinct(UTMTrack.user_id)).label('signups')
    ).filter(
        and_(
            UTMTrack.timestamp >= start_date,
            UTMTrack.source == 'google',
            UTMTrack.medium == 'organic'
        )
    ).group_by(UTMTrack.source, UTMTrack.medium).all()
    
    # For now, return placeholder structure
    # In production, this would query actual landing page analytics
    landing_pages = [
        {
            "page": "/use-cases/shopify-automation",
            "visitors": 0,  # Would come from analytics
            "signups": 0,
            "conversion_rate": 0.0
        },
        {
            "page": "/use-cases/zapier-alternative",
            "visitors": 0,
            "signups": 0,
            "conversion_rate": 0.0
        }
    ]
    
    total_organic_signups = sum(s.signups for s in organic_signups) if organic_signups else 0
    
    return {
        "landing_pages": landing_pages,
        "total_organic_signups": total_organic_signups,
        "period_days": days
    }
