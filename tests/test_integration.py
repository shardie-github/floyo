"""Integration tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app, get_db
from backend.database import Base
from database.models import User, Event
from passlib.context import CryptContext

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture
def db():
    """Create test database."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    """Create test client."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create test user."""
    user = User(
        email="integration@test.com",
        username="integration_user",
        hashed_password=pwd_context.hash("password123"),
        full_name="Integration User",
        is_active=True,
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_full_user_flow(client, db, test_user):
    """Test complete user flow: register -> login -> create events -> get stats."""
    # Login
    response = client.post(
        "/api/auth/login",
        json={"email": "integration@test.com", "password": "password123"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create events
    for i in range(5):
        response = client.post(
            "/api/events",
            json={
                "event_type": "file_open",
                "file_path": f"/test/file{i}.py",
                "tool": "vscode"
            },
            headers=headers
        )
        assert response.status_code == 201
    
    # Get events with filtering
    response = client.get(
        "/api/events?event_type=file_open&limit=10",
        headers=headers
    )
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 5
    
    # Search events
    response = client.get(
        "/api/events?search=file0",
        headers=headers
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # Get stats
    response = client.get("/api/stats", headers=headers)
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_events"] >= 5


def test_event_filtering_and_search(client, db, test_user):
    """Test event filtering and search functionality."""
    # Login
    response = client.post(
        "/api/auth/login",
        json={"email": "integration@test.com", "password": "password123"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create different types of events
    events_data = [
        {"event_type": "file_open", "file_path": "/test/python.py", "tool": "vscode"},
        {"event_type": "file_save", "file_path": "/test/python.py", "tool": "vscode"},
        {"event_type": "file_open", "file_path": "/test/javascript.js", "tool": "vscode"},
    ]
    
    for event_data in events_data:
        client.post("/api/events", json=event_data, headers=headers)
    
    # Filter by event type
    response = client.get("/api/events?event_type=file_open", headers=headers)
    assert response.status_code == 200
    events = response.json()
    assert all(e["event_type"] == "file_open" for e in events)
    assert len(events) == 2
    
    # Search by file path
    response = client.get("/api/events?search=python", headers=headers)
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 2
