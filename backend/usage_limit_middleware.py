"""Middleware for enforcing usage limits based on subscription tier."""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Callable
from sqlalchemy.orm import Session
from database.models import User, Subscription, UsageMetric
from backend.monetization import SubscriptionManager, UsageTracker
from backend.database import get_db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class UsageLimitMiddleware:
    """Middleware to enforce usage limits."""
    
    @staticmethod
    async def check_usage_limit(
        request: Request,
        call_next: Callable,
        metric_type: str,
        amount: int = 1
    ):
        """Check if user has exceeded usage limit for a metric."""
        # Get user from request (assuming auth middleware sets this)
        user = getattr(request.state, "user", None)
        if not user:
            # No user, skip limit check
            return await call_next(request)
        
        # Get user's subscription tier
        db: Session = request.state.db if hasattr(request.state, "db") else None
        if not db:
            # No DB session, skip limit check
            return await call_next(request)
        
        # Get subscription tier
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.status == "active"
        ).first()
        
        tier = subscription.plan.tier if subscription else "free"
        
        # Check limit
        limit_check = UsageTracker.check_limit(
            db=db,
            user_id=user.id,
            organization_id=None,
            metric_type=metric_type,
            tier=tier
        )
        
        if not limit_check.get("within_limit", True):
            # Limit exceeded
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": "usage_limit_exceeded",
                    "message": f"You have reached your {metric_type} limit for this billing period.",
                    "current_usage": limit_check.get("current_usage", 0),
                    "limit": limit_check.get("limit"),
                    "tier": tier,
                    "upgrade_url": "/pricing"
                }
            )
        
        # Track usage
        UsageTracker.track_usage(
            db=db,
            user_id=user.id,
            organization_id=None,
            metric_type=metric_type,
            amount=amount
        )
        
        # Continue request
        response = await call_next(request)
        return response
    
    @staticmethod
    def create_limit_checker(metric_type: str, amount: int = 1):
        """Create a middleware function for a specific metric type."""
        async def limit_checker(request: Request, call_next: Callable):
            return await UsageLimitMiddleware.check_usage_limit(
                request, call_next, metric_type, amount
            )
        return limit_checker


def check_workflow_limit(request: Request, call_next: Callable):
    """Check workflow creation limit."""
    return UsageLimitMiddleware.check_usage_limit(
        request, call_next, "workflow", 1
    )


def check_event_limit(request: Request, call_next: Callable):
    """Check event tracking limit."""
    return UsageLimitMiddleware.check_usage_limit(
        request, call_next, "event", 1
    )


def check_integration_limit(request: Request, call_next: Callable):
    """Check integration limit."""
    return UsageLimitMiddleware.check_usage_limit(
        request, call_next, "integration", 1
    )


def check_api_call_limit(request: Request, call_next: Callable):
    """Check API call limit."""
    return UsageLimitMiddleware.check_usage_limit(
        request, call_next, "api_call", 1
    )
