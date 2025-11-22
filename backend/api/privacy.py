"""Privacy settings API endpoints."""

import sys
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database import get_db
from backend.logging_config import get_logger
from backend.auth.utils import get_current_user
from database.models import User, PrivacyPrefs

logger = get_logger(__name__)
router = APIRouter(prefix="/api/privacy", tags=["privacy"])


class PrivacySettingsUpdate(BaseModel):
    monitoringEnabled: bool
    dataRetentionDays: int
    appAllowlists: list[Dict[str, Any]]


@router.get("/settings")
async def get_privacy_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get privacy settings for the current user."""
    try:
        privacy_prefs = db.query(PrivacyPrefs).filter(
            PrivacyPrefs.user_id == str(current_user.id)
        ).first()
        
        if not privacy_prefs:
            # Return defaults
            return {
                "monitoringEnabled": False,
                "dataRetentionDays": 14,
                "appAllowlists": [],
            }
        
        # Get app allowlists
        app_allowlists = []
        for allowlist in privacy_prefs.appAllowlists:
            app_allowlists.append({
                "appId": allowlist.app_id,
                "appName": allowlist.app_name,
                "enabled": allowlist.enabled,
            })
        
        return {
            "monitoringEnabled": privacy_prefs.monitoring_enabled,
            "dataRetentionDays": privacy_prefs.data_retention_days,
            "appAllowlists": app_allowlists,
        }
    except Exception as e:
        logger.error(f"Error getting privacy settings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get privacy settings: {str(e)}"
        )


@router.put("/settings")
async def update_privacy_settings(
    settings: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update privacy settings for the current user."""
    try:
        privacy_prefs = db.query(PrivacyPrefs).filter(
            PrivacyPrefs.user_id == str(current_user.id)
        ).first()
        
        if not privacy_prefs:
            # Create new privacy preferences
            privacy_prefs = PrivacyPrefs(
                user_id=str(current_user.id),
                monitoring_enabled=settings.monitoringEnabled,
                data_retention_days=settings.dataRetentionDays,
            )
            db.add(privacy_prefs)
        else:
            # Update existing preferences
            privacy_prefs.monitoring_enabled = settings.monitoringEnabled
            privacy_prefs.data_retention_days = settings.dataRetentionDays
        
        # Update app allowlists
        # Note: This is simplified - in production, you'd properly sync allowlists
        # For now, we'll just update the monitoring_enabled flag
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Privacy settings updated"
        }
    except Exception as e:
        logger.error(f"Error updating privacy settings: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update privacy settings: {str(e)}"
        )
