> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Config Entropy Report

**Generated:** 2024-12-19  
**Scope:** Configuration sprawl, environment parity, and validation gaps

## Configuration Sources

### Primary Config

1. **`backend/config.py`** - Pydantic Settings (✅ Single source of truth)
   - **Location:** `backend/config.py:10-99`
   - **Status:** ✅ Centralized configuration
   - **Format:** Pydantic BaseSettings with env var loading

2. **`.env.example`** - Environment variable template
   - **Location:** `.env.example`
   - **Status:** ✅ Comprehensive (40 lines)

### Configuration Duplication

#### Database Configuration
- **`.env.example`:** `DATABASE_URL`, `DATABASE_POOL_SIZE`, etc.
- **`backend/config.py:16-20`:** Database settings ✅
- **`docker-compose.yml:27`:** `DATABASE_URL` (duplicate)
- **`alembic.ini:61`:** `sqlalchemy.url` (hardcoded) ⚠️

**Risk:** Alembic config hardcoded, not using env var  
**Fix:** Use env var in alembic.ini or generate from settings

#### CORS Configuration
- **`.env.example`:** `CORS_ORIGINS=http://localhost:3000,http://localhost:3001`
- **`backend/config.py:33`:** `cors_origins: str` ✅
- **`backend/main.py:180`:** `allow_origins=settings.cors_origins` ✅

**Status:** ✅ No duplication (using env var)

#### SECRET_KEY Configuration
- **`.env.example`:** `SECRET_KEY=your-secret-key-change-in-production`
- **`backend/config.py:23`:** `secret_key: str` ✅
- **`docker-compose.yml:28`:** `SECRET_KEY: ${SECRET_KEY:-change-me-in-production}` ⚠️

**Risk:** Different default values  
**Fix:** Use same default or remove defaults

## Environment Parity Analysis

### Development vs Production

| Setting | Development Default | Production Required | Validation | Status |
|---------|-------------------|-------------------|------------|--------|
| `ENVIRONMENT` | `development` | `production` | ✅ Validator exists | ✅ |
| `SECRET_KEY` | `your-secret-key-change-in-production` | Strong random value | ⚠️ Warning only | ⚠️ |
| `CORS_ORIGINS` | `http://localhost:3000` | Specific domains | ⚠️ Warning only | ⚠️ |
| `REDIS_URL` | `None` (optional) | Recommended | ⚠️ Warning only | ⚠️ |
| `DATABASE_URL` | `postgresql://floyo:floyo@localhost:5432/floyo` | Production URL | None | ✅ |
| `SENTRY_DSN` | `None` (optional) | Recommended | None | ✅ |

**Parity Issues:**
1. **SECRET_KEY** - Default acceptable in dev, must fail in prod
2. **CORS_ORIGINS** - Permissive in dev, must be restricted in prod
3. **REDIS_URL** - Optional in dev, recommended in prod

## Configuration Validation

### Current Validation

**Location:** `backend/config.py:71-95`

**Validated:**
- ✅ `environment` - Must be one of: development, staging, production
- ⚠️ `secret_key` - Warning if default in production
- ⚠️ `cors_origins` - Warning if `["*"]` in production
- ⚠️ `redis_url` - Warning if not set in production

**Gaps:**
- SECRET_KEY validation only warns (should fail)
- CORS validation only warns (should fail)
- No validation for database_url format
- No validation for port ranges

### Proposed Validation

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
    
    # CORS validation - FAIL if permissive
    if "*" in self.cors_origins:
        raise ValueError(
            "CORS origins cannot be '*' in production. "
            "Set CORS_ORIGINS environment variable to a comma-separated list of allowed origins."
        )
    
    # Redis validation - WARN if not set
    if not self.redis_url:
        logger.warning(
            "REDIS_URL is not set in production. "
            "Cache and rate limiting will use in-memory storage (not recommended for production)."
        )
