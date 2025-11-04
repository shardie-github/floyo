"""Growth engine: retention campaigns, viral loops, and referral system."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database.models import User, Event, Suggestion, Organization, OrganizationMember, Referral, ReferralReward, RetentionCampaign
from backend.audit import log_audit
import logging

logger = logging.getLogger(__name__)


class RetentionEngine:
    """Engine for retention campaigns and user engagement."""
    
    @staticmethod
    def get_user_retention_cohort(db: Session, user_id: UUID, days: int = 7) -> Dict[str, Any]:
        """Get retention cohort data for a user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        
        signup_date = user.created_at
        cohort_date = signup_date + timedelta(days=days)
        
        # Check if user was active in the cohort period
        events_count = db.query(Event).filter(
            and_(
                Event.user_id == user_id,
                Event.timestamp >= signup_date,
                Event.timestamp <= cohort_date
            )
        ).count()
        
        is_retained = events_count > 0
        
        return {
            "user_id": str(user_id),
            "signup_date": signup_date.isoformat(),
            "cohort_days": days,
            "cohort_date": cohort_date.isoformat(),
            "events_count": events_count,
            "is_retained": is_retained,
            "retention_rate": 100.0 if is_retained else 0.0
        }
    
    @staticmethod
    def get_at_risk_users(db: Session, days_inactive: int = 7) -> List[Dict[str, Any]]:
        """Get users at risk of churning (inactive for N days)."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_inactive)
        
        # Users who haven't created events in the last N days
        inactive_users = db.query(User).filter(
            ~User.id.in_(
                db.query(Event.user_id).filter(
                    Event.timestamp >= cutoff_date
                ).distinct()
            )
        ).all()
        
        result = []
        for user in inactive_users:
            last_event = db.query(func.max(Event.timestamp)).filter(
                Event.user_id == user.id
            ).scalar()
            
            days_since_last_active = (datetime.utcnow() - last_event).days if last_event else None
            
            result.append({
                "user_id": str(user.id),
                "email": user.email,
                "created_at": user.created_at.isoformat(),
                "last_active": last_event.isoformat() if last_event else None,
                "days_inactive": days_since_last_active,
                "risk_level": "high" if days_since_last_active and days_since_last_active > 30 else "medium"
            })
        
        return result
    
    @staticmethod
    def create_retention_campaign(
        db: Session,
        user_id: UUID,
        campaign_type: str,
        content: Dict[str, Any],
        scheduled_at: Optional[datetime] = None
    ) -> RetentionCampaign:
        """Create a retention campaign for a user."""
        campaign = RetentionCampaign(
            user_id=user_id,
            campaign_type=campaign_type,
            content=content,
            scheduled_at=scheduled_at or datetime.utcnow(),
            status="pending"
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        
        log_audit(
            db=db,
            user_id=user_id,
            action="retention_campaign_created",
            resource_type="retention_campaign",
            resource_id=str(campaign.id),
            details={"campaign_type": campaign_type}
        )
        
        return campaign
    
    @staticmethod
    def send_retention_digest(db: Session, user_id: UUID) -> Dict[str, Any]:
        """Generate and send weekly retention digest."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # Get user activity in last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_events = db.query(Event).filter(
            and_(
                Event.user_id == user_id,
                Event.timestamp >= week_ago
            )
        ).count()
        
        # Get top patterns
        top_patterns = db.query(Pattern).filter(
            Pattern.user_id == user_id
        ).order_by(Pattern.count.desc()).limit(5).all()
        
        # Get new suggestions
        new_suggestions = db.query(Suggestion).filter(
            and_(
                Suggestion.user_id == user_id,
                Suggestion.created_at >= week_ago,
                Suggestion.is_dismissed == False,
                Suggestion.is_applied == False
            )
        ).count()
        
        digest_content = {
            "period": "7 days",
            "events_count": recent_events,
            "top_patterns": [
                {
                    "file_extension": p.file_extension,
                    "count": p.count,
                    "last_used": p.last_used.isoformat() if p.last_used else None
                }
                for p in top_patterns
            ],
            "new_suggestions": new_suggestions,
            "tips": [
                "Try creating a workflow to automate your most common patterns",
                "Explore new integrations to expand your capabilities",
                "Join our community to share workflows with others"
            ]
        }
        
        # Create campaign
        campaign = RetentionEngine.create_retention_campaign(
            db=db,
            user_id=user_id,
            campaign_type="weekly_digest",
            content=digest_content
        )
        
        return {
            "campaign_id": str(campaign.id),
            "digest": digest_content,
            "sent_at": campaign.scheduled_at.isoformat()
        }


