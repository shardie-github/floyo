"""Monetization system: billing, subscriptions, and tier-based features."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database.models import User, Organization, Subscription, SubscriptionPlan, UsageMetric, BillingEvent
from backend.audit import log_audit
import logging

logger = logging.getLogger(__name__)


class SubscriptionManager:
    """Manage subscriptions and billing."""
    
    # Tier definitions
    TIERS = {
        "free": {
            "name": "Free",
            "price_monthly": 0,
            "price_yearly": 0,
            "features": {
                "max_workflows": 3,
                "max_events_per_month": 1000,
                "max_integrations": 2,
                "max_team_members": 1,
                "api_calls_per_month": 1000,
                "storage_gb": 1,
                "support_level": "community"
            }
        },
        "pro": {
            "name": "Pro",
            "price_monthly": 29,
            "price_yearly": 290,  # ~20% discount
            "features": {
                "max_workflows": 50,
                "max_events_per_month": 100000,
                "max_integrations": 10,
                "max_team_members": 5,
                "api_calls_per_month": 100000,
                "storage_gb": 50,
                "support_level": "email",
                "advanced_analytics": True,
                "workflow_scheduling": True,
                "api_access": True
            }
        },
        "enterprise": {
            "name": "Enterprise",
            "price_monthly": 299,
            "price_yearly": 2990,  # ~17% discount
            "features": {
                "max_workflows": -1,  # Unlimited
                "max_events_per_month": -1,  # Unlimited
                "max_integrations": -1,  # Unlimited
                "max_team_members": -1,  # Unlimited
                "api_calls_per_month": -1,  # Unlimited
                "storage_gb": -1,  # Unlimited
                "support_level": "dedicated",
                "advanced_analytics": True,
                "workflow_scheduling": True,
                "api_access": True,
                "sso": True,
                "audit_logs": True,
                "custom_integrations": True,
                "white_label": True,
                "priority_support": True
            }
        }
    }
    
    @staticmethod
    def get_tier_features(tier: str) -> Dict[str, Any]:
        """Get features for a subscription tier."""
        return SubscriptionManager.TIERS.get(tier, SubscriptionManager.TIERS["free"]).get("features", {})
    
    @staticmethod
    def check_feature_access(
        db: Session,
        user_id: UUID,
        organization_id: Optional[UUID],
        feature: str
    ) -> bool:
        """Check if user/organization has access to a feature."""
        # Get subscription
        if organization_id:
            subscription = db.query(Subscription).filter(
                Subscription.organization_id == organization_id,
                Subscription.status == "active"
            ).first()
        else:
            subscription = db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == "active"
            ).first()
        
        if not subscription:
            tier = "free"
        else:
            tier = subscription.plan.tier
        
        features = SubscriptionManager.get_tier_features(tier)
        return features.get(feature, False)
    
    @staticmethod
    def create_subscription(
        db: Session,
        user_id: UUID,
        organization_id: Optional[UUID],
        plan_id: UUID,
        billing_cycle: str = "monthly"
    ) -> Subscription:
        """Create a new subscription."""
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        if not plan:
            raise ValueError("Plan not found")
        
        # Calculate pricing
        price = plan.price_monthly if billing_cycle == "monthly" else plan.price_yearly
        
        # Calculate next billing date
        if billing_cycle == "monthly":
            next_billing = datetime.utcnow() + timedelta(days=30)
        else:
            next_billing = datetime.utcnow() + timedelta(days=365)
        
        subscription = Subscription(
            user_id=user_id,
            organization_id=organization_id,
            plan_id=plan_id,
            billing_cycle=billing_cycle,
            status="active",
            current_period_start=datetime.utcnow(),
            current_period_end=next_billing,
            price=price
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        
        # Update organization tier if applicable
        if organization_id:
            org = db.query(Organization).filter(Organization.id == organization_id).first()
            if org:
                org.subscription_tier = plan.tier
                db.commit()
        
        log_audit(
            db=db,
            user_id=user_id,
            action="subscription_created",
            resource_type="subscription",
            resource_id=str(subscription.id),
            details={"plan": plan.name, "tier": plan.tier, "billing_cycle": billing_cycle}
        )
        
        return subscription
    
    @staticmethod
    def cancel_subscription(
        db: Session,
        subscription_id: UUID,
        user_id: UUID
    ) -> Subscription:
        """Cancel a subscription (cancels at end of period)."""
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise ValueError("Subscription not found")
        
        if subscription.user_id != user_id:
            raise ValueError("Unauthorized")
        
        subscription.status = "canceled"
        subscription.canceled_at = datetime.utcnow()
        db.commit()
        db.refresh(subscription)
        
        log_audit(
            db=db,
            user_id=user_id,
            action="subscription_canceled",
            resource_type="subscription",
            resource_id=str(subscription_id),
            details={}
        )
        
        return subscription


class UsageTracker:
    """Track usage metrics for billing and limits."""
    
    @staticmethod
    def track_usage(
        db: Session,
        user_id: UUID,
        organization_id: Optional[UUID],
        metric_type: str,
        amount: int = 1
    ) -> UsageMetric:
        """Track a usage metric."""
        # Get current period
        period_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Find or create usage metric
        usage = db.query(UsageMetric).filter(
            and_(
                UsageMetric.user_id == user_id,
                UsageMetric.organization_id == organization_id,
                UsageMetric.metric_type == metric_type,
                UsageMetric.period_start == period_start
            )
        ).first()
        
        if usage:
            usage.amount += amount
            usage.updated_at = datetime.utcnow()
        else:
            usage = UsageMetric(
                user_id=user_id,
                organization_id=organization_id,
                metric_type=metric_type,
                amount=amount,
                period_start=period_start,
                period_end=period_start + timedelta(days=32) - timedelta(seconds=1)
            )
            db.add(usage)
        
        db.commit()
        db.refresh(usage)
        
        return usage
    
    @staticmethod
    def get_usage(
        db: Session,
        user_id: UUID,
        organization_id: Optional[UUID],
        metric_type: str,
        period_start: Optional[datetime] = None
    ) -> int:
        """Get current usage for a metric."""
        if not period_start:
            period_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        usage = db.query(UsageMetric).filter(
            and_(
                UsageMetric.user_id == user_id,
                UsageMetric.organization_id == organization_id,
                UsageMetric.metric_type == metric_type,
                UsageMetric.period_start == period_start
            )
        ).first()
        
        return usage.amount if usage else 0
    
    @staticmethod
    def check_limit(
        db: Session,
        user_id: UUID,
        organization_id: Optional[UUID],
        metric_type: str,
        tier: str
    ) -> Dict[str, Any]:
        """Check if usage is within limits."""
        current_usage = UsageTracker.get_usage(db, user_id, organization_id, metric_type)
        
        features = SubscriptionManager.get_tier_features(tier)
        limit_key = f"max_{metric_type}s_per_month"
        limit = features.get(limit_key, 0)
        
        # Unlimited if -1
        if limit == -1:
            return {
                "within_limit": True,
                "current_usage": current_usage,
                "limit": None,
                "remaining": None
            }
        
        return {
            "within_limit": current_usage < limit,
            "current_usage": current_usage,
            "limit": limit,
            "remaining": max(0, limit - current_usage)
        }


class BillingManager:
    """
    Manage billing events, invoices, and payment processing.
    
    Handles:
    - Invoice generation
    - Payment processing
    - Refunds
    - Payment retries
    - Webhook processing
    """
    
    # Payment retry configuration
    MAX_RETRY_ATTEMPTS = 3
    RETRY_DELAY_DAYS = [1, 3, 7]  # Days to wait before each retry
    
    @staticmethod
    def create_billing_event(
        db: Session,
        subscription_id: UUID,
        event_type: str,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None,
        external_id: Optional[str] = None
    ) -> BillingEvent:
        """
        Create a billing event (invoice, payment, refund, etc.).
        
        Args:
            db: Database session
            subscription_id: Subscription UUID
            event_type: Type of billing event (invoice, payment, refund, etc.)
            amount: Amount in currency units
            currency: Currency code (default: USD)
            metadata: Additional metadata dictionary
            external_id: External payment provider ID (e.g., Stripe payment intent ID)
            
        Returns:
            BillingEvent: Created billing event
            
        Raises:
            ValueError: If event_type is invalid or amount is negative
        """
        # Validate event type
        valid_types = ["invoice", "payment", "refund", "chargeback", "adjustment"]
        if event_type not in valid_types:
            raise ValueError(f"Invalid event_type. Must be one of: {valid_types}")
        
        # Validate amount (refunds can be negative)
        if event_type != "refund" and amount < 0:
            raise ValueError("Amount must be non-negative for non-refund events")
        
        event = BillingEvent(
            subscription_id=subscription_id,
            event_type=event_type,
            amount=amount,
            currency=currency,
            metadata=metadata or {},
            status="pending",
            external_id=external_id
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        
        logger.info(
            f"Created billing event {event.id} for subscription {subscription_id}",
            extra={
                "event_type": event_type,
                "amount": amount,
                "currency": currency,
            }
        )
        
        return event
    
    @staticmethod
    def get_billing_history(
        db: Session,
        subscription_id: UUID,
        limit: int = 50,
        event_type: Optional[str] = None
    ) -> List[BillingEvent]:
        """
        Get billing history for a subscription.
        
        Args:
            db: Database session
            subscription_id: Subscription UUID
            limit: Maximum number of events to return
            event_type: Optional filter by event type
            
        Returns:
            List[BillingEvent]: List of billing events, ordered by creation date (newest first)
        """
        query = db.query(BillingEvent).filter(
            BillingEvent.subscription_id == subscription_id
        )
        
        if event_type:
            query = query.filter(BillingEvent.event_type == event_type)
        
        return query.order_by(BillingEvent.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def process_payment_retry(
        db: Session,
        billing_event_id: UUID,
        retry_count: int
    ) -> bool:
        """
        Process payment retry for a failed billing event.
        
        Args:
            db: Database session
            billing_event_id: Billing event UUID
            retry_count: Current retry attempt number
            
        Returns:
            bool: True if retry should proceed, False if max retries exceeded
        """
        event = db.query(BillingEvent).filter(BillingEvent.id == billing_event_id).first()
        if not event:
            return False
        
        if retry_count > BillingManager.MAX_RETRY_ATTEMPTS:
            event.status = "failed"
            event.metadata["retry_exhausted"] = True
            db.commit()
            logger.warning(f"Payment retry exhausted for billing event {billing_event_id}")
            return False
        
        # Update retry metadata
        event.metadata["retry_count"] = retry_count
        event.metadata["last_retry_at"] = datetime.utcnow().isoformat()
        db.commit()
        
        logger.info(f"Processing payment retry {retry_count} for billing event {billing_event_id}")
        return True
    
    @staticmethod
    def mark_payment_successful(
        db: Session,
        billing_event_id: UUID,
        external_id: Optional[str] = None
    ) -> BillingEvent:
        """
        Mark a billing event as successfully paid.
        
        Args:
            db: Database session
            billing_event_id: Billing event UUID
            external_id: External payment provider ID
            
        Returns:
            BillingEvent: Updated billing event
        """
        event = db.query(BillingEvent).filter(BillingEvent.id == billing_event_id).first()
        if not event:
            raise ValueError("Billing event not found")
        
        event.status = "completed"
        event.completed_at = datetime.utcnow()
        if external_id:
            event.external_id = external_id
        
        db.commit()
        db.refresh(event)
        
        logger.info(f"Marked billing event {billing_event_id} as successful")
        return event
    
    @staticmethod
    def process_webhook(
        db: Session,
        webhook_data: Dict[str, Any],
        provider: str = "stripe"
    ) -> Optional[BillingEvent]:
        """
        Process webhook from payment provider.
        
        Args:
            db: Database session
            webhook_data: Webhook payload from payment provider
            provider: Payment provider name (default: stripe)
            
        Returns:
            Optional[BillingEvent]: Updated billing event if found, None otherwise
        """
        # This is a placeholder - implement based on your payment provider
        # Example for Stripe:
        # event_type = webhook_data.get("type")
        # if event_type == "payment_intent.succeeded":
        #     payment_intent = webhook_data.get("data", {}).get("object", {})
        #     external_id = payment_intent.get("id")
        #     # Find billing event by external_id and mark as successful
        
        logger.info(f"Processing webhook from {provider}")
        return None


class PricingCalculator:
    """Calculate pricing and costs."""
    
    @staticmethod
    def calculate_ltv_cac(
        db: Session,
        user_id: Optional[UUID] = None
    ) -> Dict[str, float]:
        """Calculate LTV:CAC ratio."""
        if user_id:
            # User-specific calculation
            subscription = db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == "active"
            ).first()
            
            if not subscription:
                return {"ltv": 0.0, "cac": 0.0, "ratio": 0.0}
            
            # Calculate LTV (simplified: average subscription value * average lifetime)
            monthly_price = subscription.price
            avg_lifetime_months = 12  # Simplified assumption
            ltv = monthly_price * avg_lifetime_months
            
            # CAC (simplified: assume $50 for acquisition)
            cac = 50.0
            
            return {
                "ltv": ltv,
                "cac": cac,
                "ratio": ltv / cac if cac > 0 else 0.0
            }
        else:
            # Platform-wide calculation
            active_subscriptions = db.query(Subscription).filter(
                Subscription.status == "active"
            ).all()
            
            if not active_subscriptions:
                return {"ltv": 0.0, "cac": 0.0, "ratio": 0.0}
            
            total_revenue = sum(sub.price for sub in active_subscriptions)
            avg_monthly_revenue = total_revenue / len(active_subscriptions) if active_subscriptions else 0
            avg_lifetime_months = 12
            ltv = avg_monthly_revenue * avg_lifetime_months
            
            cac = 50.0  # Platform average
            
            return {
                "ltv": round(ltv, 2),
                "cac": cac,
                "ratio": round(ltv / cac if cac > 0 else 0.0, 2),
                "total_subscriptions": len(active_subscriptions)
            }