```

## Configuration Schema

### Current Schema

**Location:** `backend/config.py:10-69`

**Settings:**
- Environment
- Database (URL, pool size, max overflow, pool recycle)
- Security (SECRET_KEY, algorithm, token expiry)
- API (host, port)
- CORS (origins)
- Rate Limiting (per minute, per hour)
- Cache (Redis URL)
- Monitoring (Sentry DSN)
- Frontend (API URL)
- Supabase (URL, keys)

**Status:** ✅ Comprehensive schema

### Proposed Schema Enhancement

**Add JSON Schema Export:**
```python
def get_config_schema():
    """Export configuration schema as JSON Schema."""
    return Settings.schema()
```

**Usage:**
- Documentation generation
- Validation in other services
- Configuration UI generation

## Configuration Sprawl

### Files with Configuration

1. **`backend/config.py`** - ✅ Primary config (single source of truth)
2. **`.env.example`** - ✅ Environment variable template
3. **`docker-compose.yml`** - ⚠️ Some duplicate config
4. **`alembic.ini`** - ⚠️ Hardcoded database URL
5. **`backend/main.py`** - ✅ Uses settings (no hardcoded config)

**Sprawl Level:** Low (mostly centralized)

### Duplicated Configuration

1. **Database URL**
   - `.env.example`: `DATABASE_URL=postgresql://...`
   - `alembic.ini:61`: `sqlalchemy.url = postgresql://...` (hardcoded)
   - **Fix:** Use env var in alembic.ini

2. **SECRET_KEY Default**
   - `.env.example`: `SECRET_KEY=your-secret-key-change-in-production`
   - `docker-compose.yml:28`: `SECRET_KEY: ${SECRET_KEY:-change-me-in-production}`
   - **Fix:** Use same default or remove defaults

## Missing Configuration

### Environment Variables

**All documented in `.env.example`** ✅

### Configuration Documentation

**Missing:**
- Configuration schema documentation
- Environment-specific configuration guide
- Configuration validation rules
- Secret rotation process

## Recommended Configuration Normalization

### Phase 1: Validation (Week 1)

1. **Fail startup if SECRET_KEY is default in production**
   - File: `backend/config.py:76-81`
   - Change: Raise ValueError instead of warning

2. **Fail startup if CORS includes "*" in production**
   - File: `backend/config.py:84-88`
   - Change: Raise ValueError instead of warning

### Phase 2: Consolidation (Week 2)

3. **Remove hardcoded database URL in alembic.ini**
   - File: `alembic.ini:61`
   - Change: Use env var or generate from settings

4. **Standardize SECRET_KEY defaults**
   - File: `docker-compose.yml:28`
   - Change: Use same default or remove

### Phase 3: Documentation (Week 3)

5. **Add configuration schema documentation**
   - File: `docs/CONFIGURATION.md` (new)
   - Content: Schema, validation rules, environment-specific config

6. **Add secret rotation process**
   - File: `docs/SECRET_ROTATION.md` (new)
   - Content: How to rotate SECRET_KEY, encryption keys, etc.

## Configuration Entropy Summary

| Issue | Files Affected | Risk | Effort | Priority |
|-------|---------------|------|--------|----------|
| SECRET_KEY validation | 1 file | High | S (15m) | P0 |
| CORS validation | 1 file | High | S (30m) | P0 |
| Alembic hardcoded URL | 1 file | Low | S (30m) | P1 |
| SECRET_KEY default mismatch | 2 files | Low | S (15m) | P2 |
| Missing config docs | - | Low | M (2h) | P2 |

**Total Issues:** 5  
**Critical:** 2  
**High:** 0  
**Medium:** 0  
**Low:** 3

**Recommendations:**
1. Fix SECRET_KEY and CORS validation (1 hour)
2. Remove hardcoded config in alembic.ini (30 minutes)
3. Add configuration documentation (2 hours)

See `docs/audit/PR_PLAN_CONFIG_SCHEMA.md` for implementation details.
