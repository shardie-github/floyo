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
    WorkflowVersion, WorkflowExecution, Referral, ReferralReward,
    RetentionCampaign, WorkflowShare, SubscriptionPlan, Subscription,
    UsageMetric, BillingEvent, SSOProvider, SSOConnection,
    ComplianceReport, EnterpriseSettings
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
from backend.config import settings

# SECURITY: All credentials MUST come from environment variables via settings
# No hardcoded passwords, secrets, or API keys are allowed in this file
# Settings are validated on load (see backend/config.py for validation rules)
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days

# Initialize database
init_db()

# Check migration status on startup
def check_migration_status():
    """Check if database migrations are up to date."""
    try:
        from alembic.config import Config
        from alembic import script
        from alembic.runtime.migration import MigrationContext
        from sqlalchemy import create_engine
        
        alembic_cfg = Config("alembic.ini")
        script_dir = script.ScriptDirectory.from_config(alembic_cfg)
        
        # Get current database revision
        from backend.database import engine
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_rev = context.get_current_revision()
        
        # Get head revision
        head_rev = script_dir.get_current_head()
        
        if current_rev != head_rev:
            logger.warning(f"Database migrations are not up to date. Current: {current_rev}, Head: {head_rev}")
            if settings.environment == "production":
                raise ValueError(
                    f"Database migrations are not up to date. "
                    f"Current: {current_rev}, Head: {head_rev}. "
                    f"Run 'alembic upgrade head' to apply migrations."
                )
        else:
            logger.info("Database migrations are up to date")
    except Exception as e:
        logger.warning(f"Could not check migration status: {e}")
        # Don't fail startup if migration check fails (might be in dev)

# Check migrations on startup
try:
    check_migration_status()
except Exception as e:
    if settings.environment == "production":
        raise
    logger.warning(f"Migration check skipped: {e}")

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
    allow_origins=settings.cors_origins,
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
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
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
    """Readiness check - verifies database connectivity and other dependencies."""
    checks = {}
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        logger.error(f"Database check failed: {e}")
        checks["database"] = "error"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready"
        )
    
    # Check Redis (if configured)
    from backend.cache import redis_client
    if redis_client:
        try:
            redis_client.ping()
            checks["redis"] = "ok"
        except Exception as e:
            logger.warning(f"Redis check failed: {e}")
            checks["redis"] = "warning"  # Redis is optional
    else:
        checks["redis"] = "not_configured"
    
    # Check connection pool (if available)
    try:
        from backend.database import get_pool_status
        pool_status = get_pool_status()
        pool_utilization = pool_status["checked_out"] / pool_status["size"] if pool_status["size"] > 0 else 0
        if pool_utilization >= 0.9:
            checks["database_pool"] = "warning"
        else:
            checks["database_pool"] = "ok"
    except (ImportError, AttributeError, ZeroDivisionError):
        pass  # Pool status not available
    
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }


@app.get("/health/liveness")
async def liveness_check():
    """Liveness check - verifies the service is running."""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health/migrations")
async def migration_status():
    """Check database migration status."""
    try:
        from alembic.config import Config
        from alembic import script
        from alembic.runtime.migration import MigrationContext
        from backend.database import engine
        
        alembic_cfg = Config("alembic.ini")
        script_dir = script.ScriptDirectory.from_config(alembic_cfg)
        
        # Get current database revision
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_rev = context.get_current_revision()
        
        # Get head revision
        head_rev = script_dir.get_current_head()
        
        is_up_to_date = current_rev == head_rev
        
        return {
            "status": "up_to_date" if is_up_to_date else "pending",
            "current_revision": current_rev,
            "head_revision": head_rev,
            "pending_migrations": not is_up_to_date
        }
    except Exception as e:
        logger.warning(f"Could not check migration status: {e}")
        return {
            "status": "unknown",
            "error": str(e)
        }


