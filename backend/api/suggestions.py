"""Suggestion API endpoints."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.cache import get, set, delete
from backend.logging_config import get_logger
from backend.auth.utils import get_current_user
from backend.auth.analytics_helpers import track_event, mark_user_activated
from backend.api.models import PaginatedResponse, SuggestionResponse
from backend.api.websocket import manager
from database.models import User, Event, Pattern, Suggestion

logger = get_logger(__name__)
router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


@router.get("", response_model=PaginatedResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_suggestions(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    confidence_min: Optional[float] = None,
    is_dismissed: Optional[bool] = None,
    is_applied: Optional[bool] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get integration suggestions with filtering and pagination.
    
    Discover intelligent workflow automation opportunities based on your
    actual file usage patterns. Get personalized suggestions with confidence scores.
    """
    cache_key = f"suggestions:{current_user.id}:{skip}:{limit}:{confidence_min}:{is_dismissed}:{is_applied}:{sort_by}:{sort_order}"
    
    cached_result = get(cache_key)
    if cached_result:
        return cached_result
    
    query = db.query(Suggestion).filter(Suggestion.user_id == current_user.id)
    
    if is_dismissed is not None:
        query = query.filter(Suggestion.is_dismissed == is_dismissed)
    if is_applied is not None:
        query = query.filter(Suggestion.is_applied == is_applied)
    if confidence_min is not None:
        query = query.filter(Suggestion.confidence >= confidence_min)
    
    total = query.count()
    
    # Apply sorting
    if sort_by:
        sort_column = getattr(Suggestion, sort_by, None)
        if sort_column:
            if sort_order == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    else:
        # Default sort by confidence and created_at
        if sort_order == "desc":
            query = query.order_by(Suggestion.confidence.desc(), Suggestion.created_at.desc())
        else:
            query = query.order_by(Suggestion.confidence.asc(), Suggestion.created_at.asc())
    
    suggestions = query.offset(skip).limit(limit).all()
    
    result = PaginatedResponse(
        items=suggestions,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total
    )
    
    set(cache_key, result, ttl=60)
    return result


