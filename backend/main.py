"""FastAPI backend application for Floyo."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import SessionLocal, init_db, get_db
from database.models import (
    Base, User, Event, Pattern, FileRelationship, TemporalPattern,
    Suggestion, UserConfig, Workflow, UserSession
)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize database
init_db()

# FastAPI app
app = FastAPI(
    title="Floyo API",
    description="API for Floyo - File usage pattern tracking and integration suggestions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"message": "Floyo API", "version": "1.0.0"}


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
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
    
    # Create user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
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
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
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


@app.post("/api/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new event."""
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
    
    # Trigger pattern analysis (simplified)
    await manager.broadcast(f"Event created: {event.event_type}")
    
    return db_event


@app.get("/api/events", response_model=List[EventResponse])
async def get_events(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user events."""
    events = db.query(Event).filter(
        Event.user_id == current_user.id
    ).order_by(Event.timestamp.desc()).offset(skip).limit(limit).all()
    return events


@app.get("/api/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration suggestions for the user."""
    # Get recent events
    recent_events = db.query(Event).filter(
        Event.user_id == current_user.id
    ).order_by(Event.timestamp.desc()).limit(50).all()
    
    # Convert to tracker format and generate suggestions
    # This is a simplified version - you'd want to adapt the tracker to use DB
    suggestions = db.query(Suggestion).filter(
        Suggestion.user_id == current_user.id,
        Suggestion.is_dismissed == False
    ).order_by(Suggestion.created_at.desc()).limit(limit).all()
    
    return suggestions


@app.post("/api/suggestions/generate", response_model=List[SuggestionResponse])
async def generate_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate new suggestions based on patterns."""
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


@app.get("/api/patterns", response_model=List[PatternResponse])
async def get_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage patterns."""
    patterns = db.query(Pattern).filter(
        Pattern.user_id == current_user.id
    ).all()
    return patterns


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
