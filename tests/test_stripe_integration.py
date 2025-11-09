"""Tests for Stripe integration (mocked)."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.models import User, SubscriptionPlan
from backend.stripe_integration import StripeIntegration


@pytest.fixture
def test_user(db: Session):
    """Create a test user."""
    user = User(
        id=uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="hashed",
        is_active=True
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def test_plan(db: Session):
    """Create a test subscription plan."""
    plan = SubscriptionPlan(
        id=uuid4(),
        name="Pro",
        tier="pro",
        description="Pro plan",
        price_monthly=29.0,
        price_yearly=290.0,
        features={
            "max_workflows": 50,
            "stripe_price_id_monthly": "price_test_monthly",
            "stripe_price_id_yearly": "price_test_yearly"
        },
        is_active=True
    )
    db.add(plan)
    db.commit()
    return plan


@patch('backend.stripe_integration.stripe')
def test_create_customer(mock_stripe, test_user):
    """Test Stripe customer creation."""
    mock_customer = Mock()
    mock_customer.id = "cus_test123"
    mock_customer.email = test_user.email
    mock_customer.created = int(datetime.utcnow().timestamp())
    mock_stripe.Customer.create.return_value = mock_customer
    
    result = StripeIntegration.create_customer(test_user)
    
    assert result["customer_id"] == "cus_test123"
    assert result["email"] == test_user.email
    mock_stripe.Customer.create.assert_called_once()


@patch('backend.stripe_integration.stripe')
@patch('backend.stripe_integration.SubscriptionManager')
def test_create_subscription(mock_subscription_manager, mock_stripe, db: Session, test_user, test_plan):
    """Test subscription creation."""
    # Mock Stripe customer
    mock_customer = Mock()
    mock_customer.id = "cus_test123"
    mock_stripe.Customer.create.return_value = mock_customer
    
    # Mock Stripe subscription
    mock_subscription = Mock()
    mock_subscription.id = "sub_test123"
    mock_subscription.status = "active"
    mock_invoice = Mock()
    mock_payment_intent = Mock()
    mock_payment_intent.client_secret = "pi_test_secret"
    mock_invoice.payment_intent = mock_payment_intent
    mock_subscription.latest_invoice = mock_invoice
    mock_stripe.Subscription.create.return_value = mock_subscription
    
    # Mock subscription manager
    mock_subscription_obj = Mock()
    mock_subscription_obj.id = uuid4()
    mock_subscription_obj.stripe_subscription_id = None
    mock_subscription_manager.create_subscription.return_value = mock_subscription_obj
    
    result = StripeIntegration.create_subscription(
        db=db,
        user_id=test_user.id,
        plan_id=test_plan.id,
        billing_cycle="monthly"
    )
    
    assert result["subscription_id"] is not None
    assert result["stripe_subscription_id"] == "sub_test123"
    assert result["status"] == "active"


@patch('backend.stripe_integration.stripe')
def test_process_webhook_subscription_created(mock_stripe, db: Session):
    """Test webhook processing for subscription created."""
    event = {
        "type": "customer.subscription.created",
        "data": {
            "object": {
                "id": "sub_test123",
                "status": "active"
            }
        }
    }
    
    # Mock subscription query
    with patch('database.models.Subscription') as mock_subscription_model:
        mock_subscription = Mock()
        mock_subscription.id = uuid4()
        mock_subscription.stripe_subscription_id = "sub_test123"
        mock_subscription.status = "active"
        
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_subscription
        db.query.return_value = mock_query
        
        result = StripeIntegration.process_webhook(event, db)
        
        assert result["processed"] is True
        assert "Subscription" in result["message"]


def test_process_webhook_unhandled_event(db: Session):
    """Test webhook processing for unhandled event."""
    event = {
        "type": "unknown.event",
        "data": {
            "object": {}
        }
    }
    
    result = StripeIntegration.process_webhook(event, db)
    
    assert result["processed"] is False
    assert "Unhandled" in result["message"]