@router.post("/generate", response_model=List[SuggestionResponse])
@limiter.limit("10/hour")
async def generate_suggestions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate new suggestions based on patterns.
    
    Analyze your usage patterns and generate intelligent workflow automation
    suggestions using machine learning.
    """
    # Clear cache for suggestions
    from backend.cache import clear_pattern
    clear_pattern(f"suggestions:{current_user.id}:*")
    
    # Get events and patterns from DB
    events = db.query(Event).filter(
        Event.user_id == current_user.id
    ).order_by(Event.timestamp.desc()).limit(100).all()
    
    patterns = db.query(Pattern).filter(
        Pattern.user_id == current_user.id
    ).all()
    
    suggestions = []
    
    # Try ML-enhanced suggestion generation
    try:
        from backend.ml.model_manager import ModelManager
        from backend.ml.pattern_classifier import PatternClassifier
        from backend.ml.suggestion_scorer import SuggestionScorer
        
        model_manager = ModelManager(db)
        pattern_classifier = model_manager.get_model("pattern_classifier")
        suggestion_scorer = model_manager.get_model("suggestion_scorer")
        
        # Generate suggestions using ML if available
        for pattern in patterns[:10]:  # Process top 10 patterns
            if pattern.file_extension:
                # Classify pattern
                event_data = {
                    "file_extension": pattern.file_extension,
                    "tool": pattern.tools[0] if pattern.tools else None,
                    "hour_of_day": datetime.utcnow().hour,
                    "day_of_week": datetime.utcnow().weekday(),
                    "ext_frequency": pattern.count,
                }
                
                category = "general"
                if pattern_classifier and pattern_classifier.is_trained:
                    try:
                        classification = pattern_classifier.predict(event_data)
                        category = classification.get("category", "general")
                    except:
                        pass
                
                # Create suggestion
                suggestion = Suggestion(
                    user_id=current_user.id,
                    trigger=f"Pattern detected: {pattern.file_extension} files",
                    suggested_integration=f"Automate {category} workflow for {pattern.file_extension}",
                    tools_involved=pattern.tools or [],
                    sample_code=f"# {category} automation for {pattern.file_extension}",
                    reasoning=f"Based on ML classification: {category}",
                    confidence=0.6,
                    actual_files=[f"pattern_{pattern.id}.{pattern.file_extension}"]
                )
                
                # Score with ML if available
                if suggestion_scorer and suggestion_scorer.is_trained:
                    try:
                        features = suggestion_scorer._extract_features(suggestion, db)
                        if features:
                            score_result = suggestion_scorer.predict(features)
                            suggestion.confidence = score_result.get("confidence", 0.6)
                    except:
                        pass
                
                db.add(suggestion)
                suggestions.append(suggestion)
        
        db.commit()
        
        # Refresh suggestions
        for s in suggestions:
            db.refresh(s)
        
    except Exception as e:
        logger.warning(f"ML suggestion generation failed, using fallback: {e}")
        # Fallback to basic suggestion
        if patterns:
            pattern = patterns[0]
            new_suggestion = Suggestion(
                user_id=current_user.id,
                trigger=f"Recently used {pattern.file_extension} files",
                suggested_integration="Dropbox API - auto-sync output files",
                sample_code="# Auto-sync code here",
                reasoning="Based on your usage patterns",
                confidence=0.7
            )
            db.add(new_suggestion)
            db.commit()
            db.refresh(new_suggestion)
            suggestions = [new_suggestion]
    
    await manager.broadcast("New suggestions generated")
    
    return suggestions


@router.post("/{suggestion_id}/bookmark")
@limiter.limit("30/minute")
async def bookmark_suggestion(
    request: Request,
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bookmark/favorite a suggestion for later reference."""
    suggestion = db.query(Suggestion).filter(
        Suggestion.id == suggestion_id,
        Suggestion.user_id == current_user.id
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    # Toggle bookmark (using a detail field or create a separate field)
    # For now, we'll use a custom detail flag
    if not suggestion.details:
        suggestion.details = {}
    suggestion.details["is_bookmarked"] = not suggestion.details.get("is_bookmarked", False)
    
    db.commit()
    db.refresh(suggestion)
    
    # Clear cache
    delete(f"suggestions:{current_user.id}:*")
    
    return {"message": "Suggestion bookmarked" if suggestion.details.get("is_bookmarked") else "Suggestion unbookmarked"}


@router.post("/{suggestion_id}/apply")
@limiter.limit("30/minute")
async def apply_suggestion(
    request: Request,
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a suggestion as applied.
    
    Track which suggestions you've implemented to improve future recommendations.
    """
    suggestion = db.query(Suggestion).filter(
        Suggestion.id == suggestion_id,
        Suggestion.user_id == current_user.id
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.is_applied = True
    db.commit()
    
    # Track suggestion applied event
    track_event(
        db=db,
        user_id=str(current_user.id),
        event_type="suggestion_applied",
        properties={
            "suggestion_id": str(suggestion_id),
            "suggestion_type": suggestion.trigger,
            "confidence": suggestion.confidence
        }
    )
    
    # Check if this is user's first applied suggestion (activation)
    applied_count = db.query(Suggestion).filter(
        and_(
            Suggestion.user_id == current_user.id,
            Suggestion.is_applied == True
        )
    ).count()
    
    if applied_count == 1:
        mark_user_activated(db, str(current_user.id), "suggestion_applied")
    
    # Clear cache
    delete(f"suggestions:{current_user.id}:*")
    
    return {"message": "Suggestion marked as applied"}


@router.post("/{suggestion_id}/dismiss")
@limiter.limit("30/minute")
async def dismiss_suggestion(
    request: Request,
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dismiss a suggestion that's not relevant."""
    suggestion = db.query(Suggestion).filter(
        Suggestion.id == suggestion_id,
        Suggestion.user_id == current_user.id
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.is_dismissed = True
    db.commit()
    
    # Clear cache
    delete(f"suggestions:{current_user.id}:*")
    
    return {"message": "Suggestion dismissed"}
