"""FastAPI backend application for Floyo."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, or_, and_
from sqlalchemy.orm import sessionmaker
import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt

import os
import sys
import secrets
from pathlib import Path
from typing import Optional as TypingOptional
from datetime import timedelta

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import SessionLocal, init_db, get_db
from backend.logging_config import setup_logging, get_logger
from backend.sentry_config import init_sentry
from backend.rate_limit import limiter, get_rate_limit_exceeded_handler, RATE_LIMIT_PER_MINUTE, RATE_LIMIT_PER_HOUR
from backend.cache import init_cache, cached, get, set, delete
from fastapi.middleware.gzip import GZipMiddleware

# Set up logging
setup_logging()
logger = get_logger(__name__)

# Initialize Sentry
init_sentry()

# Initialize cache
init_cache()
from database.models import (
    Base, User, Event, Pattern, FileRelationship, TemporalPattern,
    Suggestion, UserConfig, Workflow, UserSession, Organization,
    OrganizationMember, AuditLog, IntegrationConnector, UserIntegration,
    WorkflowVersion, WorkflowExecution
)
from sqlalchemy import text
from backend.batch_processor import process_event_batch
from backend.export import export_patterns_csv, export_patterns_json, export_events_csv, export_events_json
from backend.audit import log_audit
from backend.organizations import create_organization, get_user_organizations, get_organization_members, add_member, update_member_role
from backend.workflow_scheduler import WorkflowScheduler
from backend.connectors import initialize_connectors, get_available_connectors, create_user_integration
from fastapi.responses import Response

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize database
init_db()

# Initialize default connectors
from backend.database import SessionLocal as DB
db_init = DB()
initialize_connectors(db_init)
db_init.close()

# FastAPI app
app = FastAPI(
    title="Floyo API",
    description="""
    ## Floyo API Documentation
    
    Floyo is a file usage pattern tracking system that suggests concrete, niche API integrations 
    based on actual user routines.
    
    ### Features
    
    * **User Authentication**: JWT-based authentication with email verification
    * **Event Tracking**: Track file operations and tool usage
    * **Pattern Analysis**: Discover usage patterns from tracked events
    * **Integration Suggestions**: Get intelligent suggestions for API integrations
    * **File Upload**: Upload files and track them as events
    
    ### Authentication
    
    Most endpoints require authentication. Include the JWT token in the Authorization header:
    
    ```
    Authorization: Bearer <token>
    ```
    
    ### API Versioning
    
    Current version: v1
    - `/api/v1/*` - Versioned endpoints (recommended)
    - `/api/*` - Legacy endpoints (deprecated, will be removed in v2)
    
    ### Endpoints
    
    - `/api/v1/auth/*` - Authentication endpoints
    - `/api/v1/events/*` - Event tracking endpoints
    - `/api/v1/patterns` - Pattern analysis endpoints
    - `/api/v1/suggestions/*` - Integration suggestion endpoints
    - `/api/v1/stats` - Statistics endpoints
    - `/api/v1/config` - User configuration endpoints
    """,
    version="1.0.0",
    contact={
        "name": "Floyo Support",
        "email": "support@floyo.dev",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# API version router
api_v1_router = APIRouter(prefix="/api/v1", tags=["v1"])
api_router = APIRouter(prefix="/api", tags=["legacy"])

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security headers middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting
app.state.limiter = limiter
from slowapi.errors import RateLimitExceeded
app.add_exception_handler(RateLimitExceeded, get_rate_limit_exceeded_handler())

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()


# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: Optional[str]
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    event_type: str
    file_path: Optional[str] = None
    tool: Optional[str] = None
    operation: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class EventResponse(BaseModel):
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
    id: UUID
    file_extension: Optional[str]
    count: int
    last_used: Optional[datetime]
    tools: Optional[List[str]]

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class PaginationParams(BaseModel):
    """Pagination parameters."""
    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=20, ge=1, le=100, description="Number of items to return")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")


# Database dependency (already imported from backend.database)


# Authentication
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user is None:
        raise credentials_exception
    return user


# Routes
@app.get("/")
async def root():
    return {"message": "Floyo API", "version": "1.0.0", "api_version": "v1"}


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.get("/health/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    """Readiness check - verifies database connectivity."""
    try:
        # Simple query to check DB connectivity
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": "ok"
            }
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready"
        )


@app.get("/health/liveness")
async def liveness_check():
    """Liveness check - verifies the service is running."""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include versioned routes (we'll add these to api_v1_router)
# For now, keep existing routes and add version prefix in the future

# Mount versioned router
app.include_router(api_v1_router)
app.include_router(api_router)


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
async def register(
    request: Request,
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if user.username:
        existing_username = db.query(User).filter(User.username == user.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)
    
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
    
    # In production, send verification email here
    # For now, log the token (in dev only)
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
    
    return db_user


@app.post("/api/auth/login", response_model=Token)
@limiter.limit(f"{RATE_LIMIT_PER_HOUR}/hour")
async def login(
    request: Request,
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login and get access token."""
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
    
    # Store session
    session = UserSession(
        user_id=user.id,
        token_hash=access_token[:50],  # Simplified
        expires_at=datetime.utcnow() + access_token_expires
    )
    db.add(session)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@app.put("/api/auth/profile", response_model=UserResponse)
