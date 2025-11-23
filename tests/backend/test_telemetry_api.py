"""
Tests for Telemetry API

Integration tests for telemetry ingestion endpoint.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from backend.main import app
from database.models import User, Event


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Create a mock user."""
    user = Mock(spec=User)
    user.id = "test-user-id"
    user.email = "test@example.com"
    return user


def test_telemetry_ingest_success(client, mock_user):
    """Test successful telemetry ingestion."""
    with patch('backend.api.telemetry.get_current_user_optional', return_value=mock_user):
        with patch('backend.api.telemetry.get_db') as mock_get_db:
            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db
            
            # Mock event creation
            mock_event = Mock(spec=Event)
            mock_event.id = "event-id"
            mock_db.add = Mock()
            mock_db.commit = Mock()
            mock_db.refresh = Mock()
            
            response = client.post(
                "/api/telemetry/ingest",
                json={
                    "type": "file_created",
                    "path": "/test/file.ts",
                    "meta": {"tool": "vscode"},
                },
            )
            
            assert response.status_code in [200, 201]
            data = response.json()
            assert data.get("ok") is True


def test_telemetry_ingest_validation_error(client):
    """Test telemetry ingestion with invalid data."""
    response = client.post(
        "/api/telemetry/ingest",
        json={
            "type": "invalid_type",  # Invalid event type
            "path": "/test/file.ts",
        },
    )
    
    assert response.status_code == 422  # Validation error


def test_telemetry_ingest_missing_user_id(client):
    """Test telemetry ingestion without user ID."""
    response = client.post(
        "/api/telemetry/ingest",
        json={
            "type": "file_created",
            "path": "/test/file.ts",
        },
    )
    
    # Should require authentication or user_id
    assert response.status_code in [401, 422]
