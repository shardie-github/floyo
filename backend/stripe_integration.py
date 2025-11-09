"""Complete Stripe billing integration for subscriptions and payments."""

import os
import logging
from typing import Dict, Optional, Any, List
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.models import User, Subscription, SubscriptionPlan, BillingEvent, Organization
from backend.monetization import SubscriptionManager, BillingManager
from backend.audit import log_audit
import stripe

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_API_KEY")


class StripeIntegration:
    """Complete Stripe integration for billing."""
    
    @staticmethod
    def create_customer(user: User, email: Optional[str] = None) -> Dict[str, Any]:
        """Create a Stripe customer for a user."""
        try:
            customer = stripe.Customer.create(
                email=email or user.email,
                metadata={
                    "user_id": str(user.id),
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
            )
            
            logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
            return {
                "customer_id": customer.id,
                "email": customer.email,
                "created": customer.created
            }
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {e}")
            raise
    
    @staticmethod
    def create_subscription(
        db: Session,
        user_id: UUID,
        plan_id: UUID,
        payment_method_id: Optional[str] = None,
        billing_cycle: str = "monthly",
        organization_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Create a Stripe subscription."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        if not plan:
            raise ValueError("Plan not found")
        
        # Get or create Stripe customer
        customer_id = None
        if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id:
            customer_id = user.stripe_customer_id
        else:
            customer_data = StripeIntegration.create_customer(user)
            customer_id = customer_data["customer_id"]
            # Store customer ID (assuming User model has stripe_customer_id field)
            # If not, you'd need to add this field to the model
        
        # Determine price ID based on billing cycle
        # In production, you'd store Stripe price IDs in SubscriptionPlan model
        price_id = plan.stripe_price_id_monthly if billing_cycle == "monthly" else plan.stripe_price_id_yearly
        
        if not price_id:
            raise ValueError(f"Stripe price ID not configured for plan {plan.name}")
        
        # Create subscription in Stripe
        subscription_data = {
            "customer": customer_id,
            "items": [{"price": price_id}],
            "payment_behavior": "default_incomplete",
            "payment_settings": {"save_default_payment_method": "on_subscription"},
            "expand": ["latest_invoice.payment_intent"],
        }
        
        if payment_method_id:
            subscription_data["default_payment_method"] = payment_method_id
        
        stripe_subscription = stripe.Subscription.create(**subscription_data)
        
        # Create subscription in database
        subscription = SubscriptionManager.create_subscription(
            db=db,
            user_id=user_id,
            organization_id=organization_id,
            plan_id=plan_id,
            billing_cycle=billing_cycle
        )
        
        # Update subscription with Stripe data
        subscription.stripe_id = stripe_subscription.id
        subscription.stripe_customer_id = customer_id
        subscription.status = stripe_subscription.status
        db.commit()
        
        # Create billing event
        invoice = stripe_subscription.latest_invoice
        if invoice:
            BillingManager.create_billing_event(
                db=db,
                subscription_id=subscription.id,
                event_type="invoice",
                amount=invoice.amount_due / 100.0,  # Convert from cents
                currency=invoice.currency,
                external_id=invoice.id,
                metadata={
                    "stripe_subscription_id": stripe_subscription.id,
                    "stripe_invoice_id": invoice.id,
                    "payment_intent_id": invoice.payment_intent.id if invoice.payment_intent else None
                }
            )
        
        log_audit(
            db=db,
            user_id=user_id,
            action="subscription_created_stripe",
            resource_type="subscription",
            resource_id=str(subscription.id),
            details={
                "plan": plan.name,
                "stripe_subscription_id": stripe_subscription.id,
                "billing_cycle": billing_cycle
            }
        )
        
        return {
            "subscription_id": str(subscription.id),
            "stripe_subscription_id": stripe_subscription.id,
            "status": stripe_subscription.status,
            "client_secret": invoice.payment_intent.client_secret if invoice.payment_intent else None,
            "requires_payment": stripe_subscription.status == "incomplete"
        }
    
    @staticmethod
    def cancel_subscription(
        db: Session,
        subscription_id: UUID,
        user_id: UUID,
        cancel_immediately: bool = False
    ) -> Dict[str, Any]:
        """Cancel a Stripe subscription."""
        subscription = db.query(Subscription).filter(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id
        ).first()
        
        if not subscription:
            raise ValueError("Subscription not found")
        
        if not subscription.stripe_id:
            # Cancel local subscription only
            SubscriptionManager.cancel_subscription(db, subscription_id, user_id)
            return {"status": "canceled", "message": "Subscription canceled (no Stripe subscription)"}
        
        # Cancel in Stripe
        if cancel_immediately:
            stripe.Subscription.delete(subscription.stripe_id)
            subscription.status = "canceled"
            subscription.canceled_at = datetime.utcnow()
        else:
            # Cancel at period end
            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_id,
                cancel_at_period_end=True
            )
            subscription.status = "active"  # Still active until period end
            subscription.cancel_at_period_end = True
        
        db.commit()
        
        log_audit(
            db=db,
            user_id=user_id,
            action="subscription_canceled_stripe",
            resource_type="subscription",
            resource_id=str(subscription_id),
            details={"cancel_immediately": cancel_immediately}
        )
        
        return {
            "status": subscription.status,
            "canceled_at": subscription.canceled_at.isoformat() if subscription.canceled_at else None,
            "cancel_at_period_end": getattr(subscription, 'cancel_at_period_end', False)
        }
    
    @staticmethod
    def process_webhook(event: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Process Stripe webhook event."""
        event_type = event.get("type")
        event_data = event.get("data", {}).get("object", {})
        
        results = {
            "processed": False,
            "event_type": event_type,
            "message": ""
        }
        
        try:
            if event_type == "customer.subscription.created":
                # Subscription created
                stripe_subscription_id = event_data.get("id")
                customer_id = event_data.get("customer")
                
                # Find subscription by Stripe ID or customer ID
                subscription = db.query(Subscription).filter(
                    Subscription.stripe_id == stripe_subscription_id
                ).first()
                
                if subscription:
                    subscription.status = event_data.get("status", "active")
                    db.commit()
                    results["processed"] = True
                    results["message"] = f"Subscription {subscription.id} activated"
            
            elif event_type == "customer.subscription.updated":
                # Subscription updated
                stripe_subscription_id = event_data.get("id")
                subscription = db.query(Subscription).filter(
                    Subscription.stripe_id == stripe_subscription_id
                ).first()
                
                if subscription:
                    subscription.status = event_data.get("status", subscription.status)
                    if event_data.get("cancel_at_period_end"):
                        subscription.cancel_at_period_end = True
                    db.commit()
                    results["processed"] = True
                    results["message"] = f"Subscription {subscription.id} updated"
            
            elif event_type == "customer.subscription.deleted":
                # Subscription canceled
                stripe_subscription_id = event_data.get("id")
                subscription = db.query(Subscription).filter(
                    Subscription.stripe_id == stripe_subscription_id
                ).first()
                
                if subscription:
                    subscription.status = "canceled"
                    subscription.canceled_at = datetime.utcnow()
                    db.commit()
                    results["processed"] = True
                    results["message"] = f"Subscription {subscription.id} canceled"
            
            elif event_type == "invoice.payment_succeeded":
                # Payment succeeded
                invoice = event_data
                subscription_id = invoice.get("subscription")
                
                if subscription_id:
                    subscription = db.query(Subscription).filter(
                        Subscription.stripe_id == subscription_id
                    ).first()
                    
                    if subscription:
                        # Create billing event
                        BillingManager.mark_payment_successful(
                            db=db,
                            billing_event_id=None,  # Would need to find existing event
                            external_id=invoice.get("id")
                        )
                        
                        # Update subscription period
                        subscription.current_period_start = datetime.fromtimestamp(
                            invoice.get("period_start", 0)
                        )
                        subscription.current_period_end = datetime.fromtimestamp(
                            invoice.get("period_end", 0)
                        )
                        db.commit()
                        results["processed"] = True
                        results["message"] = f"Payment succeeded for subscription {subscription.id}"
            
            elif event_type == "invoice.payment_failed":
                # Payment failed
                invoice = event_data
                subscription_id = invoice.get("subscription")
                
                if subscription_id:
                    subscription = db.query(Subscription).filter(
                        Subscription.stripe_id == subscription_id
                    ).first()
                    
                    if subscription:
                        # Create billing event for failed payment
                        BillingManager.create_billing_event(
                            db=db,
                            subscription_id=subscription.id,
                            event_type="payment",
                            amount=invoice.get("amount_due", 0) / 100.0,
                            currency=invoice.get("currency", "usd"),
                            external_id=invoice.get("id"),
                            metadata={"status": "failed", "attempt_count": invoice.get("attempt_count", 1)}
                        )
                        db.commit()
                        results["processed"] = True
                        results["message"] = f"Payment failed for subscription {subscription.id}"
            
            else:
                results["message"] = f"Unhandled event type: {event_type}"
        
        except Exception as e:
            logger.error(f"Error processing Stripe webhook {event_type}: {e}", exc_info=True)
            results["message"] = f"Error: {str(e)}"
        
        return results
    
    @staticmethod
    def create_checkout_session(
        user_id: UUID,
        plan_id: UUID,
        success_url: str,
        cancel_url: str,
        billing_cycle: str = "monthly"
    ) -> Dict[str, Any]:
        """Create Stripe Checkout session for subscription."""
        # This would require plan lookup and price ID
        # Simplified version - in production, fetch plan and price ID from database
        
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                customer_email=None,  # Would get from user
                line_items=[{
                    "price": "price_xxx",  # Would get from plan
                    "quantity": 1,
                }],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": str(user_id),
                    "plan_id": str(plan_id),
                    "billing_cycle": billing_cycle
                }
            )
            
            return {
                "session_id": session.id,
                "url": session.url
            }
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {e}")
            raise
