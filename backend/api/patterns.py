"""Pattern API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from fastapi.responses import Response

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.cache import get, set
from backend.export import export_patterns_csv, export_patterns_json
from backend.auth.utils import get_current_user
from backend.api.models import PaginatedResponse
from database.models import User, Pattern

router = APIRouter(prefix="/api/patterns", tags=["patterns"])


@router.get("", response_model=PaginatedResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_patterns(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    file_extension: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get usage patterns with filtering and pagination.
    
    Discover patterns in your file usage to understand your workflow habits
    and identify automation opportunities.
    """
    cache_key = f"patterns:{current_user.id}:{skip}:{limit}:{file_extension}:{sort_by}:{sort_order}"
    
    cached_result = get(cache_key)
    if cached_result:
        return cached_result
    
    query = db.query(Pattern).filter(Pattern.user_id == current_user.id)
    
    if file_extension:
        query = query.filter(Pattern.file_extension == file_extension)
    
    total = query.count()
    
    # Apply sorting
    if sort_by:
        sort_column = getattr(Pattern, sort_by, None)
        if sort_column:
            if sort_order == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    else:
        # Default sort by count
        if sort_order == "desc":
            query = query.order_by(Pattern.count.desc())
        else:
            query = query.order_by(Pattern.count.asc())
    
    patterns = query.offset(skip).limit(limit).all()
    
    result = PaginatedResponse(
        items=patterns,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total
    )
    
    set(cache_key, result, ttl=60)
    return result


@router.get("/export")
async def export_patterns(
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export patterns in CSV or JSON format.
    
    Export your usage patterns for analysis or backup purposes.
    """
    patterns = db.query(Pattern).filter(
        Pattern.user_id == current_user.id
    ).all()
    
    if format.lower() == "csv":
        content = export_patterns_csv(patterns)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=patterns.csv"}
        )
    else:
        content = export_patterns_json(patterns)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=patterns.json"}
        )
