"""Database seeding script for development."""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from uuid import uuid4

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, init_db
from database.models import (
    User, Event, Pattern, Suggestion, UserConfig, FileRelationship
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_sample_users(db: Session) -> list[User]:
    """Create sample users."""
    users = []
    
    # Admin user
    admin_user = User(
        id=uuid4(),
        email="admin@floyo.dev",
        username="admin",
        hashed_password=pwd_context.hash("admin123"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True
    )
    db.add(admin_user)
    users.append(admin_user)
    
    # Regular user
    regular_user = User(
        id=uuid4(),
        email="user@floyo.dev",
        username="user",
        hashed_password=pwd_context.hash("user123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False
    )
    db.add(regular_user)
    users.append(regular_user)
    
    db.commit()
    
    # Create configs
    for user in users:
        config = UserConfig(
            user_id=user.id,
            monitored_directories=["/workspace"],
            exclude_patterns=[
                r"\.git/",
                r"__pycache__/",
                r"\.pyc$",
                r"node_modules/",
                r"\.floyo/"
            ],
            tracking_config={
                "enable_file_watcher": True,
                "enable_command_tracking": True,
                "max_events": 1000,
                "retention_days": 90
            },
            suggestions_config={
                "max_suggestions": 5,
                "use_actual_file_paths": True
            },
            privacy_config={
                "anonymize_paths": False,
                "exclude_sensitive_dirs": []
            }
        )
        db.add(config)
    
    db.commit()
    return users


def create_sample_events(db: Session, user: User) -> list[Event]:
    """Create sample events for a user."""
    events = []
    base_time = datetime.utcnow()
    
    event_types = [
        ("file_open", "python", "read"),
        ("file_save", "python", "write"),
        ("file_open", "javascript", "read"),
        ("file_open", "python", "read"),
        ("file_open", "markdown", "read"),
    ]
    
    files = [
        "/workspace/backend/main.py",
        "/workspace/frontend/app/page.tsx",
        "/workspace/README.md",
        "/workspace/backend/database.py",
        "/workspace/floyo/tracker.py",
    ]
    
    for i, (event_type, tool, operation) in enumerate(event_types):
        event = Event(
            user_id=user.id,
            event_type=event_type,
            file_path=files[i % len(files)],
            tool=tool,
            operation=operation,
            details={
                "editor": "vscode",
                "line_count": 100 + i * 10,
            },
            timestamp=base_time - timedelta(hours=i)
        )
        db.add(event)
        events.append(event)
    
    db.commit()
    return events


def create_sample_patterns(db: Session, user: User) -> list[Pattern]:
    """Create sample patterns for a user."""
    patterns = []
    
    pattern_data = [
        ("py", 45, ["python", "vscode"]),
        ("tsx", 23, ["typescript", "react"]),
        ("md", 12, ["markdown"]),
        ("json", 8, ["json"]),
    ]
    
    for ext, count, tools in pattern_data:
        pattern = Pattern(
            user_id=user.id,
            file_extension=ext,
            count=count,
            last_used=datetime.utcnow() - timedelta(hours=1),
            tools=tools,
            metadata={"sample": True}
        )
        db.add(pattern)
        patterns.append(pattern)
    
    db.commit()
    return patterns


def create_sample_suggestions(db: Session, user: User) -> list[Suggestion]:
    """Create sample suggestions for a user."""
    suggestions = []
    
    suggestion_data = [
        (
            "Frequently opening Python files",
            ["python", "vscode"],
            "Dropbox API - auto-sync Python files",
            "# Auto-sync code\nimport dropbox\n...",
            "You frequently work with Python files. Consider auto-syncing them.",
            ["/workspace/backend/main.py", "/workspace/floyo/tracker.py"],
            0.85
        ),
        (
            "React components opened together",
            ["typescript", "react"],
            "GitHub integration - auto-commit on save",
            "# Auto-commit code\nimport subprocess\n...",
            "You often modify React components together.",
            ["/workspace/frontend/components/Dashboard.tsx"],
            0.72
        ),
    ]
    
    for trigger, tools, integration, code, reasoning, files, confidence in suggestion_data:
        suggestion = Suggestion(
            user_id=user.id,
            trigger=trigger,
            tools_involved=tools,
            suggested_integration=integration,
            sample_code=code,
            reasoning=reasoning,
            actual_files=files,
            confidence=confidence,
            is_dismissed=False,
            is_applied=False
        )
        db.add(suggestion)
        suggestions.append(suggestion)
    
    db.commit()
    return suggestions


def seed_database() -> None:
    """Main seeding function."""
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        print("Creating sample users...")
        users = create_sample_users(db)
        
        for user in users:
            print(f"Creating data for user: {user.email}")
            create_sample_events(db, user)
            create_sample_patterns(db, user)
            create_sample_suggestions(db, user)
        
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