class ViralGrowthEngine:
    """Engine for viral growth, referrals, and sharing."""
    
    @staticmethod
    def create_referral_code(db: Session, user_id: UUID, code: Optional[str] = None) -> Referral:
        """Create a referral code for a user."""
        # Check if user already has a referral code
        existing = db.query(Referral).filter(Referral.referrer_id == user_id).first()
        if existing:
            return existing
        
        if not code:
            # Generate unique code
            import secrets
            code = secrets.token_urlsafe(8)[:12].upper()
        
        referral = Referral(
            referrer_id=user_id,
            code=code,
            usage_count=0,
            reward_count=0
        )
        db.add(referral)
        db.commit()
        db.refresh(referral)
        
        log_audit(
            db=db,
            user_id=user_id,
            action="referral_code_created",
            resource_type="referral",
            resource_id=str(referral.id),
            details={"code": code}
        )
        
        return referral
    
    @staticmethod
    def track_referral_signup(
        db: Session,
        new_user_id: UUID,
        referral_code: str
    ) -> Optional[ReferralReward]:
        """Track a new signup from a referral code."""
        referral = db.query(Referral).filter(Referral.code == referral_code).first()
        if not referral:
            return None
        
        # Update referral usage
        referral.usage_count += 1
        referral.last_used_at = datetime.utcnow()
        
        # Create reward for referrer
        reward = ReferralReward(
            referral_id=referral.id,
            referrer_id=referral.referrer_id,
            referred_user_id=new_user_id,
            reward_type="signup",
            reward_value=1,
            status="pending"
        )
        db.add(reward)
        
        # Create reward for new user (bonus)
        new_user_reward = ReferralReward(
            referral_id=referral.id,
            referrer_id=None,
            referred_user_id=new_user_id,
            reward_type="signup_bonus",
            reward_value=1,
            status="pending"
        )
        db.add(new_user_reward)
        
        db.commit()
        db.refresh(reward)
        
        log_audit(
            db=db,
            user_id=referral.referrer_id,
            action="referral_signup_tracked",
            resource_type="referral_reward",
            resource_id=str(reward.id),
            details={"referred_user_id": str(new_user_id), "code": referral_code}
        )
        
        return reward
    
    @staticmethod
    def calculate_viral_coefficient(db: Session, user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Calculate viral coefficient (K-factor) for user or platform."""
        if user_id:
            referrals = db.query(Referral).filter(Referral.referrer_id == user_id).first()
            if not referrals:
                return {"viral_coefficient": 0.0, "referrals": 0, "conversions": 0}
            
            conversions = referrals.usage_count
            return {
                "user_id": str(user_id),
                "viral_coefficient": float(conversions),
                "referrals": referrals.usage_count,
                "conversions": conversions,
                "rewards": referrals.reward_count
            }
        else:
            # Platform-wide viral coefficient
            total_referrals = db.query(func.sum(Referral.usage_count)).scalar() or 0
            total_users = db.query(func.count(User.id)).scalar() or 1
            
            # Calculate average referrals per user
            avg_referrals = total_referrals / total_users if total_users > 0 else 0
            
            return {
                "platform_viral_coefficient": avg_referrals,
                "total_referrals": total_referrals,
                "total_users": total_users,
                "avg_referrals_per_user": avg_referrals
            }
    
    @staticmethod
    def share_workflow(
        db: Session,
        user_id: UUID,
        workflow_id: UUID,
        share_type: str = "public",
        share_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """Share a workflow publicly or via link."""
        from database.models import Workflow, WorkflowShare
        
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow or workflow.user_id != user_id:
            return {"error": "Workflow not found or unauthorized"}
        
        if not share_code:
            import secrets
            share_code = secrets.token_urlsafe(16)
        
        # Create share record
        share = WorkflowShare(
            workflow_id=workflow_id,
            share_code=share_code,
            share_type=share_type,
            created_by_id=user_id,
            view_count=0
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        
        share_url = f"/workflows/share/{share_code}"
        
        log_audit(
            db=db,
            user_id=user_id,
            action="workflow_shared",
            resource_type="workflow_share",
            resource_id=str(share.id),
            details={"workflow_id": str(workflow_id), "share_type": share_type}
        )
        
        return {
            "share_id": str(share.id),
            "share_code": share_code,
            "share_url": share_url,
            "share_type": share_type,
            "created_at": share.created_at.isoformat()
        }


class GrowthAnalytics:
    """Analytics for growth metrics."""
    
    @staticmethod
    def get_growth_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get growth metrics for the platform."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # User signups
        new_users = db.query(func.count(User.id)).filter(
            User.created_at >= cutoff_date
        ).scalar() or 0
        
        # Active users (users with events)
        active_users = db.query(func.count(func.distinct(Event.user_id))).filter(
            Event.timestamp >= cutoff_date
        ).scalar() or 0
        
        # Total users
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # Referrals
        total_referrals = db.query(func.sum(Referral.usage_count)).scalar() or 0
        
        # Calculate retention
        cohort_users = db.query(User).filter(
            User.created_at >= cutoff_date - timedelta(days=7)
        ).count()
        
        retained_users = db.query(func.count(func.distinct(Event.user_id))).filter(
            and_(
                Event.user_id.in_(
                    db.query(User.id).filter(
                        User.created_at >= cutoff_date - timedelta(days=7)
                    )
                ),
                Event.timestamp >= cutoff_date
            )
        ).scalar() or 0
        
        retention_rate = (retained_users / cohort_users * 100) if cohort_users > 0 else 0
        
        # Viral coefficient
        viral_data = ViralGrowthEngine.calculate_viral_coefficient(db)
        
        return {
            "period_days": days,
            "new_users": new_users,
            "active_users": active_users,
            "total_users": total_users,
            "retention_rate": round(retention_rate, 2),
            "viral_coefficient": viral_data.get("platform_viral_coefficient", 0.0),
            "total_referrals": total_referrals,
            "growth_rate": round((new_users / total_users * 100) if total_users > 0 else 0, 2)
        }
