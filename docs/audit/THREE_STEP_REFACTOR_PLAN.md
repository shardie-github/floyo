# Three-Step Refactor Plan

## Overview

This refactor plan minimizes risk with incremental wins, focusing on low-risk improvements first, then boundary hardening, and finally system decoupling.

## Step 1: Low-Risk Wins (≤1 day)

### 1.1 SECRET_KEY Validation
**File:** `backend/main.py`
**Change:** Add startup validation
```python
if os.getenv("ENVIRONMENT") == "production":
    if SECRET_KEY == "your-secret-key-change-in-production":
        raise ValueError("SECRET_KEY must be set in production")
```
**Risk:** Low (only fails startup if misconfigured)
**Effort:** 15 minutes
**Impact:** High (prevents security issues)

### 1.2 CORS Validation
**File:** `backend/main.py:133-139`
**Change:** Use env var and validate
```python
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
if os.getenv("ENVIRONMENT") == "production" and "*" in cors_origins:
    raise ValueError("CORS origins cannot be '*' in production")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    ...
)
```
**Risk:** Low (only fails startup if misconfigured)
**Effort:** 30 minutes
**Impact:** High (prevents security issues)

### 1.3 Migration Status Check
**File:** `backend/main.py` (in `init_db()`)
**Change:** Add migration check
```python
from alembic.config import Config
from alembic import script
from alembic.runtime import migration

def check_migrations():
    alembic_cfg = Config("alembic.ini")
    script_dir = script.ScriptDirectory.from_config(alembic_cfg)
    # Check if migrations are up to date
    # Fail if pending migrations
```
**Risk:** Low (only fails startup if migrations pending)
**Effort:** 1 hour
**Impact:** Medium (prevents schema drift)

### 1.4 Redis Health Check Documentation
**File:** `backend/cache.py`, `docs/README.md`
**Change:** Document in-memory cache as dev-only
**Risk:** Low (documentation only)
**Effort:** 15 minutes
**Impact:** Low (improves clarity)

### 1.5 Add Missing Environment Variables
**File:** `.env.example`
**Change:** Add `REDIS_URL`, `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_HOUR`, `SENTRY_DSN`, `ENVIRONMENT`
**Risk:** Low (documentation only)
**Effort:** 15 minutes
**Impact:** Low (improves discoverability)

**Total Effort:** ~2.5 hours
**Total Risk:** Low
**Total Impact:** High (security + reliability)

## Step 2: Boundary Hardening (≤1 week)

### 2.1 Centralized Configuration
**File:** `backend/config.py` (new)
**Change:** Create centralized config module
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    cors_origins: str
    # ... other settings
    
    class Config:
        env_file = ".env"
    
    def validate_production(self):
        # Production validation logic
        pass

settings = Settings()
settings.validate_production()
```
**Risk:** Low (new module, existing code unchanged initially)
**Effort:** 4 hours
**Impact:** High (single source of truth)

### 2.2 Connection Pool Monitoring
**File:** `backend/database.py`
**Change:** Add pool metrics
```python
def get_pool_status():
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalid()
    }

# Add endpoint or log pool status
```
**Risk:** Low (read-only monitoring)
**Effort:** 2 hours
**Impact:** Medium (visibility into pool health)

### 2.3 Circuit Breaker Stub
**File:** `backend/database.py` (new function)
**Change:** Add circuit breaker for DB operations
```python
circuit_breaker_state = {"open": False, "failures": 0}

