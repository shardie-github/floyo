"""
Pytest configuration and fixtures for backend tests.
"""

import pytest
from unittest.mock import Mock
from sqlalchemy.orm import Session

# Configure pytest
pytest_plugins = []


@pytest.fixture
def mock_db_session():
    """Create a mock database session."""
    session = Mock(spec=Session)
    session.add = Mock()
    session.commit = Mock()
    session.refresh = Mock()
    session.query = Mock()
    session.rollback = Mock()
    return session
