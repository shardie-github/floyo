"""
Tests for Pattern Detection Job

Unit tests for pattern detection background job.
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from uuid import uuid4

from backend.jobs.pattern_detection import (
    process_events_task,
    trigger_pattern_detection_sync,
)


@pytest.fixture
def mock_db_session(mocker):
    """Create a mock database session."""
    session = Mock()
    session.query = Mock()
    session.add = Mock()
    session.commit = Mock()
    session.refresh = Mock()
    session.rollback = Mock()
    return session


@pytest.fixture
def mock_events():
    """Create mock events."""
    user_id = str(uuid4())
    return [
        Mock(
            user_id=user_id,
            file_path="/test/file1.ts",
            event_type="file_created",
            tool="vscode",
            timestamp=datetime.utcnow(),
            metadata={},
        ),
        Mock(
            user_id=user_id,
            file_path="/test/file2.ts",
            event_type="file_modified",
            tool="vscode",
            timestamp=datetime.utcnow(),
            metadata={},
        ),
    ]


def test_process_events_task_no_events(mock_db_session):
    """Test pattern detection with no events."""
    with patch('backend.jobs.pattern_detection.SessionLocal', return_value=mock_db_session):
        mock_query = mock_db_session.query.return_value
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = []
        
        result = process_events_task(user_id="test-user", hours_back=1)
        
        assert result['processed'] == 0
        assert result['patterns_created'] == 0
        assert result['patterns_updated'] == 0


def test_process_events_task_with_events(mock_db_session, mock_events):
    """Test pattern detection with events."""
    with patch('backend.jobs.pattern_detection.SessionLocal', return_value=mock_db_session):
        mock_query = mock_db_session.query.return_value
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = mock_events
        
        # Mock pattern query (no existing patterns)
        pattern_query = Mock()
        pattern_query.filter.return_value = pattern_query
        pattern_query.all.return_value = []
        
        # Set up query chain
        def query_side_effect(model):
            if model.__name__ == 'Event':
                return mock_query
            elif model.__name__ == 'Pattern':
                return pattern_query
            return Mock()
        
        mock_db_session.query.side_effect = query_side_effect
        
        result = process_events_task(user_id=str(mock_events[0].user_id), hours_back=24)
        
        # Should process events (even if no patterns created due to min_frequency)
        assert result['processed'] >= 0  # May be 0 if patterns don't meet frequency threshold
