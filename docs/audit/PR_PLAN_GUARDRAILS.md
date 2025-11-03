# PR Plan — Guardrails & Health Endpoints

## Overview
This PR adds critical guardrails and enhances health check endpoints to improve system resilience and observability.

## Proposed Branch Name
`feature/add-guardrails-and-health-checks`

## Files to Touch

### New Files
- `backend/config.py` - Centralized configuration (Step 2, optional for this PR)
- `backend/circuit_breaker.py` - Circuit breaker implementation (Step 2, optional)
- `tests/test_guardrails.py` - Tests for guardrails

### Modified Files
1. `backend/main.py`
   - Add SECRET_KEY validation
   - Add CORS validation
   - Enhance health check endpoints
   - Add migration status check

2. `backend/database.py`
   - Add pool status monitoring (optional)
   - Add circuit breaker (optional)

3. `backend/rate_limit.py`
   - Add Redis-backed rate limiting (optional)

4. `.env.example`
   - Add missing environment variables

5. `docs/RUNBOOK.md` (new)
   - Document guardrails

## Implementation Details

### 1. SECRET_KEY Validation

**File:** `backend/main.py`
**Location:** After line 60
```python
# Validate SECRET_KEY in production
if os.getenv("ENVIRONMENT") == "production":
    if SECRET_KEY == "your-secret-key-change-in-production":
        raise ValueError(
            "SECRET_KEY must be set in production. "
            "Set the SECRET_KEY environment variable to a strong, random value."
        )
```

**Test:** `tests/test_guardrails.py`
```python
def test_secret_key_validation_in_production():
    """Test that SECRET_KEY validation fails in production with default value"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
    with pytest.raises(ValueError, match="SECRET_KEY must be set"):
        # Import main.py which will validate on startup
        import backend.main
```

### 2. CORS Validation

**File:** `backend/main.py`
**Location:** Replace lines 133-139
```python
# CORS configuration
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

# Validate CORS in production
if os.getenv("ENVIRONMENT") == "production":
    if "*" in cors_origins:
        raise ValueError(
            "CORS origins cannot be '*' in production. "
            "Set CORS_ORIGINS environment variable to a comma-separated list of allowed origins."
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Test:** `tests/test_guardrails.py`
```python
def test_cors_validation_in_production():
    """Test that CORS validation fails in production with '*' origin"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["CORS_ORIGINS"] = "*"
    with pytest.raises(ValueError, match="CORS origins cannot be"):
        import backend.main
```

### 3. Enhanced Health Checks

**File:** `backend/main.py`
**Location:** Enhance `/health/readiness` endpoint (around line 356)
```python
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
            status_code=status.HTTP_503_SERVICE_UNAILABLE,
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
    
    # Check connection pool (if database module has pool status)
    try:
        from backend.database import get_pool_status
        pool_status = get_pool_status()
        if pool_status["checked_out"] >= pool_status["size"] * 0.9:
            checks["database_pool"] = "warning"
        else:
            checks["database_pool"] = "ok"
    except (ImportError, AttributeError):
        pass  # Pool status not available
    
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }
```

### 4. Migration Status Check

**File:** `backend/main.py`
**Location:** Add to `init_db()` function or create new function
```python
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
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_rev = context.get_current_revision()
        
        # Get head revision
        head_rev = script_dir.get_current_head()
        
        if current_rev != head_rev:
            logger.warning(f"Database migrations are not up to date. Current: {current_rev}, Head: {head_rev}")
            if os.getenv("ENVIRONMENT") == "production":
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
```

**Call in `init_db()`:**
```python
def init_db():
    """Initialize database tables."""
    from database.models import Base
    Base.metadata.create_all(bind=engine)
    
    # Check migration status
    check_migration_status()
```

### 5. Pool Status Monitoring (Optional)

**File:** `backend/database.py`
**Location:** Add new function
```python
def get_pool_status():
    """Get connection pool status."""
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalid()
    }
```

### 6. Circuit Breaker (Optional)

**File:** `backend/circuit_breaker.py` (new)
```python
from functools import wraps
import time
from typing import Callable, Any

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open
    
    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if self.state == "open":
                # Check if timeout has passed
                if time.time() - self.last_failure_time > self.timeout:
                    self.state = "half_open"
                else:
                    raise Exception("Circuit breaker is open - service unavailable")
            
            try:
                result = func(*args, **kwargs)
                if self.state == "half_open":
                    self.state = "closed"
                    self.failure_count = 0
                return result
            except Exception as e:
                self.failure_count += 1
                self.last_failure_time = time.time()
                
                if self.failure_count >= self.failure_threshold:
                    self.state = "open"
                
                raise
        
        return wrapper

# Global circuit breaker for database
db_circuit_breaker = CircuitBreaker()
```

**Usage in `backend/database.py`:**
```python
@db_circuit_breaker
def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Test Additions

**File:** `tests/test_guardrails.py` (new)
```python
import pytest
import os
from unittest.mock import patch

def test_secret_key_validation_in_production():
    """Test SECRET_KEY validation fails with default value in production"""
    # Test implementation

def test_cors_validation_in_production():
    """Test CORS validation fails with '*' in production"""
    # Test implementation

def test_migration_status_check():
    """Test migration status check"""
    # Test implementation

def test_health_check_endpoints():
    """Test health check endpoints return correct status"""
    # Test implementation
```

## Rollout Plan

### Phase 1: Development (Week 1)
1. Create branch `feature/add-guardrails-and-health-checks`
2. Implement SECRET_KEY and CORS validation
3. Add tests
4. Test in development environment

### Phase 2: Staging (Week 1)
1. Deploy to staging
2. Verify validation works correctly
3. Test health check endpoints
4. Monitor for any issues

### Phase 3: Production (Week 2)
1. Deploy to production
2. Monitor startup logs for validation
3. Verify health checks work
4. Document any issues

## Feature Flags

**Not needed** - These are startup validations, not runtime features.

## Rollback Plan

**If issues occur:**
1. Remove validation checks (revert changes)
2. Redeploy
3. Investigate root cause
4. Re-implement with fixes

## Documentation Updates

1. **`.env.example`** - Add missing environment variables
2. **`docs/RUNBOOK.md`** - Document guardrails
3. **`docs/DEPLOYMENT.md`** - Document validation requirements

## Success Criteria

- [ ] SECRET_KEY validation prevents default in production
- [ ] CORS validation prevents '*' in production
- [ ] Migration status check works
- [ ] Health check endpoints return correct status
- [ ] All tests pass
- [ ] Documentation updated

## Estimated Effort

- **Implementation:** 4-6 hours
- **Testing:** 2-3 hours
- **Documentation:** 1 hour
- **Total:** 7-10 hours (1 day)
