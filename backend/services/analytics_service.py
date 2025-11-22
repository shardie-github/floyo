"""Analytics service for business metrics calculations."""

from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database.models import (
    User, Event, Workflow, Suggestion, Subscription, UsageMetric,
    Organization, OrganizationMember
)
from backend.growth import GrowthAnalytics, RetentionEngine, ViralGrowthEngine
from backend.monetization import PricingCalculator
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Analytics service for business metrics."""
    
    @staticmethod
    def get_activation_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get activation metrics (signup → activation conversion)."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total signups
        total_signups = db.query(func.count(User.id)).filter(
            User.created_at >= cutoff_date
        ).scalar() or 0
        
        # Activated users (users with at least one workflow)
        activated_users = db.query(func.count(func.distinct(Workflow.user_id))).filter(
            and_(
                Workflow.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                )
            )
        ).scalar() or 0
        
        # Activation rate
        activation_rate = (activated_users / total_signups * 100) if total_signups > 0 else 0
        
        # Time to activation (average days from signup to first workflow)
        activation_times = db.query(
            func.extract('epoch', func.min(Workflow.created_at) - User.created_at) / 86400
        ).join(
            Workflow, Workflow.user_id == User.id
        ).filter(
            User.created_at >= cutoff_date
        ).group_by(User.id).all()
        
        avg_time_to_activation = (
            sum([t[0] for t in activation_times]) / len(activation_times)
            if activation_times else None
        )
        
        return {
            "period_days": days,
            "total_signups": total_signups,
            "activated_users": activated_users,
            "activation_rate": round(activation_rate, 2),
            "avg_time_to_activation_days": round(avg_time_to_activation, 2) if avg_time_to_activation else None,
            "non_activated_users": total_signups - activated_users
        }
    
    @staticmethod
    def get_retention_cohorts(db: Session) -> Dict[str, Any]:
        """Get retention cohort data (D1, D7, D30)."""
        cohorts = {}
        
        for days in [1, 7, 30]:
            cutoff_date = datetime.utcnow() - timedelta(days=days + 7)  # Look back further
            
            # Users who signed up in the cohort period
            cohort_users = db.query(User).filter(
                and_(
                    User.created_at >= cutoff_date - timedelta(days=7),
                    User.created_at <= cutoff_date
                )
            ).all()
            
            cohort_size = len(cohort_users)
            if cohort_size == 0:
                cohorts[f"d{days}"] = {
                    "cohort_size": 0,
                    "retained": 0,
                    "retention_rate": 0
                }
                continue
            
            # Check retention (users active within D days of signup)
            retained_count = 0
            for user in cohort_users:
                retention_data = RetentionEngine.get_user_retention_cohort(db, user.id, days)
                if retention_data.get("is_retained", False):
                    retained_count += 1
            
            retention_rate = (retained_count / cohort_size * 100) if cohort_size > 0 else 0
            
            cohorts[f"d{days}"] = {
                "cohort_size": cohort_size,
                "retained": retained_count,
                "retention_rate": round(retention_rate, 2)
            }
        
        return cohorts
    
    @staticmethod
    def get_conversion_funnel(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get conversion funnel metrics."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Step 1: Signups
        signups = db.query(func.count(User.id)).filter(
            User.created_at >= cutoff_date
        ).scalar() or 0
        
        # Step 2: Activated (created first workflow)
        activated = db.query(func.count(func.distinct(Workflow.user_id))).filter(
            and_(
                Workflow.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                )
            )
        ).scalar() or 0
        
        # Step 3: Created multiple workflows (engaged)
        engaged = db.query(func.count(func.distinct(Workflow.user_id))).filter(
            and_(
                Workflow.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                )
            )
        ).having(func.count(Workflow.id) > 1).scalar() or 0
        
        # Step 4: Subscribed (paid)
        subscribed = db.query(func.count(func.distinct(Subscription.user_id))).filter(
            and_(
                Subscription.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                ),
                Subscription.status == "active"
            )
        ).scalar() or 0
        
        return {
            "period_days": days,
            "funnel": {
                "signups": signups,
                "activated": activated,
                "engaged": engaged,
                "subscribed": subscribed
            },
            "conversion_rates": {
                "signup_to_activation": round((activated / signups * 100) if signups > 0 else 0, 2),
                "activation_to_engagement": round((engaged / activated * 100) if activated > 0 else 0, 2),
                "engagement_to_subscription": round((subscribed / engaged * 100) if engaged > 0 else 0, 2),
                "signup_to_subscription": round((subscribed / signups * 100) if signups > 0 else 0, 2)
            },
            "drop_offs": {
                "signup_to_activation": signups - activated,
                "activation_to_engagement": activated - engaged,
                "engagement_to_subscription": engaged - subscribed
            }
        }
    
    @staticmethod
    def get_growth_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get growth metrics."""
        return GrowthAnalytics.get_growth_metrics(db, days)
    
    @staticmethod
    def get_revenue_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get revenue metrics."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Active subscriptions
        active_subscriptions = db.query(Subscription).filter(
            and_(
                Subscription.status == "active",
                Subscription.created_at >= cutoff_date
            )
        ).all()
        
        # Calculate MRR
        mrr = sum([sub.price for sub in active_subscriptions])
        
        # Calculate ARR
        arr = mrr * 12
        
        # Total subscriptions
        total_subscriptions = len(active_subscriptions)
        
        # Subscriptions by tier
        subscriptions_by_tier = {}
        for sub in active_subscriptions:
            tier = sub.plan.tier if sub.plan else "unknown"
            subscriptions_by_tier[tier] = subscriptions_by_tier.get(tier, 0) + 1
        
        # LTV:CAC ratio
        ltv_cac = PricingCalculator.calculate_ltv_cac(db)
        
        return {
            "period_days": days,
            "mrr": round(mrr, 2),
            "arr": round(arr, 2),
            "total_subscriptions": total_subscriptions,
            "subscriptions_by_tier": subscriptions_by_tier,
            "ltv_cac": ltv_cac
        }
    
    @staticmethod
    def get_engagement_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get user engagement metrics."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Active users (users with events)
        active_users = db.query(func.count(func.distinct(Event.user_id))).filter(
            Event.timestamp >= cutoff_date
        ).scalar() or 0
        
        # Total users
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # DAU/MAU ratio
        dau_mau = (active_users / total_users * 100) if total_users > 0 else 0
        
        # Average workflows per user
        avg_workflows = db.query(
            func.avg(func.count(Workflow.id))
        ).join(User).filter(
            User.created_at >= cutoff_date
        ).group_by(User.id).scalar() or 0
        
        # Average suggestions applied
        avg_suggestions_applied = db.query(
            func.avg(func.count(Suggestion.id))
        ).filter(
            and_(
                Suggestion.is_applied == True,
                Suggestion.created_at >= cutoff_date
            )
        ).group_by(Suggestion.user_id).scalar() or 0
        
        return {
            "period_days": days,
            "active_users": active_users,
            "total_users": total_users,
            "dau_mau_ratio": round(dau_mau, 2),
            "avg_workflows_per_user": round(avg_workflows, 2),
            "avg_suggestions_applied": round(avg_suggestions_applied, 2)
        }
    
    @staticmethod
    def get_comprehensive_dashboard(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive analytics dashboard."""
        return {
            "period_days": days,
            "activation": AnalyticsService.get_activation_metrics(db, days),
            "retention": AnalyticsService.get_retention_cohorts(db),
            "conversion_funnel": AnalyticsService.get_conversion_funnel(db, days),
            "growth": AnalyticsService.get_growth_metrics(db, days),
            "revenue": AnalyticsService.get_revenue_metrics(db, days),
            "engagement": AnalyticsService.get_engagement_metrics(db, days),
            "generated_at": datetime.utcnow().isoformat()
        }


# Backward compatibility alias
AnalyticsDashboard = AnalyticsService
