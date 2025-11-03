"""Comprehensive backend API tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app, get_db
from backend.database import Base
from database.models import User, Event, Pattern, Suggestion
from passlib.context import CryptContext

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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
        email="test@example.com",
        username="testuser",
        hashed_password=pwd_context.hash("testpassword"),
        full_name="Test User",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get auth headers for authenticated requests."""
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "testpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestAuth:
    """Test authentication endpoints."""
    
    def test_register_user(self, client, db):
        """Test user registration."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "password123",
                "full_name": "New User"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert "id" in data
    
    def test_register_duplicate_email(self, client, test_user):
        """Test registration with duplicate email."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 400
    
    def test_login_success(self, client, test_user):
        """Test successful login."""
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials."""
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
    
    def test_get_current_user(self, client, auth_headers, test_user):
        """Test getting current user info."""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"


class TestEvents:
    """Test event endpoints."""
    
    def test_create_event(self, client, auth_headers, test_user, db):
        """Test creating an event."""
        response = client.post(
            "/api/events",
            json={
                "event_type": "file_open",
                "file_path": "/test/file.py",
                "tool": "vscode",
                "operation": "read"
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "file_open"
        assert data["file_path"] == "/test/file.py"
    
    def test_get_events(self, client, auth_headers, test_user, db):
        """Test getting events."""
        # Create some events
        for i in range(3):
            event = Event(
                user_id=test_user.id,
                event_type="file_open",
                file_path=f"/test/file{i}.py",
                tool="vscode"
            )
            db.add(event)
        db.commit()
        
        response = client.get("/api/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    def test_create_event_unauthorized(self, client):
        """Test creating event without auth."""
        response = client.post(
            "/api/events",
            json={"event_type": "file_open"}
        )
        assert response.status_code == 403


class TestSuggestions:
    """Test suggestion endpoints."""
    
    def test_get_suggestions(self, client, auth_headers, test_user, db):
        """Test getting suggestions."""
        # Create a suggestion
        suggestion = Suggestion(
            user_id=test_user.id,
            trigger="Test trigger",
            suggested_integration="Test integration",
            confidence=0.8
        )
        db.add(suggestion)
        db.commit()
        
        response = client.get("/api/suggestions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["trigger"] == "Test trigger"
    
    def test_generate_suggestions(self, client, auth_headers, test_user, db):
        """Test generating suggestions."""
        response = client.post(
            "/api/suggestions/generate",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestPatterns:
    """Test pattern endpoints."""
    
    def test_get_patterns(self, client, auth_headers, test_user, db):
        """Test getting patterns."""
        # Create a pattern
        pattern = Pattern(
            user_id=test_user.id,
            file_extension="py",
            count=10,
            tools=["python", "vscode"]
        )
        db.add(pattern)
        db.commit()
        
        response = client.get("/api/patterns", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["file_extension"] == "py"


class TestStats:
    """Test stats endpoint."""
    
    def test_get_stats(self, client, auth_headers, test_user, db):
        """Test getting stats."""
        # Create some data
        event = Event(user_id=test_user.id, event_type="file_open")
        pattern = Pattern(user_id=test_user.id, file_extension="py", count=5)
        suggestion = Suggestion(
            user_id=test_user.id,
            trigger="Test",
            suggested_integration="Test"
        )
        db.add(event)
        db.add(pattern)
        db.add(suggestion)
        db.commit()
        
        response = client.get("/api/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_events" in data
        assert "total_patterns" in data
        assert "total_suggestions" in data
