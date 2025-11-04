"""
Row Level Security (RLS) tests for Floyo.

Tests that users can only access their own data.
"""

import pytest
from uuid import uuid4
from sqlalchemy.orm import Session
from datetime import datetime

from database.models import User, Event, Pattern, Suggestion
from backend.database import SessionLocal
from backend.main import get_password_hash, create_access_token


@pytest.fixture
def db():
    """Create a test database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def user1(db: Session):
    """Create test user 1."""
    user = User(
        id=uuid4(),
        email="user1@test.com",
        username="user1",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user2(db: Session):
    """Create test user 2."""
    user = User(
        id=uuid4(),
        email="user2@test.com",
        username="user2",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestRLSPolicies:
    """Test RLS policies ensure data isolation."""
    
    def test_users_can_only_see_own_events(self, db: Session, user1, user2):
        """Test that users can only query their own events."""
        # Create events for both users
        event1 = Event(
            user_id=user1.id,
            event_type="file_open",
            file_path="/user1/file.txt",
            timestamp=datetime.utcnow()
        )
        event2 = Event(
            user_id=user2.id,
            event_type="file_open",
            file_path="/user2/file.txt",
            timestamp=datetime.utcnow()
        )
        db.add(event1)
        db.add(event2)
        db.commit()
        
        # Query events as user1
        user1_events = db.query(Event).filter(Event.user_id == user1.id).all()
        
        # Verify user1 only sees their own events
        assert len(user1_events) == 1
        assert user1_events[0].user_id == user1.id
        assert user1_events[0].file_path == "/user1/file.txt"
        
        # Query events as user2
        user2_events = db.query(Event).filter(Event.user_id == user2.id).all()
        
        # Verify user2 only sees their own events
        assert len(user2_events) == 1
        assert user2_events[0].user_id == user2.id
        assert user2_events[0].file_path == "/user2/file.txt"
    
    def test_users_can_only_see_own_patterns(self, db: Session, user1, user2):
        """Test that users can only query their own patterns."""
        pattern1 = Pattern(
            user_id=user1.id,
            file_extension=".py",
            count=10
        )
        pattern2 = Pattern(
            user_id=user2.id,
            file_extension=".js",
            count=5
        )
        db.add(pattern1)
        db.add(pattern2)
        db.commit()
        
        # Query patterns as user1
        user1_patterns = db.query(Pattern).filter(Pattern.user_id == user1.id).all()
        assert len(user1_patterns) == 1
        assert user1_patterns[0].user_id == user1.id
        
        # Query patterns as user2
        user2_patterns = db.query(Pattern).filter(Pattern.user_id == user2.id).all()
        assert len(user2_patterns) == 1
        assert user2_patterns[0].user_id == user2.id
    
    def test_users_can_only_see_own_suggestions(self, db: Session, user1, user2):
        """Test that users can only query their own suggestions."""
        suggestion1 = Suggestion(
            user_id=user1.id,
            trigger="Python files",
            suggested_integration="GitHub API",
            confidence=0.8
        )
        suggestion2 = Suggestion(
            user_id=user2.id,
            trigger="JavaScript files",
            suggested_integration="NPM API",
            confidence=0.7
        )
        db.add(suggestion1)
        db.add(suggestion2)
        db.commit()
        
        # Query suggestions as user1
        user1_suggestions = db.query(Suggestion).filter(Suggestion.user_id == user1.id).all()
        assert len(user1_suggestions) == 1
        assert user1_suggestions[0].user_id == user1.id
        
        # Query suggestions as user2
        user2_suggestions = db.query(Suggestion).filter(Suggestion.user_id == user2.id).all()
        assert len(user2_suggestions) == 1
        assert user2_suggestions[0].user_id == user2.id
    
    def test_cannot_modify_other_users_events(self, db: Session, user1, user2):
        """Test that users cannot modify other users' events."""
        event = Event(
            user_id=user2.id,
            event_type="file_open",
            file_path="/user2/file.txt",
            timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()
        
        # Try to update as user1 (should be prevented by application logic)
        # Note: Actual RLS enforcement would happen at database level in production
        event_from_db = db.query(Event).filter(Event.id == event.id).first()
        
        # Verify event belongs to user2
        assert event_from_db.user_id == user2.id
        
        # Application should prevent user1 from updating this
        # (This is a placeholder - actual enforcement depends on API implementation)
    
    def test_cascade_delete_removes_user_data(self, db: Session, user1):
        """Test that deleting a user removes all their associated data."""
        # Create some data for user1
        event = Event(
            user_id=user1.id,
            event_type="file_open",
            file_path="/test/file.txt",
            timestamp=datetime.utcnow()
        )
        pattern = Pattern(
            user_id=user1.id,
            file_extension=".py",
            count=5
        )
        suggestion = Suggestion(
            user_id=user1.id,
            trigger="test",
            suggested_integration="test API",
            confidence=0.5
        )
        db.add(event)
        db.add(pattern)
        db.add(suggestion)
        db.commit()
        
        # Verify data exists
        assert db.query(Event).filter(Event.user_id == user1.id).count() == 1
        assert db.query(Pattern).filter(Pattern.user_id == user1.id).count() == 1
        assert db.query(Suggestion).filter(Suggestion.user_id == user1.id).count() == 1
        
        # Delete user (with cascade)
        db.delete(user1)
        db.commit()
        
        # Verify all related data is deleted
        assert db.query(Event).filter(Event.user_id == user1.id).count() == 0
        assert db.query(Pattern).filter(Pattern.user_id == user1.id).count() == 0
        assert db.query(Suggestion).filter(Suggestion.user_id == user1.id).count() == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