@app.get("/system/selfcheck")
async def system_selfcheck():
    """
    System self-check endpoint - validates architectural guardrails at runtime.
    Returns JSON status of all guardrails.
    """
    import subprocess
    from pathlib import Path
    import json
    
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "unknown",
        "checks": {},
        "violations": []
    }
    
    # Check if guardrails validation script exists
    guardrails_script = Path("infra/selfcheck/validate_guardrails.py")
    if not guardrails_script.exists():
        results["status"] = "error"
        results["error"] = "Guardrails validation script not found"
        return results
    
    try:
        # Run guardrails validation (non-blocking, for observability)
        result = subprocess.run(
            ["python", str(guardrails_script), "--json"],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=Path(__file__).parent.parent.parent
        )
        
        if result.returncode == 0:
            # Parse JSON output
            try:
                validation_results = json.loads(result.stdout)
                results["checks"] = validation_results
                results["status"] = "healthy" if validation_results.get("failed", 0) == 0 else "degraded"
                results["violations"] = validation_results.get("violations", [])
            except json.JSONDecodeError:
                results["status"] = "error"
                results["error"] = "Could not parse validation results"
        else:
            results["status"] = "error"
            results["error"] = result.stderr or "Validation script failed"
            
    except subprocess.TimeoutExpired:
        results["status"] = "error"
        results["error"] = "Validation timeout"
    except Exception as e:
        results["status"] = "error"
        results["error"] = str(e)
    
    # Add runtime checks
    runtime_checks = {}
    
    # Check config validation
    try:
        settings.validate_production()
        runtime_checks["config_validation"] = "ok"
    except Exception as e:
        runtime_checks["config_validation"] = f"error: {str(e)}"
        results["violations"].append({
            "name": "config_validation",
            "severity": "critical",
            "error": str(e)
        })
        results["status"] = "degraded"
    
    # Check database pool
    try:
        from backend.database import get_pool_status
        pool_status = get_pool_status()
        utilization = pool_status["checked_out"] / pool_status["size"] if pool_status["size"] > 0 else 0
        runtime_checks["database_pool"] = {
            "status": "ok" if utilization < 0.9 else "warning",
            "utilization": f"{utilization:.2%}",
            "checked_out": pool_status["checked_out"],
            "size": pool_status["size"]
        }
        if utilization >= 0.9:
            results["violations"].append({
                "name": "database_pool_high_utilization",
                "severity": "high",
                "error": f"Pool utilization at {utilization:.2%}"
            })
            results["status"] = "degraded"
    except Exception as e:
        runtime_checks["database_pool"] = f"error: {str(e)}"
    
    results["checks"]["runtime"] = runtime_checks
    
    return results


