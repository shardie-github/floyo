# Config Entropy & Environment Parity Report

## Configuration Sprawl Analysis

### Configuration Locations

1. **Environment Variables** - `.env.example`, `docker-compose.yml`
2. **Code Defaults** - `backend/main.py`, `backend/database.py`, etc.
3. **Database Config** - `user_configs` table (JSONB)
4. **Docker Compose** - `docker-compose.yml`
5. **Frontend Config** - `frontend/next.config.js`, `frontend/package.json`

### Configuration Duplication

#### Database URL

**Locations:**
- `.env.example`: `DATABASE_URL=postgresql://floyo:floyo@localhost:5432/floyo`
- `docker-compose.yml`: `DATABASE_URL: postgresql://floyo:floyo@postgres:5432/floyo`
- `backend/database.py:9-11`: Default `postgresql://floyo:floyo@localhost:5432/floyo`

**Issue:** Same default in 3 places, different values in docker-compose
**Risk:** Confusion about which value is used
**Fix:** Single source of truth (env var), remove defaults from code

#### CORS Configuration

**Locations:**
- `.env.example`: `CORS_ORIGINS=http://localhost:3000,http://localhost:3001`
- `backend/main.py:133-139`: Hardcoded `allow_origins=["*"]`

**Issue:** Env var exists but not used in code
**Risk:** CORS misconfiguration
**Fix:** Use `CORS_ORIGINS` env var in code

#### Rate Limiting

**Locations:**
- `backend/rate_limit.py:14-15`: Defaults from env vars
- `.env.example`: Missing `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_HOUR`

**Issue:** Env vars not documented
**Risk:** Configuration not discoverable
**Fix:** Add to `.env.example`

#### Secret Key

**Locations:**
- `.env.example`: `SECRET_KEY=your-secret-key-change-in-production`
- `backend/main.py:60`: Default `"your-secret-key-change-in-production"`

**Issue:** Default value in code matches example
**Risk:** Default used in production if env var not set
**Fix:** Fail startup if default in production

### Divergent Defaults

#### Database Connection Pool

**Location:** `backend/database.py:22-30`
```python
pool_size=10,
max_overflow=20,
pool_recycle=3600,
```

**Issue:** No environment variable configuration
**Risk:** Cannot tune for different environments
**Fix:** Add env vars for pool configuration

#### Token Expiration

**Location:** `backend/main.py:62-63`
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

**Issue:** Hardcoded values
**Risk:** Cannot tune for different environments
**Fix:** Add env vars (already in .env.example but not used)

### Missing Configuration

#### Redis Configuration

**Location:** `backend/cache.py:27`
```python
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
```

**Issue:** `REDIS_URL` not in `.env.example`
**Risk:** Configuration not discoverable
**Fix:** Add to `.env.example`

#### Sentry Configuration

**Location:** `backend/sentry_config.py`
```python
sentry_dsn = os.getenv("SENTRY_DSN")
```

**Issue:** `SENTRY_DSN` not in `.env.example`
**Risk:** Configuration not discoverable
**Fix:** Add to `.env.example`

#### Environment Detection

**Location:** Various files (proposed)
```python
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
```

**Issue:** No `ENVIRONMENT` variable
**Risk:** Cannot distinguish dev/stage/prod
**Fix:** Add `ENVIRONMENT` to `.env.example` and use in code

## Configuration Validation

### Current State

**No validation** - Configuration values are not validated on startup

**Issues:**
1. Invalid values cause runtime errors
2. Missing required values cause runtime errors
3. No clear error messages for configuration issues

### Proposed Validation

**File:** `backend/config.py` (new)
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_recycle: int = 3600
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # Cache
    redis_url: Optional[str] = None
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def validate_production(self):
        """Validate production-specific settings"""
        if self.environment == "production":
            if self.secret_key == "your-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be set in production")
            if "*" in self.cors_origins:
                raise ValueError("CORS origins cannot be '*' in production")
            if not self.redis_url:
                raise ValueError("REDIS_URL must be set in production")

