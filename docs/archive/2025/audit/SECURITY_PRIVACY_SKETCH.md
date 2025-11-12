> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Security & Privacy Sketch

**Generated:** 2024-12-19  
**Scope:** Security threats, privacy surface, and mitigation proposals

## Top 5 Plausible Threats

### 1. JWT Token Forgery (Critical)
**Threat:** Attacker gains access to SECRET_KEY, can forge tokens  
**Impact:** Unauthorized access to all user data  
**Likelihood:** Medium (if default SECRET_KEY used)  
**Current Mitigation:**
- SECRET_KEY in environment variable (`backend/config.py:23`)
- Warning in dev if default (`backend/config.py:76-81`)
- **Gap:** No validation in production (only warns)

**Proposed Mitigation:**
- Fail startup if SECRET_KEY is default in production
- Require strong SECRET_KEY (min 32 characters)
- Rotate SECRET_KEY periodically
- Use key management service (AWS Secrets Manager, etc.)

**Effort:** S (15 minutes)  
**Priority:** P0

### 2. CSRF Attacks (High)
**Threat:** Permissive CORS allows cross-origin requests  
**Impact:** Unauthorized actions on behalf of users  
**Likelihood:** Medium (if CORS misconfigured)  
**Current Mitigation:**
- CORS middleware configured (`backend/main.py:178-184`)
- Warning if `allow_origins=["*"]` in production (`backend/config.py:84-88`)
- **Gap:** No validation in production (only warns)

**Proposed Mitigation:**
- Use `CORS_ORIGINS` env var (already in .env.example)
- Fail startup if `allow_origins=["*"]` in production
- Add CSRF tokens for state-changing operations
- Use SameSite cookies

**Effort:** S (30 minutes)  
**Priority:** P0

### 3. Unencrypted Integration Credentials (High)
**Threat:** Database compromise exposes all API keys  
**Impact:** Attacker gains access to external services (GitHub, Slack, etc.)  
**Likelihood:** Low (requires DB compromise)  
**Current Mitigation:**
- Credentials stored in JSONB (`database/models.py:328`)
- **Gap:** No encryption

**Proposed Mitigation:**
- Encrypt sensitive fields before storage (AES-256)
- Use key management service for encryption keys
- Rotate encryption keys periodically
- Document encryption strategy

**Effort:** M (1-2 days)  
**Priority:** P1

### 4. SQL Injection (Low)
**Threat:** SQL injection via user input  
**Impact:** Database compromise, data exfiltration  
**Likelihood:** Low (SQLAlchemy ORM protects against most cases)  
**Current Mitigation:**
- SQLAlchemy ORM (parameterized queries)
- No raw SQL in application code
- **Gap:** Raw SQL in migration check (`backend/main.py:408` - `text("SELECT 1")`)

**Proposed Mitigation:**
- Use SQLAlchemy for all queries (no raw SQL)
- Input validation on all endpoints
- Regular security audits

**Effort:** S (1 hour) - Review for raw SQL  
**Priority:** P2

### 5. Rate Limiting Bypass (Medium)
**Threat:** DDoS attack bypasses per-instance rate limiting  
**Impact:** Server overload, service unavailable  
**Likelihood:** Medium (if load balancer used)  
**Current Mitigation:**
- Per-instance rate limiting (`backend/rate_limit.py:12`)
- **Gap:** No global rate limiting

**Proposed Mitigation:**
- Redis-backed global rate limiting
- IP-based rate limiting + distributed tracking
- DDoS protection (Cloudflare/WAF)

**Effort:** M (4 hours)  
**Priority:** P1

## Environment & Secret Hygiene

### .env.example Coverage

**Location:** `.env.example`  
**Status:** ✅ Comprehensive (40 lines)

**Variables Documented:**
- `ENVIRONMENT` ✓
- `DATABASE_URL` ✓
- `SECRET_KEY` ✓
- `CORS_ORIGINS` ✓
- `REDIS_URL` ✓
- `SENTRY_DSN` ✓
- `NEXT_PUBLIC_API_URL` ✓
- `SUPABASE_URL` ✓
- `SUPABASE_ANON_KEY` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓

**Missing Variables:** None detected

### Hardcoded Secrets

1. **SECRET_KEY default** - `backend/config.py:23`
   - **Issue:** Default value `"your-secret-key-change-in-production"` in .env.example
   - **Risk:** Token forgery if default used
   - **Fix:** Fail startup in production if default

2. **No hardcoded tokens** - ✅ Good

### Unused Secrets

**None detected** - All secrets in .env.example are used

### Secret Rotation

**Current:** No rotation mechanism  
**Proposed:**
- Document rotation process
- Add secret rotation endpoint (admin only)
- Monitor secret age (alert if > 90 days)

## Data Classification Map

### PII (Personally Identifiable Information)

1. **User.email** - `database/models.py:25`
   - **Location:** PostgreSQL `users.email`
   - **Access:** User (own), Admin (all)
   - **Logging:** ⚠️ Email logged in dev for verification tokens (`main.py:546, 826`)
   - **Fix:** Remove email logging in production

