# PR Plan — Config Schema & Validation

**Generated:** 2024-12-19  
**Scope:** Centralized configuration module, validation, and normalization

## Branch Strategy

**Branch Name:** `feat/config-schema-validation`  
**Base Branch:** `main`  
**Target:** Merge after review and testing

## File Touch List

### Modified Files
1. `backend/config.py` - Enhanced validation
2. `alembic.ini` - Use env var for database URL
3. `docker-compose.yml` - Standardize SECRET_KEY default
4. `tests/test_config.py` - New test file

### New Files
1. `tests/test_config.py` - Configuration tests
2. `docs/CONFIGURATION.md` - Configuration documentation

## Implementation Details

### 1. Enhanced Config Validation

**File:** `backend/config.py`

**Changes:**
- SECRET_KEY validation (fail in production)
- CORS validation (fail in production)
- Database URL format validation
- Port range validation

### 2. Alembic Config Fix

**File:** `alembic.ini`

**Change:**
```ini
# Use env var instead of hardcoded URL
sqlalchemy.url = ${DATABASE_URL}
```

**Alternative:** Generate from settings programmatically

### 3. Standardize SECRET_KEY Defaults

**File:** `docker-compose.yml`

**Change:**
```yaml
SECRET_KEY: ${SECRET_KEY:-your-secret-key-change-in-production}
```

**Match:** `.env.example` default

## Test Additions

### New Test File: `tests/test_config.py`

```python
import pytest
import os
from backend.config import Settings

def test_config_requires_secret_key():
    """Test that SECRET_KEY is required"""
    # Test implementation
    pass

def test_config_validates_cors_origins():
    """Test CORS origins validation"""
    # Test implementation
    pass

def test_config_validates_production_settings():
    """Test production-specific validation"""
    # Test implementation
    pass
```

## Documentation

### New File: `docs/CONFIGURATION.md`

**Content:**
- Configuration schema
- Environment variables
- Validation rules
- Environment-specific configuration
- Secret rotation process

## Rollout Plan

1. **Development** - Implement changes, add tests
2. **Testing** - Verify validation works
3. **Staging** - Deploy and test
4. **Production** - Deploy with monitoring