async def update_profile(
    full_name: TypingOptional[str] = None,
    username: TypingOptional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile."""
    if username and username != current_user.username:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = username
    
    if full_name is not None:
        current_user.full_name = full_name
    
    db.commit()
    db.refresh(current_user)
    return current_user


@app.get("/api/auth/verify-email/{token}")
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


@app.post("/api/auth/resend-verification")
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
    
    # In production, send verification email here
    logger.info(f"Email verification token for {current_user.email}: {verification_token}")
    
    return {"message": "Verification email sent"}


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str


@app.post("/api/auth/forgot-password")
@limiter.limit("5/hour")
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
        
        # In production, send reset email here
        logger.info(f"Password reset token for {user.email}: {reset_token}")
    
    return {"message": "If the email exists, a password reset link has been sent"}


@app.post("/api/auth/reset-password")
@limiter.limit("10/hour")
async def reset_password(
    request: Request,
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password with token."""
    # Validate password strength
    if len(reset_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
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
    
    logger.info(f"Password reset successful for user: {user.email}")
    
    return {"message": "Password reset successfully"}


@app.post("/api/auth/change-password")
async def change_password(
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
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@app.post("/api/events/upload")
async def upload_event_file(
    file: UploadFile = File(...),
    event_type: str = "file_upload",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file and create an event."""
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


@app.post("/api/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def create_event(
    request: Request,
    event: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new event."""
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


@app.post("/api/events/batch", response_model=List[EventResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_events_batch(
    request: Request,
    events: List[EventCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create multiple events in a batch."""
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


@app.get("/api/events", response_model=PaginatedResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_events(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    event_type: TypingOptional[str] = None,
    tool: TypingOptional[str] = None,
    search: TypingOptional[str] = None,
    sort_by: TypingOptional[str] = None,
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user events with filtering, search, and pagination."""
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


@app.get("/api/suggestions", response_model=PaginatedResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_suggestions(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    confidence_min: TypingOptional[float] = None,
    is_dismissed: TypingOptional[bool] = None,
    is_applied: TypingOptional[bool] = None,
    sort_by: TypingOptional[str] = None,
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration suggestions with filtering and pagination."""
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


@app.post("/api/suggestions/generate", response_model=List[SuggestionResponse])
@limiter.limit("10/hour")
async def generate_suggestions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate new suggestions based on patterns."""
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
    
    # Use the suggester logic (adapted for DB)
    # This is a placeholder - you'd integrate the suggester properly
    # For now, create a sample suggestion
    new_suggestion = Suggestion(
        user_id=current_user.id,
        trigger="Recently used Python files",
        suggested_integration="Dropbox API - auto-sync output files",
        sample_code="# Auto-sync code here",
        reasoning="Based on your usage patterns",
        confidence=0.7
    )
    db.add(new_suggestion)
    db.commit()
    db.refresh(new_suggestion)
    
    await manager.broadcast("New suggestions generated")
    
    return [new_suggestion]


@app.get("/api/patterns", response_model=PaginatedResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_patterns(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    file_extension: TypingOptional[str] = None,
    sort_by: TypingOptional[str] = None,
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage patterns with filtering and pagination."""
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


@app.get("/api/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tracking statistics."""
    total_events = db.query(Event).filter(Event.user_id == current_user.id).count()
    total_patterns = db.query(Pattern).filter(Pattern.user_id == current_user.id).count()
    total_relationships = db.query(FileRelationship).filter(
        FileRelationship.user_id == current_user.id
    ).count()
    total_suggestions = db.query(Suggestion).filter(
        Suggestion.user_id == current_user.id
    ).count()
    
    return {
        "total_events": total_events,
        "total_patterns": total_patterns,
        "total_relationships": total_relationships,
        "total_suggestions": total_suggestions
    }


@app.get("/api/config")
async def get_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user configuration."""
    config = db.query(UserConfig).filter(UserConfig.user_id == current_user.id).first()
    if not config:
        # Create default config
        config = UserConfig(
            user_id=current_user.id,
            monitored_directories=[],
            exclude_patterns=[],
            tracking_config={},
            suggestions_config={},
            privacy_config={}
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@app.put("/api/config")
async def update_config(
    config_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user configuration."""
    config = db.query(UserConfig).filter(UserConfig.user_id == current_user.id).first()
    if not config:
        config = UserConfig(user_id=current_user.id)
        db.add(config)
    
    for key, value in config_data.items():
        if hasattr(config, key):
            setattr(config, key, value)
    
    db.commit()
    db.refresh(config)
    return config


@app.post("/api/suggestions/{suggestion_id}/bookmark")
async def bookmark_suggestion(
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bookmark/favorite a suggestion."""
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


@app.post("/api/suggestions/{suggestion_id}/apply")
async def apply_suggestion(
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a suggestion as applied."""
    suggestion = db.query(Suggestion).filter(
        Suggestion.id == suggestion_id,
        Suggestion.user_id == current_user.id
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.is_applied = True
    db.commit()
    
    # Clear cache
    delete(f"suggestions:{current_user.id}:*")
    
    return {"message": "Suggestion marked as applied"}


@app.post("/api/suggestions/{suggestion_id}/dismiss")
async def dismiss_suggestion(
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dismiss a suggestion."""
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


@app.get("/api/patterns/export")
async def export_patterns(
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export patterns in CSV or JSON format."""
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


@app.get("/api/events/export")
async def export_events(
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export events in CSV or JSON format."""
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


@app.get("/api/data/export")
async def export_all_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all user data for GDPR compliance (right to data portability)."""
    import json
    from io import BytesIO
    import zipfile
    
    # Collect all user data
    user_data = {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "events": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "file_path": e.file_path,
                "tool": e.tool,
                "operation": e.operation,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "details": e.details
            }
            for e in db.query(Event).filter(Event.user_id == current_user.id).all()
        ],
        "patterns": [
            {
                "id": str(p.id),
                "file_extension": p.file_extension,
                "count": p.count,
                "last_used": p.last_used.isoformat() if p.last_used else None,
                "tools": p.tools
            }
            for p in db.query(Pattern).filter(Pattern.user_id == current_user.id).all()
        ],
        "suggestions": [
            {
                "id": str(s.id),
                "trigger": s.trigger,
                "suggested_integration": s.suggested_integration,
                "confidence": s.confidence,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in db.query(Suggestion).filter(Suggestion.user_id == current_user.id).all()
        ],
        "workflows": [
            {
                "id": str(w.id),
                "name": w.name,
                "description": w.description,
                "is_active": w.is_active,
                "created_at": w.created_at.isoformat() if w.created_at else None
            }
            for w in db.query(Workflow).filter(Workflow.user_id == current_user.id).all()
        ]
    }
    
    # Create ZIP file
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("user_data.json", json.dumps(user_data, indent=2, default=str))
    
    zip_buffer.seek(0)
    
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=floyo_data_export_{datetime.utcnow().strftime('%Y%m%d')}.zip"}
    )


@app.delete("/api/data/delete")
@limiter.limit("1/hour")
async def delete_all_data(
    request: Request,
    confirm: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all user data for GDPR compliance (right to be forgotten)."""
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must confirm deletion by setting confirm=true"
        )
    
    # Delete all user-related data (cascade should handle most)
    # Events, patterns, suggestions, workflows will be deleted via cascade
    # But we'll explicitly delete to ensure everything is removed
    
    db.query(Event).filter(Event.user_id == current_user.id).delete()
    db.query(Pattern).filter(Pattern.user_id == current_user.id).delete()
    db.query(Suggestion).filter(Suggestion.user_id == current_user.id).delete()
    db.query(Workflow).filter(Workflow.user_id == current_user.id).delete()
    db.query(FileRelationship).filter(FileRelationship.user_id == current_user.id).delete()
    db.query(TemporalPattern).filter(TemporalPattern.user_id == current_user.id).delete()
    db.query(UserSession).filter(UserSession.user_id == current_user.id).delete()
    db.query(UserConfig).filter(UserConfig.user_id == current_user.id).delete()
    
    # Soft delete user account
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}@deleted.local"
    current_user.hashed_password = ""
    
    db.commit()
    
    log_audit(
        db=db,
        action="delete",
        resource_type="user_data",
        user_id=current_user.id,
        details={"reason": "GDPR data deletion request"},
        request=request
    )
    
    return {"message": "All user data has been deleted"}


@app.post("/api/data/retention/cleanup")
async def cleanup_old_data(
    retention_days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clean up old data for current user based on retention policy."""
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
    deleted_count = 0
    
    # User-specific cleanup
    deleted_events = db.query(Event).filter(
        Event.user_id == current_user.id,
        Event.timestamp < cutoff_date
    ).delete(synchronize_session=False)
    deleted_count += deleted_events
    
    deleted_patterns = db.query(Pattern).filter(
        Pattern.user_id == current_user.id,
        Pattern.updated_at < cutoff_date
    ).delete(synchronize_session=False)
    deleted_count += deleted_patterns
    
    db.commit()
    
    logger.info(f"Cleaned up {deleted_count} old records for user {current_user.id} (older than {retention_days} days)")
    
    return {
        "message": f"Cleaned up {deleted_count} records older than {retention_days} days",
        "deleted_count": deleted_count,
        "cutoff_date": cutoff_date.isoformat()
    }


# Organization endpoints
class OrganizationCreate(BaseModel):
    name: str
    description: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    subscription_tier: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@app.post("/api/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_org(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Create a new organization."""
    org = create_organization(
        db=db,
        name=org_data.name,
        owner=current_user,
        description=org_data.description,
        request=request
    )
    return org


@app.get("/api/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all organizations the user belongs to."""
    orgs = get_user_organizations(db, current_user.id)
    return orgs


@app.get("/api/organizations/{org_id}/members")
async def list_org_members(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get members of an organization."""
    # Check if user is member
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    
    members = get_organization_members(db, org_id)
    return members


# Workflow endpoints with versioning
class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    steps: Dict[str, Any]
    schedule_config: Optional[Dict[str, Any]] = None
    organization_id: Optional[UUID] = None


@app.post("/api/workflows", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Create a new workflow."""
    workflow = Workflow(
        user_id=current_user.id,
        organization_id=workflow_data.organization_id,
        name=workflow_data.name,
        description=workflow_data.description,
        steps=workflow_data.steps,
        schedule_config=workflow_data.schedule_config,
        is_active=True,
        version=1
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    
    # Create initial version
    WorkflowScheduler.create_version(
        db=db,
        workflow=workflow,
        created_by=current_user.id,
        change_summary="Initial version"
    )
    
    log_audit(
        db=db,
        action="create",
        resource_type="workflow",
        user_id=current_user.id,
        organization_id=workflow_data.organization_id,
        resource_id=workflow.id,
        request=request
    )
    
    return {"id": workflow.id, "name": workflow.name, "version": workflow.version}


@app.post("/api/workflows/{workflow_id}/rollback")
async def rollback_workflow(
    workflow_id: UUID,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Rollback workflow to a previous version."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = WorkflowScheduler.rollback_to_version(
        db=db,
        workflow=workflow,
        version_number=version_number,
        rollback_by=current_user.id
    )
    
    log_audit(
        db=db,
        action="rollback",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow.id,
        details={"version": version_number},
        request=request
    )
    
    return {"message": f"Rolled back to version {version_number}"}


@app.post("/api/workflows/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Execute a workflow manually."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    execution = WorkflowScheduler.execute_workflow(
        db=db,
        workflow=workflow,
        triggered_by=current_user.id
    )
    
    log_audit(
        db=db,
        action="execute",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow.id,
        request=request
    )
    
    return {"execution_id": execution.id, "status": execution.status}


@app.get("/api/workflows/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: UUID,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get execution history for a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    executions = WorkflowScheduler.get_execution_history(
        db=db,
        workflow_id=workflow_id,
        limit=limit,
        offset=offset
    )
    
    return executions


# Integration connector endpoints
@app.get("/api/integrations/connectors")
async def list_connectors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available integration connectors."""
    connectors = get_available_connectors(db)
    return connectors


class IntegrationCreate(BaseModel):
    connector_id: UUID
    name: str
    config: Dict[str, Any]
    organization_id: Optional[UUID] = None


@app.post("/api/integrations", status_code=status.HTTP_201_CREATED)
async def create_integration(
    integration_data: IntegrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Create a new integration."""
    integration = create_user_integration(
        db=db,
        user_id=current_user.id,
        connector_id=integration_data.connector_id,
        name=integration_data.name,
        config=integration_data.config,
        organization_id=integration_data.organization_id
    )
    
    log_audit(
        db=db,
        action="create",
        resource_type="integration",
        user_id=current_user.id,
        organization_id=integration_data.organization_id,
        resource_id=integration.id,
        request=request
    )
    
    return {"id": integration.id, "name": integration.name}


# Audit log endpoints
@app.get("/api/audit-logs")
async def get_audit_logs(
    organization_id: Optional[UUID] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit logs."""
    from backend.audit import get_audit_logs as query_audit_logs
    
    # Only allow access if user is admin/owner
    if organization_id:
        membership = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == current_user.id
        ).first()
        
        if not membership or membership.role not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    logs = query_audit_logs(
        db=db,
        organization_id=organization_id,
        user_id=current_user.id if not organization_id else None,
        limit=limit,
        offset=offset
    )
    
    return logs


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for realtime updates."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Message: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