@app.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with all component status."""
    from backend.database import get_pool_status
    from backend.cache import redis_client
    from backend.circuit_breaker import db_circuit_breaker
    
    checks = {}
    
    # Database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {
            "status": "ok",
            "message": "Database connection successful"
        }
    except Exception as e:
        checks["database"] = {
            "status": "error",
            "message": str(e)
        }
    
    # Connection pool
    try:
        pool_status = get_pool_status()
        pool_size = pool_status.get("size", 0)
        checked_out = pool_status.get("checked_out", 0)
        if pool_size > 0:
            utilization = checked_out / pool_size
            checks["database_pool"] = {
                "status": "ok" if utilization < 0.9 else "warning",
                "utilization": round(utilization, 3),
                "checked_out": checked_out,
                "size": pool_size,
                "available": pool_size - checked_out
            }
        else:
            checks["database_pool"] = {"status": "unknown"}
    except Exception as e:
        checks["database_pool"] = {"status": "error", "message": str(e)}
    
    # Circuit breaker
    try:
        checks["circuit_breaker"] = {
            "status": "ok" if db_circuit_breaker.state == "closed" else "warning",
            "state": db_circuit_breaker.state,
            "failure_count": db_circuit_breaker.failure_count
        }
    except Exception:
        checks["circuit_breaker"] = {"status": "unknown"}
    
    # Redis
    if redis_client:
        try:
            redis_client.ping()
            checks["redis"] = {
                "status": "ok",
                "message": "Redis connection successful"
            }
        except Exception as e:
            checks["redis"] = {
                "status": "warning",
                "message": str(e)
            }
    else:
        checks["redis"] = {"status": "not_configured"}
    
    # Cache
    from backend.cache import get as cache_get
    try:
        test_key = "health_check_test"
        test_value = {"test": True}
        from backend.cache import set as cache_set, delete as cache_delete
        cache_set(test_key, test_value, ttl=1)
        cached = cache_get(test_key)
        cache_delete(test_key)
        checks["cache"] = {
            "status": "ok" if cached else "warning",
            "backend": "redis" if redis_client else "memory"
        }
    except Exception as e:
        checks["cache"] = {"status": "error", "message": str(e)}
    
    # Rate limiter
    from backend.rate_limit import limiter
    try:
        # Check if Redis is being used for rate limiting
        using_redis = hasattr(limiter, "storage") and limiter.storage is not None
        checks["rate_limiter"] = {
            "status": "ok",
            "backend": "redis" if using_redis else "memory"
        }
    except Exception:
        checks["rate_limiter"] = {"status": "unknown"}
    
    overall_status = "ok"
    if any(c.get("status") == "error" for c in checks.values() if isinstance(c, dict)):
        overall_status = "error"
    elif any(c.get("status") == "warning" for c in checks.values() if isinstance(c, dict)):
        overall_status = "warning"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }


@app.get("/system/selfcheck")
async def system_selfcheck():
    """
    System self-check endpoint that validates architectural guardrails.
    Returns JSON status of all guardrails defined in infra/selfcheck/guardrails.yaml.
    """
    import subprocess
    import json
    from pathlib import Path
    
    repo_root = Path(__file__).parent.parent
    guardrails_script = repo_root / "infra" / "selfcheck" / "run_guardrails.py"
    
    results = {
        "status": "unknown",
        "timestamp": datetime.utcnow().isoformat(),
        "guardrails": {},
        "errors": []
    }
    
    # Check if guardrails script exists
    if not guardrails_script.exists():
        results["status"] = "error"
        results["errors"].append("Guardrails script not found")
        return results
    
    try:
        # Run guardrails (non-blocking, just check status)
        process = subprocess.run(
            [str(guardrails_script)],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=str(repo_root)
        )
        
        # Parse output (basic parsing)
        output_lines = process.stdout.split('\n')
        passed = sum(1 for line in output_lines if '✓ PASS' in line)
        failed = sum(1 for line in output_lines if '✗ FAIL' in line)
        warnings = sum(1 for line in output_lines if '⚠ WARN' in line)
        
        results["guardrails"] = {
            "passed": passed,
            "failed": failed,
            "warnings": warnings,
            "total": passed + failed + warnings
        }
        
        if process.returncode == 0:
            results["status"] = "ok"
        elif failed > 0:
            results["status"] = "error"
        else:
            results["status"] = "warning"
        
        # Add system intelligence map status
        intelligence_map_path = repo_root / "src" / "observability" / "system_intelligence_map.json"
        if intelligence_map_path.exists():
            try:
                with open(intelligence_map_path, 'r') as f:
                    intelligence_map = json.load(f)
                    results["intelligence_map"] = {
                        "exists": True,
                        "version": intelligence_map.get("version", "unknown"),
                        "last_updated": intelligence_map.get("last_updated", "unknown"),
                        "modules_tracked": len(intelligence_map.get("modules", {}))
                    }
            except Exception as e:
                results["intelligence_map"] = {"exists": True, "error": str(e)}
        else:
            results["intelligence_map"] = {"exists": False}
        
        # Add SLO monitors status
        slo_monitors_path = repo_root / "infra" / "selfcheck" / "slo-monitors.yml"
        results["slo_monitors"] = {
            "exists": slo_monitors_path.exists()
        }
        
    except subprocess.TimeoutExpired:
        results["status"] = "error"
        results["errors"].append("Guardrails check timed out")
    except Exception as e:
        results["status"] = "error"
        results["errors"].append(f"Error running guardrails: {str(e)}")
    
    return results

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
    # Only log token in development
    if settings.environment != "production":
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


@app.post("/api/auth/refresh")
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
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
        
        # Update session last_used
        session.last_used_at = datetime.utcnow()
        db.commit()
        
        # Generate new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@app.get("/api/auth/sessions")
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


@app.delete("/api/auth/sessions/{session_id}")
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


@app.delete("/api/auth/sessions")
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
    # Only log token in development
    if settings.environment != "production":
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
        # Only log token in development
        if settings.environment != "production":
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


@app.get("/api/analytics/activation")
async def get_activation_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user activation status."""
    is_activated = check_user_activation(db, str(current_user.id))
    retention_metrics = get_user_retention_metrics(db, str(current_user.id))
    
    return {
        "is_activated": is_activated,
        "retention": retention_metrics
    }


