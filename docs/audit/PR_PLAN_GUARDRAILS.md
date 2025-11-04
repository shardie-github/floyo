# PR Plan — Guardrails & Health Endpoints

**Generated:** 2024-12-19  
**Scope:** Security validation, resilience guardrails, and health check improvements

## Branch Strategy

**Branch Name:** `feat/guardrails-and-health-checks`  
**Base Branch:** `main`  
**Target:** Merge after review and testing

## File Touch List

### Modified Files
1. `backend/config.py` - SECRET_KEY and CORS validation
2. `backend/database.py` - Circuit breaker integration
3. `backend/main.py` - Enhanced health checks, pool monitoring
4. `backend/rate_limit.py` - Redis-backed rate limiting
5. `tests/test_guardrails.py` - New test file

### New Files
1. `tests/test_guardrails.py` - Guardrail tests

## Implementation Details

### 1. SECRET_KEY Validation

**File:** `backend/config.py:71-81`

**Change:**
```python
def validate_production(self):
    """Validate production-specific settings."""
    if self.environment != "production":
        return
    
    # SECRET_KEY validation - FAIL if default
    if self.secret_key == "your-secret-key-change-in-production":
        raise ValueError(
            "SECRET_KEY must be set in production. "
            "Set the SECRET_KEY environment variable to a strong, random value."
        )
```

**Test:**
```python
def test_secret_key_validation_in_production():
    """Test SECRET_KEY validation fails with default value in production"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
    with pytest.raises(ValueError, match="SECRET_KEY must be set"):
        Settings()
```

### 2. CORS Validation

**File:** `backend/config.py:83-88`

**Change:**
```python
# CORS validation - FAIL if permissive
if "*" in self.cors_origins:
    raise ValueError(
        "CORS origins cannot be '*' in production. "
        "Set CORS_ORIGINS environment variable to a comma-separated list of allowed origins."
    )
```

**Test:**
```python
def test_cors_validation_in_production():
    """Test CORS validation fails with '*' in production"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["CORS_ORIGINS"] = "*"
    with pytest.raises(ValueError, match="CORS origins cannot be"):
        Settings()
```

### 3. Connection Pool Monitoring

**File:** `backend/main.py:431-439`

**Change:**
```python
@app.get("/health/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    checks = {}
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = "error"
        raise HTTPException(status_code=503, detail="Service not ready")
    
    # Check connection pool
    try:
        from backend.database import get_pool_status
        pool_status = get_pool_status()
        pool_utilization = pool_status["checked_out"] / pool_status["size"] if pool_status["size"] > 0 else 0
        checks["database_pool"] = {
            "status": "ok" if pool_utilization < 0.9 else "warning",
            "utilization": pool_utilization,
            "checked_out": pool_status["checked_out"],
            "size": pool_status["size"]
        }
    except Exception:
        checks["database_pool"] = "unknown"
```

### 4. Circuit Breaker Integration

**File:** `backend/database.py`

**Change:**
```python
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

### 5. Redis-Backed Rate Limiting

**File:** `backend/rate_limit.py`

**Change:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from backend.config import settings

# Use Redis if available, fallback to memory
if settings.redis_url:
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=settings.redis_url
    )
else:
    limiter = Limiter(key_func=get_remote_address)
```

## Test Additions

### New Test File: `tests/test_guardrails.py`

```python
import pytest
import os
from backend.config import Settings

def test_secret_key_validation_in_production():
    """Test SECRET_KEY validation fails with default value in production"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
    with pytest.raises(ValueError, match="SECRET_KEY must be set"):
        Settings()

def test_cors_validation_in_production():
    """Test CORS validation fails with '*' in production"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["CORS_ORIGINS"] = "*"
    with pytest.raises(ValueError, match="CORS origins cannot be"):
        Settings()

def test_health_check_includes_pool_status():
    """Test health check includes connection pool status"""
    # Test implementation
    pass

def test_circuit_breaker_opens_on_db_failure():
    """Test circuit breaker opens on database failures"""
    # Test implementation
    pass
```

## Rollout Plan

### Phase 1: Development (Week 1)
1. Create branch `feat/guardrails-and-health-checks`
2. Implement changes
3. Add tests
4. Run test suite

### Phase 2: Testing (Week 1)
1. Test in development environment
2. Verify health checks work
3. Test circuit breaker behavior
4. Test rate limiting with Redis

### Phase 3: Staging (Week 2)
1. Deploy to staging
2. Monitor health checks
3. Verify guardrails work
4. Load test

### Phase 4: Production (Week 2)
1. Deploy to production
2. Monitor health checks
3. Verify guardrails work
4. Monitor for issues

## Success Criteria

- [ ] SECRET_KEY validation prevents default in production
- [ ] CORS validation prevents permissive origins in production
- [ ] Health checks include connection pool status
- [ ] Circuit breaker opens on database failures
- [ ] Redis-backed rate limiting works
- [ ] All tests pass
- [ ] No production incidents
