"""Shared Pydantic models for API endpoints."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    """Event creation model."""
    event_type: str
    file_path: Optional[str] = None
    tool: Optional[str] = None
    operation: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class EventResponse(BaseModel):
    """Event response model."""
    id: UUID
    event_type: str
    file_path: Optional[str]
    tool: Optional[str]
    timestamp: datetime
    details: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    """Paginated response model."""
    items: List[Any]
    total: int
    skip: int
    limit: int
    has_more: bool


class SuggestionResponse(BaseModel):
    """Suggestion response model."""
    id: UUID
    trigger: str
    tools_involved: Optional[List[str]]
    suggested_integration: str
    sample_code: Optional[str]
    reasoning: Optional[str]
    actual_files: Optional[List[str]]
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True


class PatternResponse(BaseModel):
    """Pattern response model."""
    id: UUID
    file_extension: Optional[str]
    count: int
    last_used: Optional[datetime]
    tools: Optional[List[str]]

    class Config:
        from_attributes = True


class PaginationParams(BaseModel):
    """Pagination parameters."""
    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=20, ge=1, le=100, description="Number of items to return")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")


class OrganizationCreate(BaseModel):
    """Organization creation model."""
    name: str
    description: Optional[str] = None


class OrganizationResponse(BaseModel):
    """Organization response model."""
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    owner_id: UUID

    class Config:
        from_attributes = True


class OrganizationUpdate(BaseModel):
    """Organization update model."""
    name: Optional[str] = None
    description: Optional[str] = None


class WorkflowCreate(BaseModel):
    """Workflow creation model."""
    name: str
    description: Optional[str] = None
    trigger_config: Dict[str, Any]
    action_config: Dict[str, Any]
    schedule_config: Optional[Dict[str, Any]] = None


class WorkflowUpdate(BaseModel):
    """Workflow update model."""
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    action_config: Optional[Dict[str, Any]] = None
    schedule_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class IntegrationCreate(BaseModel):
    """Integration creation model."""
    connector_id: UUID
    config: Dict[str, Any]
    name: Optional[str] = None


class IntegrationUpdate(BaseModel):
    """Integration update model."""
    config: Optional[Dict[str, Any]] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
