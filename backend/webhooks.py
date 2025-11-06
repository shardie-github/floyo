"""
Webhook route handlers for payment providers and external services.

Handles webhook events from Stripe, other payment providers, and integrations.
"""

from fastapi import APIRouter, Request, Header, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import logging
from backend.database import get_db
from backend.webhook_utils import (
    verify_stripe_webhook_signature,
    verify_webhook_signature,
    process_webhook_with_retry,
    get_webhook_history,
    verify_webhook_payload
)
from backend.monetization import BillingManager
from backend.error_handling import ValidationError, InternalServerError
from backend.config import settings
from database.models import User, Subscription, BillingEvent
from uuid import UUID

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="Stripe-Signature"),
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhook events.
    
    Verifies signature and processes payment events.
    """
    try:
        payload = await request.body()
        
        # Get Stripe webhook secret from settings
        webhook_secret = getattr(settings, 'stripe_webhook_secret', None)
        if not webhook_secret:
            logger.warning("Stripe webhook secret not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Webhook secret not configured"
            )
        
        # Verify signature
        if not verify_stripe_webhook_signature(payload, stripe_signature, webhook_secret):
            logger.warning("Invalid Stripe webhook signature")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature"
            )
        
        # Parse event
        import json
        event_data = json.loads(payload.decode())
        event_type = event_data.get("type")
        
        logger.info(f"Processing Stripe webhook: {event_type}")
        
        # Handle different event types
        if event_type == "payment_intent.succeeded":
            payment_intent = event_data.get("data", {}).get("object", {})
            payment_intent_id = payment_intent.get("id")
            amount = payment_intent.get("amount", 0) / 100  # Convert from cents
            metadata = payment_intent.get("metadata", {})
            subscription_id = metadata.get("subscription_id")
            
            if subscription_id:
                try:
                    subscription_uuid = UUID(subscription_id)
                    billing_event = BillingManager.create_billing_event(
                        db=db,
                        subscription_id=subscription_uuid,
                        event_type="payment",
                        amount=amount,
                        currency=payment_intent.get("currency", "usd").upper(),
                        external_id=payment_intent_id
                    )
                    
                    # Mark as successful
                    BillingManager.mark_payment_successful(
                        db=db,
                        billing_event_id=billing_event.id,
                        external_id=payment_intent_id
                    )
                    
                    logger.info(f"Payment processed: {payment_intent_id}")
                except Exception as e:
                    logger.error(f"Error processing payment: {e}", exc_info=True)
        
        elif event_type == "payment_intent.payment_failed":
            payment_intent = event_data.get("data", {}).get("object", {})
            payment_intent_id = payment_intent.get("id")
            metadata = payment_intent.get("metadata", {})
            subscription_id = metadata.get("subscription_id")
            
            if subscription_id:
                # Find billing event and mark as failed
                billing_event = db.query(BillingEvent).filter(
                    BillingEvent.external_id == payment_intent_id
                ).first()
                
                if billing_event:
                    billing_event.status = "failed"
                    billing_event.metadata["failure_reason"] = payment_intent.get("last_payment_error", {}).get("message")
                    db.commit()
        
        elif event_type == "customer.subscription.updated":
            subscription_data = event_data.get("data", {}).get("object", {})
            subscription_id = subscription_data.get("id")
            # Handle subscription updates
            logger.info(f"Subscription updated: {subscription_id}")
        
        elif event_type == "customer.subscription.deleted":
            subscription_data = event_data.get("data", {}).get("object", {})
            subscription_id = subscription_data.get("id")
            # Handle subscription cancellation
            logger.info(f"Subscription deleted: {subscription_id}")
        
        return JSONResponse(
            status_code=200,
            content={"received": True, "event_type": event_type}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {e}", exc_info=True)
        raise InternalServerError(f"Error processing webhook: {e}")


@router.post("/{provider}")
async def generic_webhook(
    provider: str,
    request: Request,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
    db: Session = Depends(get_db)
):
    """
    Handle generic webhook events from various providers.
    
    Supports HMAC signature verification.
    """
    try:
        payload = await request.body()
        
        # Get webhook secret from header or settings
        webhook_secret = x_webhook_secret or getattr(settings, f'{provider}_webhook_secret', None)
        
        if not webhook_secret:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Webhook secret not configured"
            )
        
        # Verify signature if provided
        if x_signature:
            if not verify_webhook_signature(payload, x_signature, webhook_secret):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid webhook signature"
                )
        
        # Parse payload
        import json
        try:
            event_data = json.loads(payload.decode())
        except json.JSONDecodeError:
            event_data = {"raw": payload.decode()}
        
        # Verify required fields
        required_fields = ["event_type", "data"]
        is_valid, error_msg = verify_webhook_payload(event_data, required_fields)
        
        if not is_valid:
            raise ValidationError(error_msg or "Invalid webhook payload")
        
        logger.info(f"Processing {provider} webhook: {event_data.get('event_type')}")
        
        # Process webhook based on provider
        # This is a generic handler - implement provider-specific logic as needed
        
        return JSONResponse(
            status_code=200,
            content={"received": True, "provider": provider}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing {provider} webhook: {e}", exc_info=True)
        raise InternalServerError(f"Error processing webhook: {e}")


@router.get("/history")
async def get_webhook_history_endpoint(
    subscription_id: Optional[UUID] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get webhook processing history.
    
    Returns webhook events. If subscription_id is provided, returns events for that subscription.
    Note: In production, add authentication dependency: current_user: User = Depends(get_current_user)
    """
    # If subscription_id provided, verify it exists
    if subscription_id:
        subscription = db.query(Subscription).filter(
            Subscription.id == subscription_id
        ).first()
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )
    
    history = get_webhook_history(db, subscription_id, limit)
    
    return {
        "webhooks": history,
        "total": len(history)
    }
