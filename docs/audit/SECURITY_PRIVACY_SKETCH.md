# Security & Privacy Surface Analysis

## Top 5 Plausible Threats

### 1. JWT Secret Key Compromise
**Threat:** Attacker gains access to SECRET_KEY, can forge tokens
**Attack Vector:** 
- Hardcoded default key in production
- Secret leaked in logs/repository
- Environment variable exposed

**Current Mitigation:**
- SECRET_KEY in environment variable
- Default value "your-secret-key-change-in-production" (weak)

**Proposed Mitigation:**
- Fail startup if SECRET_KEY is default in production
- Require strong SECRET_KEY (min 32 characters)
- Rotate SECRET_KEY periodically
- Use key rotation with grace period (support old + new keys)

**Files:** `backend/main.py:60`

### 2. SQL Injection via ORM Bypass
**Threat:** Attacker injects SQL through unsanitized input
**Attack Vector:**
- Raw SQL queries without parameterization
- String concatenation in queries

**Current Mitigation:**
- SQLAlchemy ORM (parameterized queries)
- No raw SQL found (except `text("SELECT 1")` in health check)

**Proposed Mitigation:**
- Audit all database queries for raw SQL
- Use SQLAlchemy query builder exclusively
- Add query validation

**Files:** `backend/main.py:361` (health check uses `text()` safely)

### 3. CORS Misconfiguration
**Threat:** CSRF attacks, unauthorized origins
**Attack Vector:**
- Permissive CORS (`allow_origins=["*"]`)
- Missing origin validation

**Current Mitigation:**
- CORS middleware configured
- `allow_origins=["*"]` in code (permissive)

**Proposed Mitigation:**
- Use `CORS_ORIGINS` env var (already in .env.example)
- Fail startup if `allow_origins=["*"]` in production
- Validate origins against allowlist

**Files:** `backend/main.py:133-139`

### 4. Rate Limiting Bypass (Multi-Instance)
**Threat:** DDoS attack, resource exhaustion
**Attack Vector:**
- Rate limiting per-instance (not global)
- Attacker hits multiple instances

**Current Mitigation:**
- `slowapi` with `get_remote_address`
- In-memory storage (per-instance)

**Proposed Mitigation:**
- Use Redis-backed rate limiting
- Global rate limit enforcement
- Add rate limit headers to responses

**Files:** `backend/rate_limit.py:11`

### 5. Sensitive Data in Logs
**Threat:** PII/exposed in logs, compliance violations
**Attack Vector:**
- Logs contain passwords, tokens, PII
- Logs accessible to unauthorized users

**Current Mitigation:**
- Structured logging (JSON)
- No obvious PII in logs found

**Proposed Mitigation:**
- Audit all log statements for PII
- Add log redaction for sensitive fields
- Use log sanitization middleware
- Document log retention policy

**Files:** `backend/logging_config.py`, `backend/main.py` (various log statements)

## Environment & Secret Hygiene

### Missing .env.example Keys

**Current `.env.example` has:
- DATABASE_URL ✓
- SECRET_KEY ✓
- ALGORITHM ✓
- ACCESS_TOKEN_EXPIRE_MINUTES ✓
- API_HOST ✓
- API_PORT ✓
- CORS_ORIGINS ✓
- SUPABASE_URL (optional)
- SUPABASE_ANON_KEY (optional)
- SUPABASE_SERVICE_ROLE_KEY (optional)
- NEXT_PUBLIC_API_URL ✓

**Missing from `.env.example`:**
- `REDIS_URL` - Used by cache but not documented
- `RATE_LIMIT_PER_MINUTE` - Used by rate limiting but not documented
- `RATE_LIMIT_PER_HOUR` - Used by rate limiting but not documented
- `SENTRY_DSN` - Used by Sentry but not documented
- `ENVIRONMENT` - Used for production checks (proposed)

**Proposed:** Add missing environment variables to `.env.example`

### Unused Secrets

**None detected** - All secrets in `.env.example` are used.

### Hardcoded Tokens

**Found:**
1. **SECRET_KEY default** - `backend/main.py:60`
   - Default: "your-secret-key-change-in-production"
   - **Risk:** High if used in production
   - **Fix:** Fail startup if default in production

2. **No other hardcoded tokens found** ✓

### Permissive CORS

**Location:** `backend/main.py:133-139`
```python
allow_origins=["*"],  # Configure appropriately for production
```
**Risk:** High - CSRF attacks possible
**Fix:** Use `CORS_ORIGINS` env var, fail startup if `["*"]` in production

## Data Classification Map

### PII (Personally Identifiable Information)

| Data Type | Storage Location | Access | Logs | Risk |
|-----------|----------------|--------|------|------|
| Email | `users.email` | Authenticated users | No | Low |
| Username | `users.username` | Authenticated users | No | Low |
| Full Name | `users.full_name` | Authenticated users | No | Low |
| Password Hash | `users.hashed_password` | System only | No | Medium |
| Email Verification Token | `users.email_verification_token` | System only | **Yes (dev)** | **High** |
| Password Reset Token | `users.password_reset_token` | System only | **Yes (dev)** | **High** |
| IP Address | `user_sessions.ip_address`, `audit_logs.ip_address` | System only | Yes | Medium |
| User Agent | `audit_logs.user_agent` | System only | Yes | Low |

**Issues:**
1. **Email verification tokens logged** - `backend/main.py:437`
   - Logs token in dev: `logger.info(f"Email verification token for {user.email}: {verification_token}")`
   - **Risk:** High if logs accessible
   - **Fix:** Remove logging in production, use email service

