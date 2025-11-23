"""
Tests for PatternService

Unit tests for pattern service layer.
"""

import pytest
from sqlalchemy.orm import Session
from uuid import uuid4

from backend.services.pattern_service import PatternService
from database.models import Pattern


@pytest.fixture
def db_session(mocker):
    """Create a mock database session."""
    session = mocker.Mock(spec=Session)
    return session


@pytest.fixture
def user_id():
    """Create a test user ID."""
    return str(uuid4())


@pytest.fixture
def pattern_service(db_session):
    """Create a PatternService instance."""
    return PatternService(db_session)


def test_get_user_patterns(pattern_service, user_id, db_session):
    """Test getting user patterns."""
    mock_patterns = [
        Pattern(id=uuid4(), user_id=user_id, file_extension=".ts", count=10),
        Pattern(id=uuid4(), user_id=user_id, file_extension=".py", count=5),
    ]
    
    mock_query = db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.offset.return_value = mock_query
    mock_query.all.return_value = mock_patterns
    
    patterns = pattern_service.get_user_patterns(user_id, limit=10)
    
    assert len(patterns) == 2
    assert all(p.user_id == user_id for p in patterns)


def test_batch_get_patterns(pattern_service, user_id, db_session):
    """Test batch loading patterns."""
    file_extensions = [".ts", ".py", ".js"]
    mock_patterns = [
        Pattern(id=uuid4(), user_id=user_id, file_extension=".ts", count=10),
        Pattern(id=uuid4(), user_id=user_id, file_extension=".py", count=5),
    ]
    
    mock_query = db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.all.return_value = mock_patterns
    
    patterns_dict = pattern_service.batch_get_patterns(user_id, file_extensions)
    
    assert len(patterns_dict) == 2
    assert ".ts" in patterns_dict
    assert ".py" in patterns_dict
    assert ".js" not in patterns_dict  # Not in mock data


def test_get_pattern_count(pattern_service, user_id, db_session):
    """Test getting pattern count."""
    mock_query = db_session.query.return_value
    mock_query.filter.return_value = mock_query
    mock_query.count.return_value = 5
    
    count = pattern_service.get_pattern_count(user_id)
    
    assert count == 5
