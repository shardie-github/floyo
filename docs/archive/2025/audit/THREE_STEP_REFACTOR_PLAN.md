> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Three-Step Refactor Plan

**Generated:** 2024-12-19  
**Scope:** Incremental refactoring roadmap with risk minimization

## Strategy

**Approach:** Incremental, low-risk wins first, then boundary hardening, finally system decoupling  
**Principle:** Each step delivers value independently, reversible changes, feature flags where relevant

## Step 1: Low-Risk Wins (≤1 Day)

### 1.1 SECRET_KEY Validation
**File:** `backend/config.py:71-81`  
**Change:** Raise ValueError instead of warning in production  
**Risk:** Low (fails fast, prevents security issue)  
**Effort:** 15 minutes

```python
# backend/config.py
def validate_production(self):
    if self.environment != "production":
        return
    
    # SECRET_KEY validation - FAIL if default
    if self.secret_key == "your-secret-key-change-in-production":
        raise ValueError(
            "SECRET_KEY must be set in production. "
            "Set the SECRET_KEY environment variable to a strong, random value."
        )
```

### 1.2 CORS Validation
**File:** `backend/config.py:83-88`  
**Change:** Raise ValueError instead of warning in production  
**Risk:** Low (fails fast, prevents security issue)  
**Effort:** 30 minutes

```python
# backend/config.py
# CORS validation - FAIL if permissive
if "*" in self.cors_origins:
    raise ValueError(
        "CORS origins cannot be '*' in production. "
        "Set CORS_ORIGINS environment variable to a comma-separated list of allowed origins."
    )
```

### 1.3 Remove Token Logging in Production
**File:** `backend/main.py:546, 826, 861`  
**Change:** Ensure logging only in dev (already conditional, verify)  
**Risk:** Low (privacy improvement)  
**Effort:** 15 minutes

**Status:** Already conditional ✅

### 1.4 Fix Schema.sql
**File:** `database/schema.sql`  
**Change:** Generate from models or archive  
**Risk:** Low (documentation only)  
**Effort:** 1 hour

**Options:**
- Generate from models: `alembic revision --autogenerate`
- Archive and document migration-only approach

### Step 1 Summary
**Total Effort:** ~2 hours  
**Risk:** Low  
**Value:** 2 critical security fixes, documentation improvement

## Step 2: Boundary Hardening (≤1 Week)

### 2.1 Connection Pool Monitoring
**File:** `backend/database.py:31-40`, `backend/main.py:431-439`  
**Change:** Add pool status to readiness check  
**Risk:** Low (additive only)  
**Effort:** 1 hour

```python
# backend/main.py
@app.get("/health/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    checks = {}
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
        
        # Add pool status
        from backend.database import get_pool_status
        pool_status = get_pool_status()
        checks["database_pool"] = {
            "status": "ok",
            "utilization": pool_status["checked_out"] / pool_status["size"]
        }
    except Exception as e:
        checks["database"] = "error"
        raise HTTPException(status_code=503, detail="Service not ready")
```

### 2.2 Circuit Breaker Integration
**File:** `backend/database.py`, `backend/circuit_breaker.py`  
**Change:** Wire circuit breaker into critical DB operations  
**Risk:** Medium (requires testing)  
**Effort:** 3 hours

```python
# backend/database.py
from backend.circuit_breaker import db_circuit_breaker

@db_circuit_breaker
def get_db() -> Session:
    """Get database session with circuit breaker protection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Testing:**
- Test circuit breaker opens on DB failures
- Test circuit breaker closes after timeout
- Test graceful degradation

### 2.3 Redis-Backed Rate Limiting
**File:** `backend/rate_limit.py`  
**Change:** Use Redis for rate limit storage if available  
**Risk:** Medium (requires Redis availability)  
**Effort:** 4 hours

```python
# backend/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
import redis

# Use Redis if available, fallback to memory
if redis_client:
    limiter = Limiter(key_func=get_remote_address, storage_uri=redis_url)
else:
    limiter = Limiter(key_func=get_remote_address)