def circuit_breaker(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if circuit_breaker_state["open"]:
            raise Exception("Circuit breaker open - DB unavailable")
        try:
            result = func(*args, **kwargs)
            circuit_breaker_state["failures"] = 0
            return result
        except Exception as e:
            circuit_breaker_state["failures"] += 1
            if circuit_breaker_state["failures"] >= 5:
                circuit_breaker_state["open"] = True
            raise
    return wrapper
```
**Risk:** Medium (affects DB operations, but graceful)
**Effort:** 3 hours
**Impact:** High (prevents cascade failures)

### 2.4 Redis-Backed Rate Limiting
**File:** `backend/rate_limit.py`
**Change:** Use Redis for rate limiting
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
import redis

redis_client = redis.from_url(os.getenv("REDIS_URL"))

def get_redis_key(request):
    return f"rate_limit:{get_remote_address(request)}"

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL")
)
```
**Risk:** Medium (requires Redis, but fallback possible)
**Effort:** 4 hours
**Impact:** High (global rate limiting)

### 2.5 File Upload Volume Persistence
**File:** `docker-compose.yml`
**Change:** Add volume for uploads
```yaml
backend:
  volumes:
    - ./uploads:/app/uploads
    - ...
```
**Risk:** Low (adds volume, doesn't change code)
**Effort:** 30 minutes
**Impact:** Medium (persistent file storage)

### 2.6 Enhanced Health Checks
**File:** `backend/main.py` (health endpoints)
**Change:** Add Redis, pool status to readiness check
```python
@app.get("/health/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    checks = {"database": "ok"}
    
    # Check Redis
    if redis_client:
        try:
            redis_client.ping()
            checks["redis"] = "ok"
        except:
            checks["redis"] = "error"
    
    # Check pool status
    pool_status = get_pool_status()
    if pool_status["checked_out"] >= pool_status["size"] * 0.9:
        checks["database_pool"] = "warning"
    
    return {"status": "ready", "checks": checks}
```
**Risk:** Low (read-only checks)
**Effort:** 2 hours
**Impact:** Medium (better observability)

### 2.7 Migration Status Endpoint
**File:** `backend/main.py` (new endpoint)
**Change:** Add migration status endpoint
```python
@app.get("/health/migrations")
async def migration_status():
    # Check Alembic migration status
    # Return pending migrations if any
    return {"status": "up_to_date", "pending": []}
```
**Risk:** Low (read-only endpoint)
**Effort:** 1 hour
**Impact:** Low (visibility into migration status)

**Total Effort:** ~17 hours (2-3 days)
**Total Risk:** Low-Medium
**Total Impact:** High (resilience + observability)

## Step 3: System Decoupling (≤3 weeks)

### 3.1 Split main.py into Route Modules
**File:** `backend/main.py` → `backend/routes/` (new)
**Change:** Extract routes into modules
```
backend/routes/
  __init__.py
  auth.py      # Authentication routes
  events.py    # Event routes
  patterns.py  # Pattern routes
  suggestions.py # Suggestion routes
  workflows.py # Workflow routes
  organizations.py # Organization routes
  integrations.py # Integration routes
```

**Implementation:**
```python
# backend/routes/auth.py
from fastapi import APIRouter
router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(...):
    ...

# backend/main.py
from backend.routes import auth, events, patterns, ...
app.include_router(auth.router)
app.include_router(events.router)
...
```

**Risk:** Medium (large refactor, but testable)
**Effort:** 2-3 days
**Impact:** High (maintainability, testability)

### 3.2 Redis Pub/Sub for WebSockets
**File:** `backend/main.py` (WebSocket manager)
**Change:** Use Redis pub/sub for message distribution
```python
import redis
import json

redis_pubsub = redis_client.pubsub()

class ConnectionManager:
    async def broadcast(self, message: str):
        # Publish to Redis channel
        redis_client.publish("websocket:messages", json.dumps({"message": message}))
        # Subscribers will receive and forward to clients

# Subscribe to Redis channel
async def redis_subscriber():
    for message in redis_pubsub.listen():
        if message["type"] == "message":
            # Forward to all WebSocket connections
            await manager.broadcast_to_all(message["data"])
```
**Risk:** Medium (requires Redis, changes WebSocket behavior)
**Effort:** 1-2 days
**Impact:** High (multi-instance WebSocket support)

### 3.3 Celery Worker for Scheduled Workflows
**File:** `backend/workflow_scheduler.py`, `backend/celery_app.py` (new)
**Change:** Add Celery worker for workflow execution
```python
# backend/celery_app.py
from celery import Celery

celery_app = Celery(
    "floyo",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

@celery_app.task
def execute_workflow_task(workflow_id: str):
    # Execute workflow
    ...

# Periodic task for cron workflows
@celery_app.task
def check_scheduled_workflows():
    # Check for workflows that should run
    # Execute them
    ...
```

**Docker Compose:**
```yaml
celery-worker:
  build:
    context: .
    dockerfile: Dockerfile.backend
  command: celery -A backend.celery_app worker --loglevel=info
  depends_on:
    - redis
    - postgres
```

**Risk:** Medium (new service, requires Redis)
**Effort:** 2-3 days
**Impact:** High (automated workflow execution)

### 3.4 S3/Cloud Storage for File Uploads
**File:** `backend/main.py` (upload endpoint)
**Change:** Use S3 instead of local storage
```python
import boto3

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

@app.post("/api/events/upload")
async def upload_event_file(...):
    # Upload to S3
    s3_key = f"uploads/{current_user.id}/{file.filename}"
    s3_client.upload_fileobj(file.file, os.getenv("S3_BUCKET"), s3_key)
    # Store S3 URL in database
    ...
```
**Risk:** Medium (requires AWS/S3 setup)
**Effort:** 1-2 days
**Impact:** High (persistent, scalable storage)

### 3.5 Database Query Optimization
**File:** `backend/main.py`, `backend/organizations.py`
**Change:** Add eager loading for relations
```python
from sqlalchemy.orm import joinedload

# Example: Load user with events
events = db.query(Event).options(
    joinedload(Event.user)
).filter(Event.user_id == current_user.id).all()
```
**Risk:** Low (optimization, doesn't change behavior)
**Effort:** 1-2 days
**Impact:** Medium (performance improvement)

### 3.6 Feature Flag Integration
**File:** `backend/feature_flags.py`, `backend/main.py`
**Change:** Integrate feature flags with routes
```python
from backend.feature_flags import get_feature_flag

@app.post("/api/auth/register")
async def register(...):
    if not get_feature_flag("enable_user_registration"):
        raise HTTPException(503, "User registration temporarily disabled")
    ...
```
**Risk:** Low (adds feature flag checks)
**Effort:** 1-2 days
**Impact:** Medium (kill switches for features)

**Total Effort:** ~10-15 days (2-3 weeks)
**Total Risk:** Medium
**Total Impact:** High (scalability + maintainability)

## Refactor Summary

| Step | Duration | Risk | Impact | Key Deliverables |
|------|----------|------|--------|-----------------|
| **Step 1** | ≤1 day | Low | High | Security fixes, validation |
| **Step 2** | ≤1 week | Low-Medium | High | Resilience, observability |
| **Step 3** | ≤3 weeks | Medium | High | Scalability, maintainability |

## Risk Mitigation

### For Each Step:
1. **Feature Flags** - Use feature flags to toggle new code
2. **Gradual Rollout** - Deploy to staging first, then production
3. **Monitoring** - Add metrics/logging for new code
4. **Rollback Plan** - Document rollback procedures
5. **Testing** - Add tests for new code

### Testing Strategy:
- **Unit Tests** - Test individual functions
- **Integration Tests** - Test component interactions
- **E2E Tests** - Test full user flows
- **Performance Tests** - Test under load

## Success Criteria

### Step 1:
- [ ] SECRET_KEY validation prevents default in production
- [ ] CORS validation prevents permissive origins in production
- [ ] Migration check prevents schema drift
- [ ] All environment variables documented

### Step 2:
- [ ] Centralized configuration module created
- [ ] Connection pool monitoring implemented
- [ ] Circuit breaker prevents cascade failures
- [ ] Redis-backed rate limiting works
- [ ] Health checks show all components

### Step 3:
- [ ] main.py split into route modules
- [ ] WebSocket messages work across instances
- [ ] Scheduled workflows execute automatically
- [ ] File uploads use cloud storage
- [ ] Database queries optimized

## Dependencies

### Step 1 → Step 2:
- Step 1 provides validation foundation
- Step 2 builds on validation

### Step 2 → Step 3:
- Step 2 provides monitoring/observability
- Step 3 uses monitoring for new components

## Timeline

**Week 1:** Step 1 (low-risk wins)
**Week 2-3:** Step 2 (boundary hardening)
**Week 4-6:** Step 3 (system decoupling)

**Total:** 6 weeks for full refactor (can be done incrementally)
