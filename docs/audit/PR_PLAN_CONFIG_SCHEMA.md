# PR Plan — Config Schema & Validation

## Overview
This PR creates a centralized configuration module with validation, eliminating config sprawl and ensuring environment-specific settings are correctly applied.

## Proposed Branch Name
`feature/centralized-config-with-validation`

## Files to Touch

### New Files
- `backend/config.py` - Centralized configuration module
- `tests/test_config.py` - Configuration tests
- `docs/CONFIGURATION.md` - Configuration documentation

### Modified Files
1. `backend/main.py`
   - Replace hardcoded values with `settings` object
   - Use `settings.secret_key`, `settings.cors_origins`, etc.

2. `backend/database.py`
   - Use `settings.database_url`, `settings.database_pool_size`, etc.

3. `backend/rate_limit.py`
   - Use `settings.rate_limit_per_minute`, etc.

4. `backend/cache.py`
   - Use `settings.redis_url`

5. `backend/sentry_config.py`
   - Use `settings.sentry_dsn`

6. `.env.example`
   - Add all configuration options with descriptions

## Implementation Details

### 1. Central Config Module

**File:** `backend/config.py` (new)
```python
"""Centralized configuration management."""
from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import Field, validator
import os

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Environment
    environment: str = Field(default="development", description="Environment: development, staging, production")
    
    # Database
    database_url: str = Field(..., description="PostgreSQL database URL")
    database_pool_size: int = Field(default=10, description="Database connection pool size")
    database_max_overflow: int = Field(default=20, description="Database connection pool max overflow")
    database_pool_recycle: int = Field(default=3600, description="Database connection pool recycle time (seconds)")
    
    # Security
    secret_key: str = Field(..., description="JWT secret key (must be strong in production)")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiration (minutes)")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token expiration (days)")
    
    # API
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")
    
    # CORS
    cors_origins: str = Field(default="http://localhost:3000", description="Comma-separated list of allowed CORS origins")
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")
    rate_limit_per_hour: int = Field(default=1000, description="Rate limit per hour")
    
    # Cache
    redis_url: Optional[str] = Field(default=None, description="Redis URL (optional, falls back to in-memory)")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, description="Sentry DSN for error tracking")
    
    # Frontend
    next_public_api_url: str = Field(default="http://localhost:8000", description="Frontend API URL")
    
    # Supabase (optional)
    supabase_url: Optional[str] = Field(default=None, description="Supabase URL")
    supabase_anon_key: Optional[str] = Field(default=None, description="Supabase anonymous key")
    supabase_service_role_key: Optional[str] = Field(default=None, description="Supabase service role key")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @validator("cors_origins")
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in v.split(",")]
    
    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment value."""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v
    
    def validate_production(self):
        """Validate production-specific settings."""
        if self.environment != "production":
            return
        
        # SECRET_KEY validation
        if self.secret_key == "your-secret-key-change-in-production":
            raise ValueError(
                "SECRET_KEY must be set in production. "
                "Set the SECRET_KEY environment variable to a strong, random value."
            )
        
        # CORS validation
        if "*" in self.cors_origins:
            raise ValueError(
                "CORS origins cannot be '*' in production. "
                "Set CORS_ORIGINS environment variable to a comma-separated list of allowed origins."
            )
        
        # Redis validation (optional but recommended)
        if not self.redis_url:
            import warnings
            warnings.warn(
                "REDIS_URL is not set in production. "
                "Cache and rate limiting will use in-memory storage (not recommended for production)."
            )

# Create global settings instance
settings = Settings()

# Validate production settings
try:
    settings.validate_production()
except ValueError as e:
    if settings.environment == "production":
        raise
    # In non-production, just log warning
    import logging
    logging.warning(f"Configuration validation warning: {e}")
```

### 2. Update main.py

**File:** `backend/main.py`
**Changes:**
```python
# Replace imports
from backend.config import settings

# Replace SECRET_KEY
# OLD: SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
# NEW:
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days

# Replace CORS
# OLD: allow_origins=["*"]
# NEW:
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace API_HOST/PORT (if used in uvicorn.run)
# OLD: uvicorn.run(app, host="0.0.0.0", port=8000)
# NEW: uvicorn.run(app, host=settings.api_host, port=settings.api_port)
```

### 3. Update database.py

**File:** `backend/database.py`
**Changes:**
```python
from backend.config import settings

# Replace DATABASE_URL
# OLD: DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://...")
# NEW:
DATABASE_URL = settings.database_url

# Update engine creation
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_recycle=settings.database_pool_recycle,
    echo=False,
)
```