```

**Testing:**
- Test rate limiting with Redis
- Test fallback to memory if Redis unavailable
- Test global rate limiting across instances

### 2.4 Enhanced Health Checks
**File:** `backend/main.py`  
**Change:** Add detailed health check endpoint  
**Risk:** Low (additive only)  
**Effort:** 2 hours

```python
@app.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with all component status."""
    checks = {
        "database": "ok",
        "redis": "ok",
        "cache": "ok",
        "rate_limiter": "ok",
        "database_pool": "ok"
    }
    # ... check all components
    return checks
```

### Step 2 Summary
**Total Effort:** ~1-2 days  
**Risk:** Medium  
**Value:** Resilience improvements, better observability

## Step 3: System Decoupling (≤3 Weeks)

### 3.1 Split main.py into Route Modules
**File:** `backend/main.py` → `backend/routes/` (new)  
**Change:** Extract routes into modules (auth, events, workflows, etc.)  
**Risk:** Medium (requires careful refactoring)  
**Effort:** 2-3 days

**Structure:**
```
backend/
├── main.py (app initialization, middleware)
├── routes/
│   ├── __init__.py
│   ├── auth.py (auth endpoints)
│   ├── events.py (event endpoints)
│   ├── patterns.py (pattern endpoints)
│   ├── suggestions.py (suggestion endpoints)
│   ├── workflows.py (workflow endpoints)
│   ├── organizations.py (organization endpoints)
│   └── integrations.py (integration endpoints)
```

**Steps:**
1. Create `backend/routes/` directory
2. Extract auth routes → `routes/auth.py`
3. Extract events routes → `routes/events.py`
4. Continue for all route groups
5. Update `main.py` to import and mount routers
6. Test all endpoints

**Testing:**
- Run all tests
- Verify OpenAPI docs still work
- Check all endpoints functional

### 3.2 Encrypt Integration Credentials
**File:** `backend/connectors.py`, `database/models.py`  
**Change:** Add encryption layer for sensitive fields  
**Risk:** Medium (requires migration)  
**Effort:** 1-2 days

```python
# backend/connectors.py
from cryptography.fernet import Fernet

def encrypt_config(config: dict, key: bytes) -> dict:
    """Encrypt sensitive fields in config."""
    f = Fernet(key)
    encrypted = {}
    for k, v in config.items():
        if k in SENSITIVE_FIELDS:
            encrypted[k] = f.encrypt(str(v).encode()).decode()
        else:
            encrypted[k] = v
    return encrypted

def decrypt_config(config: dict, key: bytes) -> dict:
    """Decrypt sensitive fields in config."""
    f = Fernet(key)
    decrypted = {}
    for k, v in config.items():
        if k in SENSITIVE_FIELDS:
            decrypted[k] = f.decrypt(v.encode()).decode()
        else:
            decrypted[k] = v
    return decrypted
```

**Migration:**
1. Add encryption key to config
2. Encrypt existing credentials
3. Update read/write paths to encrypt/decrypt

### 3.3 Celery Worker for Workflows
**File:** `backend/celery_app.py` (new), `docker-compose.yml`  
**Change:** Add Celery worker for scheduled workflows  
**Risk:** Medium (new component)  
**Effort:** 2-3 days

```python
# backend/celery_app.py
from celery import Celery
from backend.config import settings

celery_app = Celery(
    "floyo",
    broker=settings.redis_url,
    backend=settings.redis_url
)

@celery_app.task
def execute_workflow_task(workflow_id: str):
    """Execute a workflow asynchronously."""
    # ... workflow execution logic
```

**Docker Compose:**
```yaml
celery-worker:
  build:
    context: .
    dockerfile: Dockerfile.backend
  command: celery -A backend.celery_app worker --loglevel=info
  environment:
    DATABASE_URL: ${DATABASE_URL}
    REDIS_URL: ${REDIS_URL}
  depends_on:
    - postgres
    - redis
```

### 3.4 Redis Pub/Sub for WebSockets
**File:** `backend/main.py:214-233`  
**Change:** Use Redis pub/sub for WebSocket broadcasting  
**Risk:** Medium (requires Redis)  
**Effort:** 1-2 days

```python
# backend/main.py
import redis
import json

redis_pubsub = redis_client.pubsub()

async def websocket_manager():
    """Manage WebSocket connections with Redis pub/sub."""
    # Subscribe to Redis channels
    # Broadcast messages to all connected clients
```

### Step 3 Summary
**Total Effort:** ~2-3 weeks  
**Risk:** Medium  
**Value:** System decoupling, scalability improvements

## Risk Mitigation

### Feature Flags
- Use feature flags for gradual rollout
- Disable new features if issues arise
- Monitor feature flag usage

### Testing
- Unit tests for each refactored component
- Integration tests for API endpoints
- E2E tests for critical user journeys

### Rollback Plan
- Each step is reversible
- Keep old code until new code proven
- Database migrations are reversible

## Implementation Checklist

### Step 1 (Week 1)
- [ ] SECRET_KEY validation prevents default in production
- [ ] CORS validation prevents permissive origins in production
- [ ] Token logging removed in production
- [ ] Schema.sql fixed or archived

### Step 2 (Week 2-3)
- [ ] Connection pool monitoring added
- [ ] Circuit breaker integrated
- [ ] Redis-backed rate limiting implemented
- [ ] Enhanced health checks added

### Step 3 (Week 3-6)
- [ ] main.py split into route modules
- [ ] Integration credentials encrypted
- [ ] Celery worker for workflows
- [ ] Redis pub/sub for WebSockets

## Success Metrics

- **Step 1:** Zero security incidents from SECRET_KEY/CORS
- **Step 2:** Zero incidents from connection pool exhaustion
- **Step 3:** 50% reduction in main.py size, workflow execution automated
