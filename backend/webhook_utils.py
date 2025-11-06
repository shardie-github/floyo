"""
Webhook signature verification and retry logic.

Provides utilities for webhook security and reliability:
- Signature verification (HMAC)
- Webhook retry logic
- Webhook event history
"""

import hmac
import hashlib
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.orm import Session
from database.models import BillingEvent
import logging

logger = logging.getLogger(__name__)

# Webhook retry configuration
WEBHOOK_MAX_RETRIES = 3
WEBHOOK_RETRY_DELAYS = [60, 300, 900]  # 1min, 5min, 15min
WEBHOOK_TIMEOUT_SECONDS = 30


def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str,
    algorithm: str = "sha256"
) -> bool:
    """
    Verify webhook signature using HMAC.
    
    Args:
        payload: Raw webhook payload bytes
        signature: Signature from webhook header
        secret: Shared secret key
        algorithm: Hash algorithm (sha256, sha1, etc.)
        
    Returns:
        bool: True if signature is valid
        
    Example:
        # Stripe-style signature verification
        signature = request.headers.get("Stripe-Signature")
        if verify_webhook_signature(request.body, signature, webhook_secret):
            # Process webhook
    """
    if algorithm == "sha256":
        hash_func = hashlib.sha256
    elif algorithm == "sha1":
        hash_func = hashlib.sha1
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    # Calculate expected signature
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hash_func
    ).hexdigest()
    
    # Compare signatures (constant-time comparison)
    return hmac.compare_digest(expected_signature, signature)


def verify_stripe_webhook_signature(
    payload: bytes,
    signature_header: str,
    secret: str
) -> bool:
    """
    Verify Stripe webhook signature.
    
    Stripe uses a different signature format with timestamps.
    
    Args:
        payload: Raw webhook payload bytes
        signature_header: Stripe-Signature header value
        secret: Stripe webhook secret
        
    Returns:
        bool: True if signature is valid
    """
    try:
        import stripe
        return stripe.Webhook.construct_event(
            payload,
            signature_header,
            secret
        ) is not None
    except ImportError:
        logger.warning("Stripe library not installed, using basic verification")
        # Fallback to basic verification
        return verify_webhook_signature(payload, signature_header, secret)
    except Exception as e:
        logger.error(f"Stripe webhook verification failed: {e}")
        return False


def process_webhook_with_retry(
    db: Session,
    webhook_event_id: UUID,
    webhook_handler: callable,
    max_retries: int = WEBHOOK_MAX_RETRIES
) -> Dict[str, Any]:
    """
    Process webhook with automatic retry logic.
    
    Args:
        db: Database session
        webhook_event_id: Webhook event ID
        webhook_handler: Function to handle webhook
        max_retries: Maximum number of retry attempts
        
    Returns:
        Dict[str, Any]: Processing result
    """
    from backend.monetization import BillingManager
    
    billing_event = db.query(BillingEvent).filter(
        BillingEvent.id == webhook_event_id
    ).first()
    
    if not billing_event:
        return {
            "success": False,
            "error": "Webhook event not found"
        }
    
    retry_count = billing_event.metadata.get("retry_count", 0)
    
    if retry_count >= max_retries:
        billing_event.metadata["retry_exhausted"] = True
        billing_event.status = "failed"
        db.commit()
        
        logger.error(
            f"Webhook retry exhausted for event {webhook_event_id}",
            extra={"retry_count": retry_count, "max_retries": max_retries}
        )
        
        return {
            "success": False,
            "error": "Max retries exceeded",
            "retry_count": retry_count
        }
    
    try:
        # Process webhook
        result = webhook_handler(billing_event)
        
        # Mark as successful
        billing_event.status = "completed"
        billing_event.metadata["processed_at"] = datetime.utcnow().isoformat()
        billing_event.metadata["retry_count"] = retry_count
        db.commit()
        
        logger.info(
            f"Webhook processed successfully: {webhook_event_id}",
            extra={"retry_count": retry_count}
        )
        
        return {
            "success": True,
            "result": result,
            "retry_count": retry_count
        }
        
    except Exception as e:
        # Increment retry count
        retry_count += 1
        billing_event.metadata["retry_count"] = retry_count
        billing_event.metadata["last_retry_at"] = datetime.utcnow().isoformat()
        billing_event.metadata["last_error"] = str(e)
        db.commit()
        
        logger.warning(
            f"Webhook processing failed, will retry: {webhook_event_id}",
            extra={"retry_count": retry_count, "error": str(e)},
            exc_info=True
        )
        
        return {
            "success": False,
            "error": str(e),
            "retry_count": retry_count,
            "will_retry": retry_count < max_retries
        }


def schedule_webhook_retry(
    db: Session,
    webhook_event_id: UUID,
    retry_delay_seconds: int
) -> bool:
    """
    Schedule a webhook retry after delay.
    
    Args:
        db: Database session
        webhook_event_id: Webhook event ID
        retry_delay_seconds: Delay before retry
        
    Returns:
        bool: True if scheduled successfully
    """
    # In production, use Celery or similar task queue
    # For now, just update metadata
    billing_event = db.query(BillingEvent).filter(
        BillingEvent.id == webhook_event_id
    ).first()
    
    if not billing_event:
        return False
    
    retry_at = datetime.utcnow() + timedelta(seconds=retry_delay_seconds)
    billing_event.metadata["retry_at"] = retry_at.isoformat()
    billing_event.status = "pending"
    db.commit()
    
    logger.info(
        f"Scheduled webhook retry for {webhook_event_id} at {retry_at}",
        extra={"retry_delay_seconds": retry_delay_seconds}
    )
    
    return True


def get_webhook_history(
    db: Session,
    subscription_id: Optional[UUID] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get webhook processing history.
    
    Args:
        db: Database session
        subscription_id: Optional subscription ID filter
        limit: Maximum number of events to return
        
    Returns:
        List[Dict[str, Any]]: Webhook event history
    """
    query = db.query(BillingEvent).filter(
        BillingEvent.event_type.in_(["webhook", "payment", "refund"])
    )
    
    if subscription_id:
        query = query.filter(BillingEvent.subscription_id == subscription_id)
    
    events = query.order_by(BillingEvent.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": str(event.id),
            "subscription_id": str(event.subscription_id),
            "event_type": event.event_type,
            "status": event.status,
            "created_at": event.created_at.isoformat(),
            "retry_count": event.metadata.get("retry_count", 0),
            "last_error": event.metadata.get("last_error"),
            "metadata": event.metadata,
        }
        for event in events
    ]


def verify_webhook_payload(
    payload: Dict[str, Any],
    required_fields: List[str]
) -> tuple[bool, Optional[str]]:
    """
    Verify webhook payload has required fields.
    
    Args:
        payload: Webhook payload dictionary
        required_fields: List of required field names
        
    Returns:
        tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    missing_fields = [field for field in required_fields if field not in payload]
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None
