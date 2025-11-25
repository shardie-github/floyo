"""Referral system API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
import secrets
import string

from backend.database import get_db
from backend.auth.utils import get_current_user
from backend.logging_config import get_logger
from database.models import User, Referral, ReferralReward

logger = get_logger(__name__)
router = APIRouter(prefix="/api/referral", tags=["referral"])


class ReferralCreate(BaseModel):
    invitee_email: EmailStr
    message: Optional[str] = None


class ReferralResponse(BaseModel):
    id: str
    referral_code: str
    invitee_email: str
    used: bool
    created_at: str
    used_at: Optional[str] = None


class ReferralStats(BaseModel):
    total_referrals_sent: int
    total_referrals_used: int
    conversion_rate: float
    total_rewards_given: int


def get_or_create_referral_code(user_id: UUID, db: Session) -> str:
    """Get or create a referral code for a user."""
    # Check if user already has a referral
    referral = db.query(Referral).filter(Referral.referrer_id == user_id).first()
    
    if referral:
        return referral.code
    
    # Generate new code: FLOYO-{first 8 chars of user_id}
    code = f"FLOYO-{str(user_id)[:8].upper()}"
    
    # Create referral record
    referral = Referral(
        referrer_id=user_id,
        code=code
    )
    db.add(referral)
    db.commit()
    
    return code


@router.get("/code")
async def get_referral_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's referral code."""
    code = get_or_create_referral_code(current_user.id, db)
    
    return {
        "referral_code": code,
        "referral_link": f"https://floyo.dev/signup?ref={code}"
    }


@router.post("/invite")
async def create_referral(
    referral_data: ReferralCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a referral invitation (email tracking)."""
    # Get or create referral code
    code = get_or_create_referral_code(current_user.id, db)
    
    # TODO: Track email invitations (could use a separate table or just log)
    # For now, we'll just return the referral code
    
    logger.info(f"Referral invitation sent to {referral_data.invitee_email} by user {current_user.id}")
    
    return {
        "referral_code": code,
        "invitee_email": referral_data.invitee_email,
        "referral_link": f"https://floyo.dev/signup?ref={code}",
        "status": "sent"
    }


@router.get("/stats")
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's referral statistics."""
    referral = db.query(Referral).filter(Referral.referrer_id == current_user.id).first()
    
    if not referral:
        return {
            "total_referrals_sent": 0,
            "total_referrals_used": 0,
            "conversion_rate": 0,
            "total_rewards_given": 0
        }
    
    total_used = referral.usage_count or 0
    total_rewards = referral.reward_count or 0
    
    return {
        "referral_code": referral.code,
        "total_referrals_used": total_used,
        "total_rewards_given": total_rewards,
        "last_used_at": referral.last_used_at.isoformat() if referral.last_used_at else None
    }


@router.get("/list")
async def list_referrals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's referral rewards."""
    referral = db.query(Referral).filter(Referral.referrer_id == current_user.id).first()
    
    if not referral:
        return []
    
    rewards = db.query(ReferralReward).filter(
        ReferralReward.referral_id == referral.id
    ).order_by(ReferralReward.created_at.desc()).all()
    
    return [
        {
            "id": str(r.id),
            "reward_type": r.reward_type,
            "reward_value": r.reward_value,
            "status": r.status,
            "granted_at": r.granted_at.isoformat() if r.granted_at else None,
            "created_at": r.created_at.isoformat()
        }
        for r in rewards
    ]


@router.post("/use/{referral_code}")
async def use_referral_code(
    referral_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Use a referral code during signup."""
    # Find referral
    referral = db.query(Referral).filter(Referral.code == referral_code).first()
    
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid referral code"
        )
    
    # Increment usage count
    referral.usage_count = (referral.usage_count or 0) + 1
    referral.last_used_at = datetime.utcnow()
    
    # Create reward record
    reward = ReferralReward(
        referral_id=referral.id,
        referrer_id=referral.referrer_id,
        referred_user_id=current_user.id,
        reward_type="signup",
        reward_value=1,
        status="pending"
    )
    db.add(reward)
    
    # TODO: Give rewards (free month, discount, etc.)
    # TODO: Update user record with referral info if needed
    
    db.commit()
    
    logger.info(f"Referral code {referral_code} used by user {current_user.id}")
    
    return {
        "status": "success",
        "message": "Referral code applied successfully",
        "referral_code": referral_code
    }
