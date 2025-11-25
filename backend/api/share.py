"""Share API endpoints for integration suggestions."""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from backend.database import get_db
from backend.auth.utils import get_current_user, get_optional_user
from backend.logging_config import get_logger
from backend.auth.analytics_helpers import track_event
from database.models import User, Suggestion, Event, UTMTrack
import secrets

logger = get_logger(__name__)
router = APIRouter(prefix="/api/share", tags=["share"])


@router.post("/suggestion/{suggestion_id}")
async def share_suggestion(
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a shareable link for an integration suggestion.
    
    Generates a unique share code and URL that can be shared publicly.
    Tracks share events for analytics.
    """
    # Get suggestion
    suggestion = db.query(Suggestion).filter(
        Suggestion.id == suggestion_id,
        Suggestion.user_id == current_user.id
    ).first()
    
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suggestion not found"
        )
    
    # Generate share code if not exists
    if not hasattr(suggestion, 'share_code') or not suggestion.share_code:
        suggestion.share_code = secrets.token_urlsafe(16)
        suggestion.share_enabled = True
        db.commit()
        db.refresh(suggestion)
    
    share_url = f"/share/suggestion/{suggestion.share_code}"
    
    # Track share event
    track_event(
        db=db,
        user_id=str(current_user.id),
        event_type="share",
        properties={
            "suggestion_id": str(suggestion_id),
            "share_code": suggestion.share_code,
            "share_type": "suggestion"
        }
    )
    
    return {
        "share_code": suggestion.share_code,
        "share_url": share_url,
        "full_url": share_url,  # Frontend will construct full URL
        "created_at": suggestion.created_at.isoformat()
    }


@router.get("/suggestion/{share_code}")
async def get_shared_suggestion(
    share_code: str,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get a shared integration suggestion by share code.
    
    Tracks view events for analytics. If user is logged in, tracks signup conversion.
    """
    # Get suggestion by share code
    suggestion = db.query(Suggestion).filter(
        Suggestion.share_code == share_code,
        Suggestion.share_enabled == True
    ).first()
    
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared suggestion not found"
        )
    
    # Increment view count
    if not hasattr(suggestion, 'view_count'):
        suggestion.view_count = 0
    suggestion.view_count = (suggestion.view_count or 0) + 1
    db.commit()
    
    # Track view event
    user_id = str(current_user.id) if current_user else None
    track_event(
        db=db,
        user_id=user_id or "anonymous",
        event_type="share_view",
        properties={
            "share_code": share_code,
            "suggestion_id": str(suggestion.id),
            "is_logged_in": current_user is not None
        }
    )
    
    # Track UTM if user is logged in (potential conversion)
    if current_user:
        # Check if this is a conversion (user signed up from this share)
        utm_track = db.query(UTMTrack).filter(
            UTMTrack.user_id == current_user.id,
            UTMTrack.source == "share",
            UTMTrack.campaign == f"suggestion_{share_code}"
        ).first()
        
        if not utm_track:
            # Create UTM track for conversion tracking
            utm_track = UTMTrack(
                user_id=current_user.id,
                source="share",
                medium="suggestion",
                campaign=f"suggestion_{share_code}",
                term=None,
                content=None
            )
            db.add(utm_track)
            db.commit()
    
    return {
        "suggestion": {
            "id": str(suggestion.id),
            "trigger": suggestion.trigger,
            "tools_involved": suggestion.tools_involved,
            "suggested_integration": suggestion.suggested_integration,
            "sample_code": suggestion.sample_code,
            "reasoning": suggestion.reasoning,
            "confidence": suggestion.confidence,
            "created_at": suggestion.created_at.isoformat()
        },
        "share_code": share_code,
        "view_count": suggestion.view_count or 0,
        "is_owner": current_user and current_user.id == suggestion.user_id
    }


@router.get("/suggestion/{share_code}/stats")
async def get_share_stats(
    share_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get statistics for a shared suggestion (views, signups, etc.).
    
    Only accessible by the suggestion owner.
    """
    suggestion = db.query(Suggestion).filter(
        Suggestion.share_code == share_code,
        Suggestion.user_id == current_user.id
    ).first()
    
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suggestion not found or not authorized"
        )
    
    # Get view count
    view_count = suggestion.view_count or 0
    
    # Get signups from this share (via UTM tracking)
    signups_from_share = db.query(func.count(func.distinct(UTMTrack.user_id))).filter(
        UTMTrack.source == "share",
        UTMTrack.campaign == f"suggestion_{share_code}"
    ).scalar() or 0
    
    # Get total share events
    total_shares = db.query(func.count(Event.id)).filter(
        Event.event_type == "share",
        Event.details["share_code"].astext == share_code
    ).scalar() or 0
    
    return {
        "share_code": share_code,
        "view_count": view_count,
        "signups_from_share": signups_from_share,
        "total_shares": total_shares,
        "conversion_rate": round((signups_from_share / view_count * 100) if view_count > 0 else 0, 2)
    }
