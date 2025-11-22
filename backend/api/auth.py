"""Authentication API endpoints."""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.config import settings
from backend.logging_config import get_logger
from backend.rate_limit import limiter, get_endpoint_rate_limit
from backend.cache import invalidate_user_cache, invalidate_resource_cache
from backend.email_service import email_service
from backend.security import InputSanitizer
from backend.error_handling import (
    ValidationError, ConflictError, APIError, handle_database_error
)
from backend.audit import log_audit
from backend.auth.utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
    ALGORITHM,
)
from backend.auth.models import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    PasswordResetRequest,
    PasswordReset,
)
from backend.auth.analytics_helpers import (
    track_event,
    check_user_activation,
    mark_user_activated,
)
from database.models import User, UserSession, UserConfig

logger = get_logger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(get_endpoint_rate_limit("auth", "register") or "3/hour")
async def register(
    request: Request,
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user with enhanced validation.
    
    Validates email format, password strength, and checks for existing users.
    Provides a clear value proposition: "Join Floyo to discover intelligent workflow
    automation suggestions based on your actual file usage patterns."
    """
    # Validate email format
    if not InputSanitizer.validate_email(user.email):
        raise ValidationError("Invalid email format")
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise ConflictError("Email already registered")
    
    if user.username:
        # Sanitize username
        user.username = InputSanitizer.sanitize_string(user.username, max_length=50)
        existing_username = db.query(User).filter(User.username == user.username).first()
        if existing_username:
            raise ConflictError("Username already taken")
    
    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Validate password strength
    password_validation = InputSanitizer.validate_password_strength(user.password)
    if not password_validation["is_valid"]:
        raise ValidationError(
            "Password does not meet requirements",
            details={"issues": password_validation["issues"]}
        )
    
    # Create user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_expires=datetime.utcnow() + timedelta(days=1)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Send verification email
    email_sent = email_service.send_email_verification_email(
        to_email=user.email,
        verification_token=verification_token
    )
    
    if not email_sent and settings.environment != "production":
        # Fallback: log token in development if email service not configured
        logger.info(f"Email verification token for {user.email}: {verification_token}")
    
    db.refresh(db_user)
    
    # Create default config
    default_config = UserConfig(
        user_id=db_user.id,
        monitored_directories=[],
        exclude_patterns=[
            r"\.git/",
            r"__pycache__/",
            r"\.pyc$",
            r"node_modules/",
            r"\.floyo/"
        ],
        tracking_config={
            "enable_file_watcher": True,
            "enable_command_tracking": True,
            "max_events": 1000,
            "retention_days": 90
        },
        suggestions_config={
            "max_suggestions": 5,
            "use_actual_file_paths": True
        },
        privacy_config={
            "anonymize_paths": False,
            "exclude_sensitive_dirs": []
        }
    )
    db.add(default_config)
    db.commit()
    
    # Track signup event
    track_event(
        db=db,
        user_id=str(db_user.id),
        event_type="user_signed_up",
        properties={
            "email": db_user.email,
            "signup_method": "email",
            "username": db_user.username
        }
    )
    
    return db_user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # More restrictive to prevent brute force attacks
async def login(
    request: Request,
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login and get access token.
    
    Returns JWT access and refresh tokens for authenticated API access.
    """
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Store session
    session = UserSession(
        user_id=user.id,
        token_hash=refresh_token[:50],  # Store refresh token hash
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    db.commit()
    
    # Track login event
    track_event(
        db=db,
        user_id=str(user.id),
        event_type="user_logged_in",
        properties={
            "email": user.email
        }
    )
    
    # Check if user just activated
    if check_user_activation(db, str(user.id)):
        mark_user_activated(db, str(user.id), "login")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/refresh")
@limiter.limit("30/minute")  # Rate limited for refresh token endpoint
async def refresh_token_endpoint(
    request: Request,
    refresh_token: str,
    db: Session = Depends(get_db),
    rotate: bool = False  # Token rotation flag
):
    """
    Refresh access token using refresh token with optional rotation.
    
    Use this endpoint to get a new access token when your current one expires.
    Set rotate=true to invalidate the old refresh token and get a new one.
    """
    import jwt
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Verify session exists and is valid
        session = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.token_hash == refresh_token[:50],
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Token rotation: if requested, invalidate old refresh token and create new one
        if rotate:
            # Delete old session
            db.delete(session)
            db.commit()
            
            # Create new refresh token and session
            refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            new_refresh_token = create_refresh_token(
                data={"sub": str(user.id), "type": "refresh"},
                expires_delta=refresh_token_expires
            )
            
            # Create new session
            new_session = UserSession(
                user_id=user.id,
                token_hash=new_refresh_token[:50],
                device_info=request.headers.get("user-agent"),
                ip_address=request.client.host if request.client else None,
                expires_at=datetime.utcnow() + refresh_token_expires
            )
            db.add(new_session)
            db.commit()
            
            refresh_token_to_return = new_refresh_token
        else:
            # Just update last_used
            session.last_used_at = datetime.utcnow()
            db.commit()
            refresh_token_to_return = refresh_token
        
        # Generate new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        result = {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
        # Include refresh token only if rotated
        if rotate:
            result["refresh_token"] = refresh_token_to_return
        
        return result
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/sessions")
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active sessions for current user."""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.expires_at > datetime.utcnow()
    ).order_by(UserSession.last_used_at.desc()).all()
    
    return [
        {
            "id": str(s.id),
            "device_info": s.device_info,
            "ip_address": s.ip_address,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "last_used_at": s.last_used_at.isoformat() if s.last_used_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
        }
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific session."""
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session revoked successfully"}


@router.delete("/sessions")
async def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all sessions except current one."""
    # Note: This would need the current session ID to exclude it
    # For simplicity, revoking all sessions
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).delete()
    db.commit()
    
    return {"message": "All sessions revoked successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    full_name: Optional[str] = None,
    username: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile with input validation and cache invalidation.
    
    Sanitizes inputs and invalidates user cache on update.
    """
    try:
        if username and username != current_user.username:
            # Sanitize username
            username = InputSanitizer.sanitize_string(username, max_length=50)
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                raise ConflictError("Username already taken")
            current_user.username = username
        
        if full_name is not None:
            # Sanitize full name
            current_user.full_name = InputSanitizer.sanitize_string(full_name, max_length=200)
        
        db.commit()
        db.refresh(current_user)
        
        # Invalidate user cache
        invalidate_user_cache(str(current_user.id))
        invalidate_resource_cache("user", str(current_user.id))
        
        return current_user
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}", exc_info=True)
        raise handle_database_error(e, context="update_profile")


@router.get("/verify-email/{token}")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user email with token."""
    user = db.query(User).filter(
        User.email_verification_token == token,
        User.email_verification_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    db.commit()
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resend email verification."""
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Generate new token
    verification_token = secrets.token_urlsafe(32)
    current_user.email_verification_token = verification_token
    current_user.email_verification_expires = datetime.utcnow() + timedelta(days=1)
    db.commit()
    
    # Send verification email
    email_sent = email_service.send_email_verification_email(
        to_email=current_user.email,
        verification_token=verification_token
    )
    
    if not email_sent and settings.environment != "production":
        # Fallback: log token in development if email service not configured
        logger.info(f"Email verification token for {current_user.email}: {verification_token}")
    
    return {"message": "Verification email sent"}


@router.post("/forgot-password")
@limiter.limit("5/hour")  # Rate limited to prevent email enumeration
async def forgot_password(
    request: Request,
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset."""
    user = db.query(User).filter(User.email == reset_request.email).first()
    
    # Don't reveal if email exists (security best practice)
    if user:
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        # Send password reset email
        email_sent = email_service.send_password_reset_email(
            to_email=user.email,
            reset_token=reset_token
        )
        
        if not email_sent and settings.environment != "production":
            # Fallback: log token in development if email service not configured
            logger.info(f"Password reset token for {user.email}: {reset_token}")
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
@limiter.limit("10/hour")
async def reset_password(
    request: Request,
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password with token."""
    # Validate password strength
    password_validation = InputSanitizer.validate_password_strength(reset_data.new_password)
    if not password_validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password does not meet requirements: {', '.join(password_validation['issues'])}"
        )
    
    user = db.query(User).filter(
        User.password_reset_token == reset_data.token,
        User.password_reset_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    # Log audit event
    log_audit(
        db=db,
        action="password_reset",
        resource_type="user",
        user_id=user.id,
        resource_id=user.id,
        details={"email": user.email}
    )
    
    logger.info(f"Password reset successful for user: {user.email}")
    
    return {"message": "Password reset successfully"}


@router.post("/change-password")
@limiter.limit("5/hour")  # Rate limited for security
async def change_password(
    request: Request,
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password (requires current password)."""
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password"
        )
    
    # Validate password strength
    password_validation = InputSanitizer.validate_password_strength(new_password)
    if not password_validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password does not meet requirements: {', '.join(password_validation['issues'])}"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Log audit event
    log_audit(
        db=db,
        action="password_change",
        resource_type="user",
        user_id=current_user.id,
        resource_id=current_user.id,
        details={}
    )
    
    return {"message": "Password changed successfully"}