2. **Password reset tokens logged** - `backend/main.py:748`
   - Logs token in dev: `logger.info(f"Password reset token for {user.email}: {reset_token}")`
   - **Risk:** High if logs accessible
   - **Fix:** Remove logging in production, use email service

### Tenant-Scoped Data

| Data Type | Storage Location | Isolation | Risk |
|-----------|----------------|-----------|------|
| Events | `events` table | `user_id` filter | Low |
| Patterns | `patterns` table | `user_id` filter | Low |
| Suggestions | `suggestions` table | `user_id` filter | Low |
| Workflows | `workflows` table | `user_id` + `organization_id` filter | Medium |
| Organizations | `organizations` table | `organization_id` filter | Medium |

**Issues:**
1. **Organization data isolation** - No RLS policies (application-level only)
   - **Risk:** Medium - Application bugs could leak data
   - **Fix:** Add database-level RLS (if using Supabase) or audit application queries

2. **Multi-tenant queries** - All queries filter by `user_id` or `organization_id`
   - **Risk:** Low - Queries appear correctly scoped
   - **Fix:** Add query audit to ensure all queries have user/org filters

### Sensitive Config Data

| Data Type | Storage Location | Encryption | Risk |
|-----------|----------------|------------|------|
| Integration Credentials | `user_integrations.config` (JSONB) | **None** | **High** |
| User Config | `user_configs` (JSONB) | None | Low |
| Workflow Steps | `workflows.steps` (JSONB) | None | Low |

**Issues:**
1. **Integration credentials unencrypted** - `backend/connectors.py:328`
   - Stored in `user_integrations.config` as JSONB
   - **Risk:** High - Database compromise exposes all credentials
   - **Fix:** Encrypt sensitive fields (access tokens, passwords) before storage

2. **Sensitive fields identified** - `backend/connectors.py:200`
   - Code identifies sensitive fields: `['access_token', 'secret_access_key', 'password', 'api_key', 'webhook_url']`
   - **Fix:** Implement encryption for these fields

## Log Redaction Needs

### Current Logging

**Structured Logging:** ✓ (JSON format)
**Location:** `backend/logging_config.py`

**Log Statements Found:**
1. Email verification token logged (dev only) - **Needs redaction**
2. Password reset token logged (dev only) - **Needs redaction**
3. IP addresses logged (audit logs) - **OK** (needed for security)
4. User agents logged (audit logs) - **OK** (needed for security)

**Proposed Log Redaction:**
- Add log sanitization middleware
- Redact tokens, passwords, API keys from logs
- Use environment variable to control log verbosity

**Files to Modify:**
- `backend/logging_config.py` - Add log sanitization
- `backend/main.py:437, 748` - Remove token logging in production

## Minimal Policy/Test Proposals

### 1. Security Policy Tests

**File:** `tests/test_security.py` (new)
```python
def test_secret_key_not_default_in_production():
    """Test that SECRET_KEY is not default in production"""
    if os.getenv("ENVIRONMENT") == "production":
        assert SECRET_KEY != "your-secret-key-change-in-production"

def test_cors_not_permissive_in_production():
    """Test that CORS is not permissive in production"""
    if os.getenv("ENVIRONMENT") == "production":
        assert "*" not in app.state.cors_origins

def test_integration_credentials_encrypted():
    """Test that integration credentials are encrypted"""
    # Check that sensitive fields are encrypted in database
```

### 2. Privacy Policy Tests

**File:** `tests/test_privacy.py` (new)
```python
def test_no_pii_in_logs():
    """Test that PII is not logged"""
    # Check log files for PII patterns (emails, tokens, etc.)

def test_user_data_isolation():
    """Test that users can only access their own data"""
    # Test that user A cannot access user B's data
```

### 3. Data Retention Policy

**Current State:** No retention policy implemented
**Proposed:**
- Add data retention configuration
- Implement cleanup job for old data
- Document retention periods

**Files to Modify:**
- `backend/main.py:1485-1516` (cleanup endpoint exists but needs policy)

## Threat Model Summary

### Attack Surface

**External:**
- API endpoints (40+ endpoints)
- WebSocket connections
- File uploads
- Authentication endpoints

**Internal:**
- Database connections
- Redis connections (optional)
- File system (uploads)

### Attack Vectors

1. **Authentication Bypass** - JWT token forgery (if SECRET_KEY compromised)
2. **SQL Injection** - Low risk (ORM used)
3. **CSRF** - Medium risk (permissive CORS)
4. **DDoS** - Medium risk (per-instance rate limiting)
5. **Data Leakage** - Low risk (queries properly scoped)
6. **Credential Theft** - High risk (unencrypted integration credentials)

### Security Posture

**Overall:** **Medium Risk**

**Strengths:**
- ORM prevents SQL injection
- JWT authentication implemented
- Rate limiting implemented
- Structured logging

**Weaknesses:**
- Permissive CORS
- Unencrypted integration credentials
- Hardcoded SECRET_KEY default
- Per-instance rate limiting
- Token logging in dev

## Recommended Security Improvements

### P0 (Critical)
1. **Fail startup if SECRET_KEY is default in production**
2. **Encrypt integration credentials**
3. **Remove token logging in production**

### P1 (High)
1. **Use Redis-backed rate limiting**
2. **Validate CORS origins in production**
3. **Add log sanitization**

### P2 (Medium)
1. **Add database-level RLS (if using Supabase)**
2. **Implement data retention policy**
3. **Add security policy tests**
