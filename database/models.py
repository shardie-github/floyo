"""SQLAlchemy database models for Floyo."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
import json

from sqlalchemy import (
    Column, String, Integer, Boolean, Text, Float, 
    TIMESTAMP, ForeignKey, ARRAY, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB, ARRAY as PGARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    patterns = relationship("Pattern", back_populates="user", cascade="all, delete-orphan")
    relationships = relationship("FileRelationship", back_populates="user", cascade="all, delete-orphan")
    temporal_patterns_rel = relationship("TemporalPattern", back_populates="user", cascade="all, delete-orphan")
    suggestions = relationship("Suggestion", back_populates="user", cascade="all, delete-orphan")
    config = relationship("UserConfig", back_populates="user", uselist=False, cascade="all, delete-orphan")
    workflows = relationship("Workflow", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    """User session/token model."""
    __tablename__ = "user_sessions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    device_info = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_used_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")


class Event(Base):
    """Event model for tracking user actions."""
    __tablename__ = "events"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    file_path = Column(Text, nullable=True)
    tool = Column(String(100), nullable=True)
    operation = Column(String(50), nullable=True)
    details = Column(JSONB, nullable=True)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="events")

    __table_args__ = (
        Index('idx_events_user_timestamp', 'user_id', 'timestamp'),
    )


class Pattern(Base):
    """Pattern model for file type usage patterns."""
    __tablename__ = "patterns"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_extension = Column(String(20), nullable=True)
    count = Column(Integer, default=0)
    last_used = Column(TIMESTAMP(timezone=True), nullable=True)
    tools = Column(PGARRAY(String), nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="patterns")

    __table_args__ = (
        Index('idx_patterns_user_extension', 'user_id', 'file_extension', unique=True),
    )


class FileRelationship(Base):
    """File relationship model."""
    __tablename__ = "relationships"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_file = Column(Text, nullable=False)
    target_file = Column(Text, nullable=False)
    relation_type = Column(String(50), nullable=False)
    weight = Column(Integer, default=1)
    first_seen = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_seen = Column(TIMESTAMP(timezone=True), server_default=func.now())
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="relationships")


class TemporalPattern(Base):
    """Temporal pattern model."""
    __tablename__ = "temporal_patterns"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence = Column(Text, nullable=False)
    count = Column(Integer, default=1)
    avg_time_gap = Column(Float, nullable=True)
    files = Column(JSONB, nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="temporal_patterns_rel")


class Suggestion(Base):
    """Integration suggestion model."""
    __tablename__ = "suggestions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger = Column(Text, nullable=False)
    tools_involved = Column(PGARRAY(String), nullable=True)
    suggested_integration = Column(Text, nullable=False)
    sample_code = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    actual_files = Column(PGARRAY(Text), nullable=True)
    confidence = Column(Float, default=0.5)
    is_dismissed = Column(Boolean, default=False)
    is_applied = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    viewed_at = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User", back_populates="suggestions")


class UserConfig(Base):
    """User configuration model."""
    __tablename__ = "user_configs"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    monitored_directories = Column(PGARRAY(Text), nullable=True)
    exclude_patterns = Column(PGARRAY(Text), nullable=True)
    tracking_config = Column(JSONB, nullable=True)
    suggestions_config = Column(JSONB, nullable=True)
    privacy_config = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="config")


class Workflow(Base):
    """Workflow model for user-defined workflows."""
    __tablename__ = "workflows"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    steps = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="workflows")