2. **User.full_name** - `database/models.py:28`
   - **Location:** PostgreSQL `users.full_name`
   - **Access:** User (own), Admin (all)
   - **Logging:** Not logged

3. **Event.file_path** - `database/models.py:76`
   - **Location:** PostgreSQL `events.file_path`
   - **Access:** User (own)
   - **Logging:** May contain sensitive paths
   - **Fix:** Add path sanitization/anonymization

### Tenant-Scoped Data

1. **Organization data** - `database/models.py:190-207`
   - **Location:** PostgreSQL `organizations.*`
   - **Access:** Organization members (RBAC)
   - **Logging:** Not logged

2. **UserIntegration.config** - `database/models.py:328`
   - **Location:** PostgreSQL `user_integrations.config`
   - **Access:** User (own), Admin (all)
   - **Logging:** ⚠️ Credentials stored unencrypted
   - **Fix:** Encrypt before storage

### Sensitive Data Flow

1. **JWT Tokens**
   - **Flow:** Generated → Sent to client → Validated on each request
   - **Storage:** Client-side (localStorage/cookies)
   - **Logging:** ⚠️ Token logged in dev (`main.py:546, 826` - verification tokens)
   - **Fix:** Remove token logging in production

2. **Password Hashes**
   - **Flow:** User input → bcrypt hash → Stored in DB
   - **Storage:** PostgreSQL `users.hashed_password`
   - **Logging:** Not logged ✅

3. **Integration Credentials**
   - **Flow:** User input → Stored in DB (unencrypted)
   - **Storage:** PostgreSQL `user_integrations.config`
   - **Logging:** Not logged
   - **Fix:** Encrypt before storage

## Log Redaction Needs

### Current Logging

1. **Email verification tokens** - `backend/main.py:546, 826`
   - **Issue:** Email + token logged in dev
   - **Risk:** Medium - If logs accessible in production
   - **Fix:** Remove logging in production (already conditional)

2. **Password reset tokens** - `backend/main.py:861`
   - **Issue:** Email + token logged in dev
   - **Risk:** Medium - If logs accessible in production
   - **Fix:** Remove logging in production (already conditional)

3. **File paths** - `backend/main.py:949`
   - **Issue:** File paths may contain sensitive information
   - **Risk:** Low - User-specific data
   - **Fix:** Add path sanitization

### Proposed Log Redaction

1. **Email addresses** - Redact in production logs
2. **Tokens** - Never log (already conditional)
3. **File paths** - Sanitize sensitive directories
4. **API keys** - Never log (mask in error messages)

## Minimal Policy/Test Proposals

### Security Policies

1. **SECRET_KEY Policy**
   - Must be 32+ characters
   - Must not be default value
   - Must be rotated every 90 days
   - Must be stored in key management service

2. **CORS Policy**
   - Must not allow `["*"]` in production
   - Must be restricted to specific origins
   - Must be validated on startup

3. **Encryption Policy**
   - All integration credentials must be encrypted
   - Encryption keys must be rotated every 90 days
   - Encryption keys must be stored in key management service

### Security Tests

1. **SECRET_KEY Validation Test**
   ```python
   def test_secret_key_not_default_in_production():
       """Test that SECRET_KEY is not default in production"""
       if os.getenv("ENVIRONMENT") == "production":
           assert SECRET_KEY != "your-secret-key-change-in-production"
   ```

2. **CORS Validation Test**
   ```python
   def test_cors_not_permissive_in_production():
       """Test that CORS is not permissive in production"""
       if os.getenv("ENVIRONMENT") == "production":
           assert "*" not in app.state.cors_origins
   ```

3. **Integration Credentials Encryption Test**
   ```python
   def test_integration_credentials_encrypted():
       """Test that integration credentials are encrypted"""
       # Verify encryption in database
   ```

## Threat Summary

| Threat | Risk | Current Mitigation | Proposed Mitigation | Effort | Priority |
|--------|------|-------------------|---------------------|--------|----------|
| JWT Token Forgery | Critical | Warning in dev | Fail startup in prod | S (15m) | P0 |
| CSRF Attacks | High | Warning in prod | Fail startup in prod | S (30m) | P0 |
| Unencrypted Credentials | High | None | Encrypt before storage | M (1-2d) | P1 |
| SQL Injection | Low | SQLAlchemy ORM | Review for raw SQL | S (1h) | P2 |
| Rate Limiting Bypass | Medium | Per-instance | Redis-backed global | M (4h) | P1 |

## Recommendations

### Immediate (Week 1)
1. **Fail startup if SECRET_KEY is default in production**
2. **Validate CORS origins in production**

### Short-term (Week 2-3)
3. **Encrypt integration credentials**
4. **Remove token logging in production**
5. **Add path sanitization for logs**

### Medium-term (Week 3-4)
6. **Implement Redis-backed rate limiting**
7. **Add security tests**
8. **Document security policies**

See `docs/audit/PR_PLAN_GUARDRAILS.md` for implementation details.
