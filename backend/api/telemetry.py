"""
Telemetry ingestion API endpoint.

Handles telemetry event ingestion with validation, rate limiting, and pattern detection triggering.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.auth.utils import get_current_user_optional, get_current_user
from backend.logging_config import get_logger
from backend.services.event_service import EventService
from backend.monitoring.performance import measure_query
from database.models import User, Event
try:
    from backend.jobs.pattern_detection import trigger_pattern_detection
    PATTERN_DETECTION_AVAILABLE = True
except ImportError:
    PATTERN_DETECTION_AVAILABLE = False
    logger.warning("Pattern detection job not available")

logger = get_logger(__name__)

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


class TelemetryEventCreate(BaseModel):
    """Telemetry event creation model."""
    user_id: Optional[str] = Field(None, description="User ID (optional, can be extracted from auth)")
    app: str = Field("web", description="Application identifier")
    type: str = Field(..., description="Event type (e.g., file_created, file_modified)")
    path: Optional[str] = Field(None, description="File path or resource path")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('type')
    def validate_type(cls, v):
        """Validate event type."""
        allowed_types = [
            'file_created', 'file_modified', 'file_deleted', 'file_accessed',
            'command_executed', 'tool_used', 'integration_triggered',
        ]
        if v not in allowed_types:
            raise ValueError(f"Event type must be one of {allowed_types}")
        return v
    
    @validator('path')
    def validate_path(cls, v):
        """Validate file path to prevent path traversal."""
        if v:
            # Prevent path traversal attacks
            if '..' in v or v.startswith('/'):
                # Normalize path - only allow relative paths
                if v.startswith('/'):
                    v = v[1:]
            # Remove any remaining dangerous patterns
            v = v.replace('..', '').replace('//', '/')
        return v


class TelemetryEventResponse(BaseModel):
    """Telemetry event response model."""
    ok: bool
    id: Optional[str] = None
    message: Optional[str] = None


@router.post("/ingest", response_model=TelemetryEventResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def ingest_telemetry(
    request: Request,
    event: TelemetryEventCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Ingest telemetry event.
    
    Accepts telemetry events from clients, validates them, stores in database,
    and triggers pattern detection if needed.
    
    Rate limited to prevent abuse.
    """
    try:
        # Determine user ID
        user_id = event.user_id or (str(current_user.id) if current_user else None)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID required. Provide user_id or authenticate."
            )
        
        # Use service layer for business logic
        event_service = EventService(db)
        
        # Create event via service (with query performance monitoring)
        with measure_query("create_telemetry_event"):
            db_event = event_service.create_event(
                user_id=user_id,
                event_type=event.type,
                file_path=event.path,
                tool=event.meta.get('tool') if event.meta else None,
                operation=event.type,
                details=event.meta,
            )
        
        logger.info(
            f"Telemetry event ingested: user_id={user_id}, type={event.type}, "
            f"path={event.path}, event_id={db_event.id}"
        )
        
        # Trigger pattern detection asynchronously (don't wait)
        # This ensures patterns are detected within 1 hour as per sprint requirements
        if PATTERN_DETECTION_AVAILABLE:
            try:
                # Trigger pattern detection job (runs in background)
                trigger_pattern_detection.delay(user_id=user_id, hours_back=1)
            except Exception as e:
                # Don't fail the request if pattern detection trigger fails
                logger.warning(f"Failed to trigger pattern detection: {e}")
        
        return TelemetryEventResponse(
            ok=True,
            id=str(db_event.id),
            message="Event ingested successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to ingest telemetry event: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest event: {str(e)}"
        )


@router.get("/health")
async def telemetry_health():
    """Health check for telemetry endpoint."""
    return {
        "status": "ok",
        "endpoint": "/api/telemetry/ingest",
        "rate_limit": f"{RATE_LIMIT_PER_MINUTE} requests/minute"
    }