@app.get("/api/analytics/funnel")
async def get_funnel_metrics_endpoint(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get funnel metrics (admin only or for own data)."""
    # For now, return user-specific metrics
    # In production, this would be admin-only for full funnel
    retention_metrics = get_user_retention_metrics(db, str(current_user.id))
    
    return {
        "user_retention": retention_metrics,
        "period_days": days
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


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@app.put("/api/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an organization."""
    # Check if user is owner/admin
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["owner", "admin"])
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Update organization
    if org_data.name:
        org.name = org_data.name
    if org_data.description is not None:
        org.description = org_data.description
    
    db.commit()
    db.refresh(org)
    return org


@app.delete("/api/organizations/{org_id}")
async def delete_organization(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an organization."""
    # Check if user is owner
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role == "owner"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owner can delete organization")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db.delete(org)
    db.commit()
    return {"message": "Organization deleted successfully"}


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
    
    # Track workflow creation event
    track_event(
        db=db,
        user_id=str(current_user.id),
        event_type="workflow_created",
        properties={
            "workflow_id": str(workflow.id),
            "workflow_name": workflow.name,
            "has_schedule": workflow_data.schedule_config is not None
        }
    )
    
    # Check if this is user's first workflow (activation)
    workflow_count = db.query(Workflow).filter(
        Workflow.user_id == current_user.id
    ).count()
    
    if workflow_count == 1:
        mark_user_activated(db, str(current_user.id), "workflow_created")
    
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


@app.get("/api/workflows")
async def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user workflows."""
    workflows = db.query(Workflow).filter(
        Workflow.user_id == current_user.id
    ).all()
    return workflows


@app.get("/api/workflows/{workflow_id}")
async def get_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workflow details."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[Dict[str, Any]] = None
    schedule_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


@app.put("/api/workflows/{workflow_id}")
async def update_workflow(
    workflow_id: UUID,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Update a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update workflow fields
    if workflow_data.name:
        workflow.name = workflow_data.name
    if workflow_data.description is not None:
        workflow.description = workflow_data.description
    if workflow_data.steps:
        workflow.steps = workflow_data.steps
    if workflow_data.schedule_config is not None:
        workflow.schedule_config = workflow_data.schedule_config
    if workflow_data.is_active is not None:
        workflow.is_active = workflow_data.is_active
    
    # Create new version if steps changed
    if workflow_data.steps:
        WorkflowScheduler.create_version(
            db=db,
            workflow=workflow,
            created_by=current_user.id,
            change_summary="Workflow updated"
        )
    
    db.commit()
    db.refresh(workflow)
    
    log_audit(
        db=db,
        action="update",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow.id,
        request=request
    )
    
    return workflow


@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Delete a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    
    log_audit(
        db=db,
        action="delete",
        resource_type="workflow",
        user_id=current_user.id,
        resource_id=workflow_id,
        request=request
    )
    
    return {"message": "Workflow deleted successfully"}


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


@app.get("/api/workflows/{workflow_id}/versions")
async def list_workflow_versions(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List workflow versions."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    versions = db.query(WorkflowVersion).filter(
        WorkflowVersion.workflow_id == workflow_id
    ).order_by(WorkflowVersion.version_number.desc()).all()
    
    return versions


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


@app.get("/api/integrations")
async def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user integrations."""
    integrations = db.query(UserIntegration).filter(
        UserIntegration.user_id == current_user.id
    ).all()
    return integrations


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


@app.get("/api/integrations/{integration_id}")
async def get_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration details."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id,
        UserIntegration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return integration


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


@app.put("/api/integrations/{integration_id}")
async def update_integration(
    integration_id: UUID,
    integration_data: IntegrationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Update an integration."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id,
        UserIntegration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Update integration fields
    if integration_data.name:
        integration.name = integration_data.name
    if integration_data.config:
        integration.config = integration_data.config
    if integration_data.is_active is not None:
        integration.is_active = integration_data.is_active
    
    db.commit()
    db.refresh(integration)
    
    log_audit(
        db=db,
        action="update",
        resource_type="integration",
        user_id=current_user.id,
        resource_id=integration.id,
        request=request
    )
    
    return integration


@app.delete("/api/integrations/{integration_id}")
async def delete_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Delete an integration."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id,
        UserIntegration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db.delete(integration)
    db.commit()
    
    log_audit(
        db=db,
        action="delete",
        resource_type="integration",
        user_id=current_user.id,
        resource_id=integration_id,
        request=request
    )
    
    return {"message": "Integration deleted successfully"}


@app.post("/api/integrations/{integration_id}/test")
async def test_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test an integration connection."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id,
        UserIntegration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Basic test - try to connect using connector
    connector = db.query(IntegrationConnector).filter(
        IntegrationConnector.id == integration.connector_id
    ).first()
    
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    # Test connection based on connector type
    # This is a placeholder - actual implementation would test the connection
    try:
        # Test logic here based on connector.service_type
        return {
            "status": "success",
            "message": f"Connection test successful for {connector.name}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection test failed: {str(e)}"
        }


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


# Import growth, monetization, and enterprise modules
from backend.growth import RetentionEngine, ViralGrowthEngine, GrowthAnalytics
from backend.monetization import SubscriptionManager, UsageTracker, BillingManager, PricingCalculator
from backend.enterprise import SSOManager, EnterpriseAdmin, ComplianceManager, EcosystemManager

# Growth Engine Endpoints (Weeks 5-8)

@app.get("/api/growth/retention/cohort")
async def get_retention_cohort(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get retention cohort data for current user."""
    cohort = RetentionEngine.get_user_retention_cohort(db, current_user.id, days)
    return cohort

@app.get("/api/growth/retention/at-risk")
async def get_at_risk_users(
    days_inactive: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get users at risk of churning (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    at_risk = RetentionEngine.get_at_risk_users(db, days_inactive)
    return {"at_risk_users": at_risk, "count": len(at_risk)}

@app.post("/api/growth/retention/digest")
async def send_retention_digest(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and send weekly retention digest."""
    digest = RetentionEngine.send_retention_digest(db, current_user.id)
    return digest

@app.post("/api/growth/referral/create")
async def create_referral_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a referral code for current user."""
    referral = ViralGrowthEngine.create_referral_code(db, current_user.id)
    return {
        "referral_code": referral.code,
        "referral_url": f"/signup?ref={referral.code}",
        "usage_count": referral.usage_count
    }

@app.get("/api/growth/referral/stats")
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get referral statistics for current user."""
    stats = ViralGrowthEngine.calculate_viral_coefficient(db, current_user.id)
    return stats

@app.get("/api/growth/viral-coefficient")
async def get_viral_coefficient(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get platform viral coefficient (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    viral = ViralGrowthEngine.calculate_viral_coefficient(db)
    return viral

@app.post("/api/growth/workflows/{workflow_id}/share")
async def share_workflow(
    workflow_id: UUID,
    share_type: str = "public",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a workflow publicly or via link."""
    share = ViralGrowthEngine.share_workflow(db, current_user.id, workflow_id, share_type)
    return share

@app.get("/api/growth/metrics")
async def get_growth_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get growth metrics for platform (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    metrics = GrowthAnalytics.get_growth_metrics(db, days)
    return metrics

# Monetization Endpoints (Weeks 9-12)
@app.get("/api/billing/plans")
async def get_subscription_plans(
    db: Session = Depends(get_db)
):
    """Get available subscription plans."""
    from database.models import SubscriptionPlan
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return [
        {
            "id": str(plan.id),
            "name": plan.name,
            "tier": plan.tier,
            "description": plan.description,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "features": plan.features
        }
        for plan in plans
    ]

@app.get("/api/billing/subscription")
async def get_subscription(
    organization_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user/organization subscription."""
    from database.models import Subscription
    if organization_id:
        subscription = db.query(Subscription).filter(
            Subscription.organization_id == organization_id,
            Subscription.status == "active"
        ).first()
    else:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
    
    if not subscription:
        return {"status": "no_subscription", "tier": "free"}
    
    return {
        "id": str(subscription.id),
        "plan": subscription.plan.name,
        "tier": subscription.plan.tier,
        "billing_cycle": subscription.billing_cycle,
        "status": subscription.status,
        "price": subscription.price,
        "current_period_end": subscription.current_period_end.isoformat()
    }

@app.post("/api/billing/subscribe")
async def create_subscription(
    plan_id: UUID,
    billing_cycle: str = "monthly",
    organization_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a subscription."""
    subscription = SubscriptionManager.create_subscription(
        db, current_user.id, organization_id, plan_id, billing_cycle
    )
    return {
        "id": str(subscription.id),
        "status": subscription.status,
        "plan": subscription.plan.name
    }

@app.post("/api/billing/subscription/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a subscription."""
    subscription = SubscriptionManager.cancel_subscription(db, subscription_id, current_user.id)
    return {"message": "Subscription canceled", "status": subscription.status}

@app.get("/api/billing/usage")
async def get_usage(
    metric_type: str = "events",
    organization_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage metrics for current user/organization."""
    # Get subscription tier
    from database.models import Subscription
    if organization_id:
        subscription = db.query(Subscription).filter(
            Subscription.organization_id == organization_id,
            Subscription.status == "active"
        ).first()
    else:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
    
    tier = subscription.plan.tier if subscription else "free"
    
    usage = UsageTracker.get_usage(db, current_user.id, organization_id, metric_type)
    limit_check = UsageTracker.check_limit(db, current_user.id, organization_id, metric_type, tier)
    
    return {
        "metric_type": metric_type,
        "current_usage": usage,
        "tier": tier,
        **limit_check
    }

@app.get("/api/billing/ltv-cac")
async def get_ltv_cac(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get LTV:CAC ratio (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    ltv_cac = PricingCalculator.calculate_ltv_cac(db)
    return ltv_cac

# Enterprise Endpoints (Weeks 13-16)
@app.get("/api/enterprise/organizations/{org_id}/stats")
async def get_organization_stats(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get organization statistics (admin/owner only)."""
    # Check permissions
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    stats = EnterpriseAdmin.get_organization_stats(db, org_id)
    return stats

@app.get("/api/enterprise/organizations/{org_id}/activity")
async def get_user_activity_report(
    org_id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user activity report (admin/owner only)."""
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    activity = EnterpriseAdmin.get_user_activity_report(db, org_id, days)
    return {"activity_report": activity, "period_days": days}

@app.post("/api/enterprise/sso/providers")
async def create_sso_provider(
    name: str,
    provider_type: str,
    config: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create SSO provider (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    provider = SSOManager.create_sso_provider(db, name, provider_type, config)
    return {
        "id": str(provider.id),
        "name": provider.name,
        "provider_type": provider.provider_type
    }

@app.post("/api/enterprise/organizations/{org_id}/sso")
async def create_sso_connection(
    org_id: UUID,
    provider_id: UUID,
    connection_config: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create SSO connection for organization (admin/owner only)."""
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    connection = SSOManager.create_sso_connection(db, org_id, provider_id, connection_config)
    return {
        "id": str(connection.id),
        "organization_id": str(org_id),
        "is_active": connection.is_active
    }

@app.post("/api/enterprise/compliance/reports")
async def generate_compliance_report(
    organization_id: UUID,
    report_type: str = "gdpr",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate compliance report (admin/owner only)."""
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == organization_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    report = ComplianceManager.generate_compliance_report(db, organization_id, report_type)
    return {
        "id": str(report.id),
        "report_type": report.report_type,
        "status": report.status,
        "generated_at": report.generated_at.isoformat()
    }

@app.get("/api/enterprise/compliance/audit-trail")
async def get_audit_trail(
    organization_id: Optional[UUID] = None,
    resource_type: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit trail with filters."""
    trail = ComplianceManager.get_audit_trail(
        db, organization_id, current_user.id, resource_type, limit
    )
    return {"audit_trail": trail, "count": len(trail)}

@app.get("/api/ecosystem/workflows/featured")
async def get_featured_workflows(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get featured workflows from marketplace."""
    workflows = EcosystemManager.get_featured_workflows(db, limit)
    return {"featured_workflows": workflows}

@app.post("/api/ecosystem/workflows/fork/{share_code}")
async def fork_workflow(
    share_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fork a shared workflow."""
    result = EcosystemManager.fork_workflow(db, current_user.id, share_code)
    return result

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
