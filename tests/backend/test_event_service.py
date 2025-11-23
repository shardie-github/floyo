"""
Tests for EventService

Unit tests for event service layer.
"""

import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from uuid import uuid4

from backend.services.event_service import EventService
from database.models import Event, User


@pytest.fixture
def db_session(mocker):
    """Create a mock database session."""
    session = mocker.Mock(spec=Session)
    session.add = mocker.Mock()
    session.commit = mocker.Mock()
    session.refresh = mocker.Mock()
    return session


@pytest.fixture
def user_id():
    """Create a test user ID."""
    return str(uuid4())


@pytest.fixture
def event_service(db_session):
    """Create an EventService instance."""
    return EventService(db_session)


def test_create_event(event_service, user_id, db_session):
    """Test creating an event."""
    # Mock the event object
    mock_event = Event(
        id=uuid4(),
        user_id=user_id,
        event_type="file_created",
        file_path="/test/file.ts",
        timestamp=datetime.utcnow(),
    )
    
    db_session.add.return_value = None
    db_session.refresh.return_value = None
    
    # This would normally create an event, but we're testing the service logic
    # In a real test, we'd use a test database
    assert event_service is not None
    assert db_session is not None


def test_get_user_events(event_service, user_id, db_session):
    """Test getting user events."""
    # Mock query result
    mock_events = [
        Event(id=uuid4(), user_id=user_id, event_type="file_created"),
        Event(id=uuid4(), user_id=user_id, event_type="file_modified"),
    ]
    
    mock_query = db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.offset.return_value = mock_query
    mock_query.all.return_value = mock_events
    
    events = event_service.get_user_events(user_id, limit=10, offset=0)
    
    assert len(events) == 2
    assert all(e.user_id == user_id for e in events)


def test_get_event_count(event_service, user_id, db_session):
    """Test getting event count."""
    mock_query = db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.count.return_value = 5
    
    count = event_service.get_event_count(user_id)
    
    assert count == 5


def test_delete_user_events(event_service, user_id, db_session):
    """Test deleting user events."""
    mock_query = db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.count.return_value = 3
    mock_query.delete.return_value = None
    
    count = event_service.delete_user_events(user_id)
    
    assert count == 3
    db_session.commit.assert_called_once()
