"""Security API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.security import TwoFactorAuthManager, SecurityAuditor, InputSanitizer
from backend.logging_config import get_logger
from backend.auth.utils import get_current_user
from database.models import User, TwoFactorAuth

logger = get_logger(__name__)
router = APIRouter(prefix="/api/security", tags=["security"])


@router.post("/2fa/setup")
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Set up 2FA for current user.
    
    Enhance your account security with two-factor authentication.
    """
    try:
        result = TwoFactorAuthManager.setup_2fa(db, current_user.id)
        
        # Log security event
        SecurityAuditor.log_security_event(
            db=db,
            user_id=current_user.id,
            event_type="2fa_setup_initiated",
            severity="medium",
            details={"user_id": str(current_user.id)}
        )
        
        return result
    except Exception as e:
        logger.error(f"2FA setup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/2fa/verify")
async def verify_and_enable_2fa(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify 2FA token and enable 2FA."""
    success = TwoFactorAuthManager.verify_and_enable_2fa(db, current_user.id, token)
    
    if success:
        SecurityAuditor.log_security_event(
            db=db,
            user_id=current_user.id,
            event_type="2fa_enabled",
            severity="high",
            details={"user_id": str(current_user.id)}
        )
        return {"message": "2FA enabled successfully", "enabled": True}
    else:
        SecurityAuditor.log_security_event(
            db=db,
            user_id=current_user.id,
            event_type="2fa_verification_failed",
            severity="medium",
            details={"user_id": str(current_user.id)}
        )
        raise HTTPException(status_code=400, detail="Invalid 2FA token")


@router.post("/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA for current user."""
    success = TwoFactorAuthManager.disable_2fa(db, current_user.id)
    
    if success:
        SecurityAuditor.log_security_event(
            db=db,
            user_id=current_user.id,
            event_type="2fa_disabled",
            severity="high",
            details={"user_id": str(current_user.id)}
        )
        return {"message": "2FA disabled successfully"}
    else:
        raise HTTPException(status_code=400, detail="2FA not enabled")


@router.get("/2fa/status")
async def get_2fa_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get 2FA status for current user."""
    two_fa = db.query(TwoFactorAuth).filter(TwoFactorAuth.user_id == current_user.id).first()
    
    if not two_fa:
        return {"enabled": False, "setup": False}
    
    return {
        "enabled": two_fa.is_enabled,
        "setup": True,
        "has_backup_codes": len(two_fa.backup_codes) > 0 if two_fa.backup_codes else False
    }


@router.get("/audit")
async def get_security_audit(
    severity: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get security audit events (admin only or own events).
    
    Monitor security events and suspicious activity on your account.
    """
    if current_user.is_superuser:
        # Admin can see all events
        events = SecurityAuditor.get_security_events(db, None, severity, limit)
    else:
        # Users can only see their own events
        events = SecurityAuditor.get_security_events(db, current_user.id, severity, limit)
    
    return {"security_events": events, "count": len(events)}


@router.get("/suspicious-activity")
async def check_suspicious_activity(
    time_window_minutes: int = 15,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check for suspicious activity on current user account.
    
    Get alerts about potentially suspicious login attempts or account activity.
    """
    activity = SecurityAuditor.detect_suspicious_activity(
        db, current_user.id, time_window_minutes
    )
    return activity


@router.post("/validate-password")
async def validate_password_strength(
    password: str,
    db: Session = Depends(get_db)
):
    """
    Validate password strength.
    
    Check if a password meets security requirements before setting it.
    """
    validation = InputSanitizer.validate_password_strength(password)
    return validation
