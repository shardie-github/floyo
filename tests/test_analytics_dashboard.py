"""Tests for analytics dashboard functionality."""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import Session
from database.models import User, Workflow, Subscription, SubscriptionPlan
from backend.analytics_dashboard import AnalyticsDashboard


@pytest.fixture
def test_user(db: Session):
    """Create a test user."""
    user = User(
        id=uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow() - timedelta(days=10)
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
        features={"max_workflows": 50},
        is_active=True
    )
    db.add(plan)
    db.commit()
    return plan


def test_get_activation_metrics(db: Session, test_user):
    """Test activation metrics calculation."""
    # Create a workflow (activation)
    workflow = Workflow(
        id=uuid4(),
        user_id=test_user.id,
        name="Test Workflow",
        steps=[],
        is_active=True,
        version=1,
        created_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(workflow)
    db.commit()
    
    metrics = AnalyticsDashboard.get_activation_metrics(db, days=30)
    
    assert metrics["total_signups"] >= 1
    assert metrics["activated_users"] >= 1
    assert metrics["activation_rate"] > 0


def test_get_retention_cohorts(db: Session, test_user):
    """Test retention cohort calculation."""
    # Create a workflow to mark user as retained
    workflow = Workflow(
        id=uuid4(),
        user_id=test_user.id,
        name="Test Workflow",
        steps=[],
        is_active=True,
        version=1,
        created_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(workflow)
    db.commit()
    
    cohorts = AnalyticsDashboard.get_retention_cohorts(db)
    
    assert "d1" in cohorts
    assert "d7" in cohorts
    assert "d30" in cohorts


def test_get_conversion_funnel(db: Session, test_user, test_plan):
    """Test conversion funnel calculation."""
    # Create workflow (activation)
    workflow = Workflow(
        id=uuid4(),
        user_id=test_user.id,
        name="Test Workflow",
        steps=[],
        is_active=True,
        version=1
    )
    db.add(workflow)
    
    # Create subscription (conversion)
    subscription = Subscription(
        id=uuid4(),
        user_id=test_user.id,
        plan_id=test_plan.id,
        billing_cycle="monthly",
        status="active",
        price=29.0,
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=30)
    )
    db.add(subscription)
    db.commit()
    
    funnel = AnalyticsDashboard.get_conversion_funnel(db, days=30)
    
    assert funnel["funnel"]["signups"] >= 1
    assert funnel["funnel"]["activated"] >= 1
    assert funnel["funnel"]["subscribed"] >= 1


def test_get_revenue_metrics(db: Session, test_user, test_plan):
    """Test revenue metrics calculation."""
    # Create active subscription
    subscription = Subscription(
        id=uuid4(),
        user_id=test_user.id,
        plan_id=test_plan.id,
        billing_cycle="monthly",
        status="active",
        price=29.0,
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=30)
    )
    db.add(subscription)
    db.commit()
    
    metrics = AnalyticsDashboard.get_revenue_metrics(db, days=30)
    
    assert metrics["mrr"] >= 29.0
    assert metrics["arr"] >= 29.0 * 12
    assert metrics["total_subscriptions"] >= 1


def test_get_comprehensive_dashboard(db: Session, test_user):
    """Test comprehensive dashboard."""
    dashboard = AnalyticsDashboard.get_comprehensive_dashboard(db, days=30)
    
    assert "activation" in dashboard
    assert "retention" in dashboard
    assert "conversion_funnel" in dashboard
    assert "growth" in dashboard
    assert "revenue" in dashboard
    assert "engagement" in dashboard