### 4. Update rate_limit.py

**File:** `backend/rate_limit.py`
**Changes:**
```python
from backend.config import settings

# Replace RATE_LIMIT_PER_MINUTE/HOUR
# OLD: RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
# NEW:
RATE_LIMIT_PER_MINUTE = settings.rate_limit_per_minute
RATE_LIMIT_PER_HOUR = settings.rate_limit_per_hour
```

### 5. Update cache.py

**File:** `backend/cache.py`
**Changes:**
```python
from backend.config import settings

# Replace redis_url
# OLD: redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
# NEW:
redis_url = settings.redis_url or "redis://localhost:6379/0"
```

### 6. Update sentry_config.py

**File:** `backend/sentry_config.py`
**Changes:**
```python
from backend.config import settings

# Replace sentry_dsn
# OLD: sentry_dsn = os.getenv("SENTRY_DSN")
# NEW:
sentry_dsn = settings.sentry_dsn
```

### 7. Update .env.example

**File:** `.env.example`
**Add all configuration options with descriptions:**
```bash
# Environment
ENVIRONMENT=development  # Options: development, staging, production

# Database Configuration
DATABASE_URL=postgresql://floyo:floyo@localhost:5432/floyo
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_RECYCLE=3600

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Cache (Optional)
REDIS_URL=redis://localhost:6379/0

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Test Additions

**File:** `tests/test_config.py` (new)
```python
import pytest
import os
from backend.config import Settings

def test_settings_loads_from_env():
    """Test that settings load from environment variables"""
    os.environ["DATABASE_URL"] = "postgresql://test:test@localhost/test"
    os.environ["SECRET_KEY"] = "test-secret-key"
    settings = Settings()
    assert settings.database_url == "postgresql://test:test@localhost/test"
    assert settings.secret_key == "test-secret-key"

def test_settings_parses_cors_origins():
    """Test that CORS origins are parsed correctly"""
    os.environ["CORS_ORIGINS"] = "http://localhost:3000,http://localhost:3001"
    settings = Settings()
    assert "http://localhost:3000" in settings.cors_origins
    assert "http://localhost:3001" in settings.cors_origins

def test_settings_validates_environment():
    """Test that environment validation works"""
    os.environ["ENVIRONMENT"] = "invalid"
    with pytest.raises(ValueError):
        Settings()

def test_settings_validates_production():
    """Test that production validation works"""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
    settings = Settings()
    with pytest.raises(ValueError, match="SECRET_KEY must be set"):
        settings.validate_production()
```

## Migration Steps

### Step 1: Create Config Module
1. Create `backend/config.py`
2. Define `Settings` class
3. Add validation logic

### Step 2: Update Code to Use Settings
1. Update `backend/main.py`
2. Update `backend/database.py`
3. Update `backend/rate_limit.py`
4. Update `backend/cache.py`
5. Update `backend/sentry_config.py`

### Step 3: Update Environment Variables
1. Update `.env.example`
2. Document all configuration options

### Step 4: Testing
1. Add tests
2. Test in development
3. Test in staging

## Rollout Plan

### Phase 1: Development (Week 1)
1. Create branch `feature/centralized-config-with-validation`
2. Implement config module
3. Update code to use settings
4. Add tests
5. Test in development

### Phase 2: Staging (Week 1)
1. Deploy to staging
2. Verify configuration works
3. Test validation
4. Monitor for issues

### Phase 3: Production (Week 2)
1. Deploy to production
2. Verify configuration works
3. Monitor for issues

## Feature Flags

**Not needed** - Configuration is loaded at startup, not runtime.

## Rollback Plan

**If issues occur:**
1. Revert to using `os.getenv()` directly
2. Redeploy
3. Investigate root cause
4. Re-implement with fixes

## Documentation Updates

1. **`docs/CONFIGURATION.md`** (new) - Configuration guide
2. **`.env.example`** - Complete configuration reference
3. **`docs/DEPLOYMENT.md`** - Update deployment instructions

## Success Criteria

- [ ] All configuration centralized in `backend/config.py`
- [ ] All hardcoded values replaced with settings
- [ ] Production validation works
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No breaking changes

## Estimated Effort

- **Implementation:** 1-2 days
- **Testing:** 1 day
- **Documentation:** 0.5 days
- **Total:** 2.5-3.5 days (1 week)
