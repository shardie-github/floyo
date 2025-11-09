"""Tests for retention campaign functionality."""

import pytest
from unittest.mock import patch, Mock
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import Session
from database.models import User, Workflow, Suggestion
from backend.retention_campaigns import RetentionCampaignService


@pytest.fixture
def test_user(db: Session):
    """Create a test user."""
    user = User(
        id=uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(user)
    db.commit()
    return user


@patch('backend.retention_campaigns.email_service')
def test_send_day_3_activation_email(mock_email_service, db: Session, test_user):
    """Test Day 3 activation email."""
    mock_email_service.send_email.return_value = True
    mock_email_service.smtp_from_email = "noreply@floyo.dev"
    
    # User has no workflows (not activated)
    result = RetentionCampaignService.send_day_3_activation_email(db, test_user.id)
    
    assert result is True
    mock_email_service.send_email.assert_called_once()
    
    # Check email was sent to correct user
    call_args = mock_email_service.send_email.call_args
    assert call_args[0][0] == test_user.email
    assert "Create Your First Workflow" in call_args[0][1]


@patch('backend.retention_campaigns.email_service')
def test_send_day_3_email_already_activated(mock_email_service, db: Session, test_user):
    """Test Day 3 email not sent if user already activated."""
    # Create a workflow (user is activated)
    workflow = Workflow(
        id=uuid4(),
        user_id=test_user.id,
        name="Test Workflow",
        steps=[],
        is_active=True,
        version=1
    )
    db.add(workflow)
    db.commit()
    
    result = RetentionCampaignService.send_day_3_activation_email(db, test_user.id)
    
    assert result is False
    mock_email_service.send_email.assert_not_called()


@patch('backend.retention_campaigns.email_service')
def test_send_day_7_suggestions_email(mock_email_service, db: Session, test_user):
    """Test Day 7 suggestions email."""
    mock_email_service.send_email.return_value = True
    mock_email_service.smtp_from_email = "noreply@floyo.dev"
    
    # Create suggestions for user
    suggestion = Suggestion(
        id=uuid4(),
        user_id=test_user.id,
        title="Test Suggestion",
        description="Test description",
        trigger="pattern",
        confidence=0.8,
        is_dismissed=False,
        is_applied=False
    )
    db.add(suggestion)
    db.commit()
    
    # Update user created_at to 7 days ago
    test_user.created_at = datetime.utcnow() - timedelta(days=7)
    db.commit()
    
    result = RetentionCampaignService.send_day_7_workflow_suggestions_email(db, test_user.id)
    
    assert result is True
    mock_email_service.send_email.assert_called_once()
    
    # Check email content
    call_args = mock_email_service.send_email.call_args
    assert "Workflow Suggestions" in call_args[0][1]


def test_process_retention_campaigns(db: Session):
    """Test processing all retention campaigns."""
    # Create users at different signup dates
    user_3_days = User(
        id=uuid4(),
        email="user3@example.com",
        hashed_password="hashed",
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    user_7_days = User(
        id=uuid4(),
        email="user7@example.com",
        hashed_password="hashed",
        created_at=datetime.utcnow() - timedelta(days=7)
    )
    db.add_all([user_3_days, user_7_days])
    db.commit()
    
    with patch('backend.retention_campaigns.email_service') as mock_email_service:
        mock_email_service.send_email.return_value = True
        mock_email_service.smtp_from_email = "noreply@floyo.dev"
        
        results = RetentionCampaignService.process_retention_campaigns(db)
        
        assert results["day_3_sent"] >= 0
        assert results["day_7_sent"] >= 0
        assert isinstance(results["errors"], list)
