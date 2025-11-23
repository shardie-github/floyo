"""Billing API endpoints (legacy - use v1/billing for new code)."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.monetization import SubscriptionManager, UsageTracker, PricingCalculator
from backend.stripe_integration import StripeIntegration
from backend.logging_config import get_logger
from backend.auth.utils import get_current_user
from database.models import User, Subscription, SubscriptionPlan

logger = get_logger(__name__)
router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/plans")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_subscription_plans(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get available subscription plans.
    
    View pricing plans and features to choose the best fit for your needs.
    """
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return [
        {
            "id": str(plan.id),
            "name": plan.name,
            "tier": plan.tier,
            "description": plan.description,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "features": plan.features
        }
        for plan in plans
    ]


@router.get("/subscription")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_subscription(
    request: Request,
    organization_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user/organization subscription."""
    if organization_id:
        subscription = db.query(Subscription).filter(
            Subscription.organization_id == organization_id,
            Subscription.status == "active"
        ).first()
    else:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
    
    if not subscription:
        return {"status": "no_subscription", "tier": "free"}
    
    return {
        "id": str(subscription.id),
        "plan": subscription.plan.name,
        "tier": subscription.plan.tier,
        "billing_cycle": subscription.billing_cycle,
        "status": subscription.status,
        "price": subscription.price,
        "current_period_end": subscription.current_period_end.isoformat()
    }


@router.post("/subscribe")
@limiter.limit("10/hour")  # Restrictive for subscription creation
async def create_subscription(
    request: Request,
    plan_id: UUID,
    billing_cycle: str = "monthly",
    organization_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a subscription."""
    subscription = SubscriptionManager.create_subscription(
        db, current_user.id, organization_id, plan_id, billing_cycle
    )
    return {
        "id": str(subscription.id),
        "status": subscription.status,
        "plan": subscription.plan.name
    }


@router.post("/subscription/{subscription_id}/cancel")
@limiter.limit("5/hour")  # Restrictive for cancellation
async def cancel_subscription(
    request: Request,
    subscription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a subscription."""
    subscription = SubscriptionManager.cancel_subscription(db, subscription_id, current_user.id)
    return {"message": "Subscription canceled", "status": subscription.status}


@router.get("/usage")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_usage(
    request: Request,
    metric_type: str = "events",
    organization_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get usage metrics for current user/organization.
    
    Monitor your usage against plan limits to avoid overages.
    """
    # Get subscription tier
    if organization_id:
        subscription = db.query(Subscription).filter(
            Subscription.organization_id == organization_id,
            Subscription.status == "active"
        ).first()
    else:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
    
    tier = subscription.plan.tier if subscription else "free"
    
    usage = UsageTracker.get_usage(db, current_user.id, organization_id, metric_type)
    limit_check = UsageTracker.check_limit(db, current_user.id, organization_id, metric_type, tier)
    
    return {
        "metric_type": metric_type,
        "current_usage": usage,
        "tier": tier,
        **limit_check
    }


@router.get("/ltv-cac")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_ltv_cac(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get LTV:CAC ratio (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    ltv_cac = PricingCalculator.calculate_ltv_cac(db)
    return ltv_cac


@router.post("/stripe/subscribe")
@limiter.limit("10/hour")  # Restrictive for payment operations
async def create_stripe_subscription(
    request: Request,
    plan_id: UUID,
    payment_method_id: Optional[str] = None,
    billing_cycle: str = "monthly",
    organization_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe subscription.
    
    Subscribe using Stripe for secure payment processing and automatic renewals.
    """
    try:
        result = StripeIntegration.create_subscription(
            db=db,
            user_id=current_user.id,
            plan_id=plan_id,
            payment_method_id=payment_method_id,
            billing_cycle=billing_cycle,
            organization_id=organization_id
        )
        return result
    except Exception as e:
        logger.error(f"Error creating Stripe subscription: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stripe/subscription/{subscription_id}/cancel")
@limiter.limit("5/hour")  # Restrictive for cancellation
async def cancel_stripe_subscription(
    request: Request,
    subscription_id: UUID,
    cancel_immediately: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a Stripe subscription."""
    try:
        result = StripeIntegration.cancel_subscription(
            db=db,
            subscription_id=subscription_id,
            user_id=current_user.id,
            cancel_immediately=cancel_immediately
        )
        return result
    except Exception as e:
        logger.error(f"Error canceling Stripe subscription: {e}")
        raise HTTPException(status_code=400, detail=str(e))
