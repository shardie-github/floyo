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
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255), nullable=True, index=True)
    email_verification_expires = Column(TIMESTAMP(timezone=True), nullable=True)
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
    organization_memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    integrations = relationship("UserIntegration", back_populates="user", cascade="all, delete-orphan")


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


class Organization(Base):
    """Organization/Workspace model for multi-tenant support."""
    __tablename__ = "organizations"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    subscription_tier = Column(String(50), default="free")  # free, pro, enterprise
    is_active = Column(Boolean, default=True)
    settings = Column(JSONB, nullable=True)  # Organization-specific settings
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    workflows_org = relationship("Workflow", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")


class OrganizationMember(Base):
    """Organization membership with roles."""
    __tablename__ = "organization_members"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="member")  # owner, admin, member, viewer
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="organization_memberships")

    __table_args__ = (
        Index('idx_org_member_unique', 'organization_id', 'user_id', unique=True),
    )


class Role(Base):
    """RBAC role definitions."""
    __tablename__ = "roles"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(JSONB, nullable=False)  # List of permission strings
    is_system = Column(Boolean, default=False)  # System roles can't be deleted
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    """Audit trail for all operations."""
    __tablename__ = "audit_logs"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # create, update, delete, login, etc.
    resource_type = Column(String(100), nullable=False)  # event, pattern, workflow, etc.
    resource_id = Column(PGUUID(as_uuid=True), nullable=True)
    details = Column(JSONB, nullable=True)  # Additional context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)

    organization = relationship("Organization", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_audit_org_created', 'organization_id', 'created_at'),
        Index('idx_audit_user_created', 'user_id', 'created_at'),
    )


class WorkflowVersion(Base):
    """Workflow versioning for rollback capability."""
    __tablename__ = "workflow_versions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    workflow_id = Column(PGUUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    steps = Column(JSONB, nullable=False)
    change_summary = Column(Text, nullable=True)
    created_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)

    workflow = relationship("Workflow", back_populates="versions")


class WorkflowExecution(Base):
    """Workflow execution history."""
    __tablename__ = "workflow_executions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    workflow_id = Column(PGUUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending")  # pending, running, completed, failed
    triggered_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    execution_log = Column(JSONB, nullable=True)  # Step-by-step execution details
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)

    workflow = relationship("Workflow", back_populates="executions")

    __table_args__ = (
        Index('idx_workflow_exec_status', 'workflow_id', 'status', 'created_at'),
    )


class IntegrationConnector(Base):
    """Pre-built integration connectors."""
    __tablename__ = "integration_connectors"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    service_type = Column(String(100), nullable=False, index=True)  # github, slack, googledrive, etc.
    description = Column(Text, nullable=True)
    config_schema = Column(JSONB, nullable=False)  # JSON schema for configuration
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)  # System connectors can't be deleted
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class UserIntegration(Base):
    """User-configured integrations."""
    __tablename__ = "user_integrations"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    connector_id = Column(PGUUID(as_uuid=True), ForeignKey("integration_connectors.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    config = Column(JSONB, nullable=False)  # Encrypted connection credentials
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="integrations")
    organization = relationship("Organization")
    connector = relationship("IntegrationConnector")


class Workflow(Base):
    """Workflow model for user-defined workflows."""
    __tablename__ = "workflows"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    steps = Column(JSONB, nullable=False)
    schedule_config = Column(JSONB, nullable=True)  # Cron schedule, triggers, etc.
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="workflows")
    organization = relationship("Organization", back_populates="workflows_org")
    versions = relationship("WorkflowVersion", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")