settings = Settings()
settings.validate_production()
```

**Benefits:**
- Single source of truth for configuration
- Type validation
- Environment-specific validation
- Clear error messages

## Environment Parity Issues

### Development vs Production

**Development:**
- Uses SQLite fallback (if DATABASE_URL starts with "sqlite")
- Uses in-memory cache fallback
- Permissive CORS (`allow_origins=["*"]`)
- Default SECRET_KEY acceptable

**Production:**
- Requires PostgreSQL
- Requires Redis (proposed)
- Requires CORS validation
- Requires SECRET_KEY validation

**Issue:** No clear distinction between environments
**Risk:** Development settings used in production
**Fix:** Add `ENVIRONMENT` variable and validation

### Missing Environment-Specific Config

**Development:**
- Debug logging
- Verbose error messages
- Development-specific features

**Production:**
- Production logging
- Error message sanitization
- Production-specific features

**Current State:** No environment-specific configuration
**Fix:** Add environment-specific configuration

## Configuration Schema Proposal

### Central Configuration Module

**File:** `backend/config.py` (new)

**Schema:**
```python
{
  "database": {
    "url": "string (required)",
    "pool_size": "integer (default: 10)",
    "max_overflow": "integer (default: 20)",
    "pool_recycle": "integer (default: 3600)"
  },
  "security": {
    "secret_key": "string (required)",
    "algorithm": "string (default: HS256)",
    "access_token_expire_minutes": "integer (default: 30)",
    "refresh_token_expire_days": "integer (default: 7)"
  },
  "api": {
    "host": "string (default: 0.0.0.0)",
    "port": "integer (default: 8000)"
  },
  "cors": {
    "origins": "string (required, comma-separated)"
  },
  "cache": {
    "redis_url": "string (optional)"
  },
  "monitoring": {
    "sentry_dsn": "string (optional)"
  },
  "environment": "string (required: development, staging, production)"
}
```

### Configuration Validation

**Validation Rules:**
1. **Required Fields:**
   - `database_url` (required)
   - `secret_key` (required)
   - `cors_origins` (required)

2. **Production-Specific:**
   - `secret_key` must not be default
   - `cors_origins` must not contain "*"
   - `redis_url` must be set (proposed)

3. **Type Validation:**
   - All fields validated for correct types
   - Range validation for numeric fields

## Normalization Path

### Step 1: Create Central Config Module (Week 1)
- Create `backend/config.py`
- Define `Settings` class with Pydantic
- Add validation logic
- Replace hardcoded values with config

### Step 2: Update Environment Variables (Week 1)
- Add missing env vars to `.env.example`
- Update `docker-compose.yml` to use env vars
- Document all configuration options

### Step 3: Add Validation (Week 1)
- Add production validation
- Add startup validation checks
- Add clear error messages

### Step 4: Migrate Existing Code (Week 2)
- Replace hardcoded values in `backend/main.py`
- Replace hardcoded values in `backend/database.py`
- Replace hardcoded values in `backend/rate_limit.py`
- Update all configuration references

### Step 5: Documentation (Week 2)
- Document configuration schema
- Document environment-specific settings
- Document validation rules

## Feature Flags

### Current State

**Feature Flags Exist:** `backend/feature_flags.py`
**Runtime Integration:** Not implemented
**Kill Switch Documentation:** Missing

### Proposed Feature Flag Integration

**File:** `backend/feature_flags.py` (enhance)

**Kill Switch Examples:**
1. **Disable User Registration**
   - Flag: `enable_user_registration`
   - Use case: Emergency maintenance

2. **Disable Event Tracking**
   - Flag: `enable_event_tracking`
   - Use case: Performance issues

3. **Disable Suggestion Generation**
   - Flag: `enable_suggestions`
   - Use case: Algorithm issues

**Kill Switch Documentation:**
- Document all feature flags
- Document kill switch procedures
- Document feature flag configuration

## Configuration Files Summary

### Files with Configuration

1. **`.env.example`** - Environment variable template
2. **`docker-compose.yml`** - Docker service configuration
3. **`backend/main.py`** - Hardcoded configuration values
4. **`backend/database.py`** - Database connection configuration
5. **`backend/rate_limit.py`** - Rate limiting configuration
6. **`backend/cache.py`** - Cache configuration
7. **`backend/sentry_config.py`** - Sentry configuration
8. **`frontend/next.config.js`** - Next.js configuration
9. **`frontend/package.json`** - Frontend dependencies

### Configuration Issues Summary

| Issue | Severity | Files | Fix Effort |
|-------|----------|-------|------------|
| Duplicate database URL | Medium | 3 files | S |
| CORS not using env var | High | 1 file | S |
| Missing env vars in .env.example | Medium | Multiple | S |
| No configuration validation | High | All | M |
| Hardcoded values | Medium | Multiple | M |
| No environment detection | Medium | Multiple | S |
| Feature flags not integrated | Low | 1 file | M |

## Recommended Actions

### Immediate (Week 1)
1. Create `backend/config.py` with centralized configuration
2. Add missing env vars to `.env.example`
3. Use `CORS_ORIGINS` env var in code
4. Add `ENVIRONMENT` variable

### Short-term (Week 2)
1. Add configuration validation
2. Migrate hardcoded values to config
3. Document configuration schema
4. Add feature flag integration

### Long-term (Month 1)
1. Add configuration schema validation
2. Add configuration management UI (optional)
3. Add configuration versioning (optional)
