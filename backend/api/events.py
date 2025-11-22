"""Event tracking API endpoints."""

from pathlib import Path
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Request, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.cache import get, set, delete
from backend.audit import log_audit
from backend.batch_processor import process_event_batch
from backend.export import export_events_csv, export_events_json
from backend.auth.utils import get_current_user
from backend.api.models import EventCreate, EventResponse, PaginatedResponse
from database.models import User, Event
from fastapi.responses import Response

router = APIRouter(prefix="/api/events", tags=["events"])


# Import WebSocket manager from websocket module
from backend.api.websocket import manager


@router.post("/upload")
async def upload_event_file(
    file: UploadFile = File(...),
    event_type: str = "file_upload",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file and create an event.
    
    Provides a clear value proposition: "Track file operations to discover
    intelligent workflow automation opportunities."
    """
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads") / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_dir / file.filename
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create event
    db_event = Event(
        user_id=current_user.id,
        event_type=event_type,
        file_path=str(file_path),
        tool="upload",
        operation="upload",
        details={
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(content)
        },
        timestamp=datetime.utcnow()
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return {
        "message": "File uploaded successfully",
        "event_id": str(db_event.id),
        "file_path": str(file_path)
    }


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def create_event(
    request: Request,
    event: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new event.
    
    Track file operations, tool usage, and other activities to enable
    intelligent pattern detection and workflow suggestions.
    """
    # Clear cache
    delete(f"events:{current_user.id}:*")
    
    db_event = Event(
        user_id=current_user.id,
        event_type=event.event_type,
        file_path=event.file_path,
        tool=event.tool,
        operation=event.operation,
        details=event.details,
        timestamp=datetime.utcnow()
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Audit log
    log_audit(
        db=db,
        action="create",
        resource_type="event",
        user_id=current_user.id,
        resource_id=db_event.id,
        details={"event_type": event.event_type, "tool": event.tool},
        request=request
    )
    
    # Trigger pattern analysis (simplified)
    await manager.broadcast(f"Event created: {event.event_type}")
    
    return db_event


@router.post("/batch", response_model=List[EventResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_events_batch(
    request: Request,
    events: List[EventCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create multiple events in a batch.
    
    Efficiently track multiple operations at once for better performance.
    """
    # Clear cache
    delete(f"events:{current_user.id}:*")
    
    event_dicts = [
        {
            "event_type": e.event_type,
            "file_path": e.file_path,
            "tool": e.tool,
            "operation": e.operation,
            "details": e.details
        }
        for e in events
    ]
    
    created_events = process_event_batch(db, str(current_user.id), event_dicts)
    
    await manager.broadcast(f"Batch: {len(created_events)} events created")
    
    return created_events


@router.get("", response_model=PaginatedResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_events(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    event_type: Optional[str] = None,
    tool: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user events with filtering, search, and pagination.
    
    View your tracked events with powerful filtering and search capabilities.
    """
    # Generate cache key
    cache_key = f"events:{current_user.id}:{skip}:{limit}:{event_type}:{tool}:{search}:{sort_by}:{sort_order}"
    
    # Check cache
    cached_result = get(cache_key)
    if cached_result:
        return cached_result
    
    query = db.query(Event).filter(Event.user_id == current_user.id)
    
    # Apply filters
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if tool:
        query = query.filter(Event.tool == tool)
    if search:
        query = query.filter(
            or_(
                Event.file_path.ilike(f"%{search}%"),
                Event.operation.ilike(f"%{search}%"),
                Event.event_type.ilike(f"%{search}%")
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply sorting
    if sort_by:
        sort_column = getattr(Event, sort_by, None)
        if sort_column:
            if sort_order == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    else:
        # Default sort by timestamp
        if sort_order == "desc":
            query = query.order_by(Event.timestamp.desc())
        else:
            query = query.order_by(Event.timestamp.asc())
    
    events = query.offset(skip).limit(limit).all()
    
    result = PaginatedResponse(
        items=events,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total
    )
    
    # Cache for 30 seconds
    set(cache_key, result, ttl=30)
    
    return result


@router.get("/export")
async def export_events(
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export events in CSV or JSON format.
    
    Export your event data for analysis or compliance purposes.
    """
    events = db.query(Event).filter(
        Event.user_id == current_user.id
    ).order_by(Event.timestamp.desc()).limit(1000).all()
    
    if format.lower() == "csv":
        content = export_events_csv(events)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=events.csv"}
        )
    else:
        content = export_events_json(events)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=events.json"}
        )
