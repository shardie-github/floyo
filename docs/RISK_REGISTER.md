# Risk Register

**Last Updated:** 2025-01-XX  
**Status:** Active Risk Management  
**Owner:** Engineering Team

This document catalogs identified risks across the Floyo codebase, rated by Impact and Likelihood, with practical mitigation strategies.

---

## Risk Categories

- **Data**: Loss, corruption, privacy, PII exposure
- **Security**: Authentication, secrets, injection, access control
- **Reliability**: Timeouts, retries, error handling
- **Product/UX**: Silent failures, confusing states
- **Business**: Compliance, 3rd party dependencies, vendor lock-in

---

## Data Risks

### RISK-DATA-001: Unencrypted Sensitive Data at Rest
**Description:** User telemetry events, file paths, and integration credentials stored in PostgreSQL may not be encrypted at the database level. Supabase provides encryption at rest, but application-level encryption for sensitive fields (API keys, OAuth tokens) is inconsistent.

**Impact:** High  
**Likelihood:** Medium  
**Current State:** 
- `DataEncryption` class exists but not consistently applied
- Integration credentials stored in `user_integrations` table may be plaintext
- File paths in `events` table may contain sensitive information

**Mitigation:**
1. **Immediate:** Audit all tables storing sensitive data (see `/backend/security.py` for encryption utilities)
2. **Short-term:** Apply `DataEncryption.encrypt_field()` to:
   - `user_integrations.credentials` (OAuth tokens, API keys)
   - `events.filePath` if containing user home directories
   - `workflows.config` if containing secrets
3. **Long-term:** Implement field-level encryption migration script, add encryption status to health checks

**Files to Update:**
- `/backend/connectors.py` - Encrypt credentials on save
- `/database/models.py` - Add encryption helpers to models
- `/backend/api_v1.py` - Decrypt on read, encrypt on write

---

### RISK-DATA-002: Data Retention Policy Enforcement Gaps
**Description:** `data_retention.py` exists but retention policies may not be consistently enforced. Telemetry events, audit logs, and old patterns may accumulate indefinitely, violating privacy commitments and increasing storage costs.

**Impact:** Medium  
**Likelihood:** High  
**Current State:**
- Retention policies defined in `retention_policies` table
- Cleanup job exists but may not run reliably
- No monitoring/alerting for retention policy violations

**Mitigation:**
1. **Immediate:** Add cron job validation in `/backend/data_retention.py`:
   ```python
   def validate_retention_enforcement():
       """Check if retention policies are being enforced."""
       # Query for records older than max retention period
       # Alert if found
   ```
2. **Short-term:** Add retention policy compliance metrics to `/api/monitoring/health`
3. **Long-term:** Implement automated retention policy testing, add alerts for policy violations

**Files to Update:**
- `/backend/data_retention.py` - Add validation and monitoring
- `/backend/monitoring.py` - Add retention metrics
- `/frontend/app/api/privacy/cron/cleanup/route.ts` - Ensure cron runs reliably

---

### RISK-DATA-003: PII in Logs and Error Messages
**Description:** Structured logging (`logging_config.py`) may inadvertently log PII (email addresses, file paths, user IDs) in error messages or debug logs. These logs may be sent to Sentry or other external services.

**Impact:** High  
**Likelihood:** Medium  
**Current State:**
- JSON logging formatter exists
- No PII scrubbing in log messages
- Error messages may include user data

**Mitigation:**
1. **Immediate:** Add PII scrubbing utility:
   ```python
   def scrub_pii(message: str) -> str:
       """Remove email addresses, file paths, user IDs from log messages."""
       # Regex patterns for PII
   ```
2. **Short-term:** Integrate PII scrubbing into `JSONFormatter.format()`
3. **Long-term:** Add PII detection in CI/CD, configure Sentry to filter PII

**Files to Update:**
- `/backend/logging_config.py` - Add PII scrubbing
- `/backend/error_handling.py` - Scrub PII from error messages

---

### RISK-DATA-004: Missing Backup Verification
**Description:** Supabase provides automatic backups, but there's no verification that backups are restorable or that critical data (user accounts, subscriptions) can be recovered.

**Impact:** High  
**Likelihood:** Low  
**Current State:**
- Supabase automatic backups enabled
- No backup restoration testing
- No disaster recovery runbook

**Mitigation:**
1. **Immediate:** Document backup restoration procedure
2. **Short-term:** Quarterly backup restoration tests
3. **Long-term:** Automated backup verification, point-in-time recovery testing

**Files to Add:**
- `/docs/DISASTER_RECOVERY.md` - Backup restoration procedures

---

## Security Risks

### RISK-SEC-001: Weak Secret Key Validation
**Description:** `config.py` validates `SECRET_KEY` length (32 chars) but doesn't check for common weak patterns or enforce complexity. Default/weak secrets could be used in production.

**Impact:** High  
**Likelihood:** Low  
**Current State:**
- Production validation exists but may not catch all weak patterns
- No secret rotation enforcement
- Secrets may be committed to git history

**Mitigation:**
1. **Immediate:** Enhance `config.py` validation:
   ```python
   def validate_secret_strength(key: str) -> bool:
       """Check against common weak patterns, entropy."""
       weak_patterns = ['floyo', 'secret', 'default', 'change']
       # Check entropy, length, patterns
   ```
2. **Short-term:** Add secret rotation reminders, audit git history for secrets
3. **Long-term:** Integrate with secret scanning tools (GitGuardian, TruffleHog)

**Files to Update:**
- `/backend/config.py` - Enhance secret validation
- `/scripts/audit-secrets.ts` - Add to CI/CD

---

### RISK-SEC-002: Inconsistent Authentication Checks
**Description:** API routes use different authentication patterns. Some routes rely on Supabase RLS, others use middleware, creating gaps where unauthenticated requests may succeed.

**Impact:** High  
**Likelihood:** Medium  
**Current State:**
- RLS policies exist but may not cover all tables
- `auth-utils.ts` provides helpers but not consistently used
- Some API routes may bypass authentication

**Mitigation:**
1. **Immediate:** Audit all API routes for authentication:
   ```bash
   # Find all API routes
   grep -r "@app.get\|@app.post" backend/
   grep -r "export.*GET\|export.*POST" frontend/app/api/
   ```
2. **Short-term:** Create authentication middleware wrapper, add tests for unauthenticated access
3. **Long-term:** Automated auth coverage testing, RLS policy validation

**Files to Update:**
- `/frontend/app/api/**/route.ts` - Ensure all routes check auth
- `/backend/api_v1.py` - Add auth dependency to all endpoints
- `/scripts/verify-rls.ts` - Enhance RLS validation

---

### RISK-SEC-003: SQL Injection via Dynamic Queries
**Description:** While SQLAlchemy is used, dynamic query construction (e.g., user-provided filters, search terms) may be vulnerable to SQL injection if not properly parameterized.

**Impact:** High  
**Likelihood:** Low  
**Current State:**
- SQLAlchemy ORM used (parameterized queries)
- Some raw SQL queries may exist
- Input sanitization exists but not consistently applied

**Mitigation:**
1. **Immediate:** Audit all database queries:
   ```python
   # Find raw SQL queries
   grep -r "text(\|execute(\|query(" backend/
   ```
2. **Short-term:** Ensure all queries use parameterized statements
3. **Long-term:** Add SQL injection detection in tests, use query builders

**Files to Review:**
- `/backend/api_v1.py` - Check all database queries
- `/backend/analytics.py` - Review dynamic query construction

---

### RISK-SEC-004: XSS via User-Generated Content
**Description:** User-provided data (file paths, workflow names, integration configs) may be rendered in the frontend without sanitization, enabling XSS attacks.

**Impact:** Medium  
**Likelihood:** Medium  
**Current State:**
- `InputSanitizer` exists in backend
- Frontend may not sanitize all user inputs
- React may escape by default, but not all rendering paths

**Mitigation:**
1. **Immediate:** Audit frontend rendering:
   ```typescript
   // Find dangerous patterns
   grep -r "dangerouslySetInnerHTML\|innerHTML" frontend/
   ```
2. **Short-term:** Apply sanitization to all user-generated content
3. **Long-term:** Content Security Policy (CSP) enforcement, XSS testing

**Files to Review:**
- `/frontend/components/**` - Check all user content rendering
- `/frontend/middleware.ts` - Verify CSP headers

---

### RISK-SEC-005: Webhook Signature Verification Gaps
**Description:** Webhook endpoints (`/api/etl/meta`, `/api/etl/tiktok`) require `ZAPIER_SECRET` but signature verification may not be implemented for all webhooks.

**Impact:** Medium  
**Likelihood:** Medium  
**Current State:**
- `webhook_utils.py` exists with signature verification
- Not all webhook endpoints may verify signatures
- Stripe webhooks may not verify signatures

**Mitigation:**
1. **Immediate:** Audit all webhook endpoints for signature verification
2. **Short-term:** Add signature verification middleware
3. **Long-term:** Automated webhook security testing

**Files to Update:**
- `/frontend/app/api/etl/**/route.ts` - Add signature verification
- `/backend/webhooks.py` - Ensure all webhooks verify signatures

---

### RISK-SEC-006: Rate Limiting Bypass
**Description:** Rate limiting exists (`rate_limit.py`) but may be bypassed via IP rotation, distributed attacks, or missing rate limits on critical endpoints.

**Impact:** Medium  
**Likelihood:** Medium  
**Current State:**
- Rate limiting configured (60/min, 1000/hour)
- May not cover all endpoints
- No rate limiting on authentication endpoints

**Mitigation:**
1. **Immediate:** Add rate limiting to auth endpoints
2. **Short-term:** Implement user-based rate limiting (not just IP-based)
3. **Long-term:** Distributed rate limiting (Redis), adaptive rate limiting

**Files to Update:**
- `/backend/api_v1.py` - Add rate limiting to all endpoints
- `/backend/rate_limit.py` - Add user-based limiting

---

## Reliability Risks

### RISK-REL-001: Database Connection Pool Exhaustion
**Description:** Connection pool (`database.py`) configured with `pool_size=10`, `max_overflow=20`. Under high load or slow queries, connections may be exhausted, causing request failures.

**Impact:** High  
**Likelihood:** Medium  
**Current State:**
- Pool size: 10, max overflow: 20
- Circuit breaker exists but may not prevent exhaustion
- No monitoring for pool exhaustion

**Mitigation:**
1. **Immediate:** Add pool exhaustion monitoring:
   ```python
   def check_pool_health():
       status = get_pool_status()
       if status['checked_out'] >= status['pool_size'] + status['max_overflow']:
           alert("Connection pool exhausted")
   ```
2. **Short-term:** Increase pool size based on load testing
3. **Long-term:** Connection pool auto-scaling, query timeout enforcement

**Files to Update:**
- `/backend/database.py` - Add pool monitoring
- `/backend/monitoring.py` - Add pool metrics

---

### RISK-REL-002: Missing Retry Logic for External APIs
**Description:** External API calls (Stripe, TikTok Ads, Meta Ads, ElevenLabs) may fail without retries, causing user-facing errors and lost data.

**Impact:** Medium  
**Likelihood:** High  
**Current State:**
- Webhook retry logic exists (`webhook_utils.py`)
- External API calls may not have retries
- No circuit breakers for external APIs

**Mitigation:**
1. **Immediate:** Add retry logic to all external API calls:
   ```python
   from tenacity import retry, stop_after_attempt, wait_exponential
   
   @retry(stop=stop_after_attempt(3), wait=wait_exponential())
   def call_external_api(...):
       # API call
   ```
2. **Short-term:** Add circuit breakers for external APIs
3. **Long-term:** Implement exponential backoff, timeout configuration

**Files to Update:**
- `/backend/stripe_integration.py` - Add retries
- `/backend/connectors.py` - Add retries to all integrations

---

### RISK-REL-003: Silent Failure in Background Jobs
**Description:** Celery jobs and cron tasks may fail silently without alerting. Data processing, retention cleanup, and reporting jobs may stop working without notice.

**Impact:** Medium  
**Likelihood:** Medium  
**Current State:**
- Celery configured but may not have error alerting
- Cron jobs (`/api/privacy/cron/cleanup`) may fail silently
- No job failure monitoring

**Mitigation:**
1. **Immediate:** Add error alerting to all background jobs
2. **Short-term:** Implement job status monitoring, dead letter queue
3. **Long-term:** Job health dashboard, automated job recovery

**Files to Update:**
- `/backend/celery_app.py` - Add error handlers
- `/frontend/app/api/**/cron/**/route.ts` - Add error alerting

---

### RISK-REL-004: Missing Timeout Configuration
**Description:** Database queries, external API calls, and webhook processing may not have timeouts, causing requests to hang indefinitely.

**Impact:** Medium  
**Likelihood:** Medium  
**Current State:**
- Database connection timeout: 10s
- Webhook timeout: 30s (`webhook_utils.py`)
- Some API calls may not have timeouts

**Mitigation:**
1. **Immediate:** Add timeouts to all external calls
2. **Short-term:** Configure request timeouts in FastAPI
3. **Long-term:** Timeout monitoring, adaptive timeouts

**Files to Update:**
- `/backend/api_v1.py` - Add request timeouts
- `/backend/connectors.py` - Add timeouts to API calls

---

## Product/UX Risks

### RISK-UX-001: Silent Telemetry Ingestion Failures
**Description:** Telemetry ingestion (`/api/telemetry/ingest`) may fail silently, causing users to lose tracking data without feedback.

**Impact:** Low  
**Likelihood:** High  
**Current State:**
- No user-visible error handling
- Failures may be logged but not surfaced
- No retry mechanism for failed ingestion

**Mitigation:**
1. **Immediate:** Add user-visible error feedback
2. **Short-term:** Implement client-side retry queue
3. **Long-term:** Telemetry health dashboard, user notification for failures

**Files to Update:**
- `/frontend/app/api/telemetry/ingest/route.ts` - Add error handling
- `/frontend/components/TelemetryBeacon.tsx` - Add retry logic

---

### RISK-UX-002: Confusing Error Messages
**Description:** API errors may return technical messages that confuse users. Error handling exists but messages may not be user-friendly.

**Impact:** Low  
**Likelihood:** Medium  
**Current State:**
- Standardized error format exists (`error_handling.py`)
- Messages may be technical
- No user-friendly error mapping

**Mitigation:**
1. **Immediate:** Add user-friendly error messages
2. **Short-term:** Map technical errors to user-friendly messages
3. **Long-term:** Error message testing, user feedback collection

**Files to Update:**
- `/backend/error_handling.py` - Add user-friendly messages
- `/frontend/lib/api.ts` - Map errors to user messages

---

## Business Risks

### RISK-BIZ-001: Vendor Lock-in (Supabase)
**Description:** Heavy reliance on Supabase for database, auth, and edge functions creates vendor lock-in. Migration would be costly and time-consuming.

**Impact:** Medium  
**Likelihood:** High  
**Current State:**
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Edge Functions: Supabase Edge Functions
- RLS policies: Supabase-specific

**Mitigation:**
1. **Immediate:** Document Supabase dependencies
2. **Short-term:** Abstract database layer, use standard PostgreSQL features
3. **Long-term:** Migration plan, multi-vendor strategy

**Files to Add:**
- `/docs/VENDOR_DEPENDENCIES.md` - Document vendor lock-in risks

---

### RISK-BIZ-002: Third-Party API Dependency Failures
**Description:** Critical features depend on external APIs (Stripe, TikTok Ads, Meta Ads, ElevenLabs). API outages or rate limits could break core functionality.

**Impact:** High  
**Likelihood:** Medium  
**Current State:**
- Stripe: Payment processing
- TikTok/Meta Ads: Ad integrations
- ElevenLabs: AI features
- No fallback mechanisms

**Mitigation:**
1. **Immediate:** Add circuit breakers for external APIs
2. **Short-term:** Implement graceful degradation
3. **Long-term:** Multi-vendor strategy, fallback providers

**Files to Update:**
- `/backend/circuit_breaker.py` - Add external API circuit breakers
- `/backend/connectors.py` - Add fallback mechanisms

---

### RISK-BIZ-003: Compliance Gaps (GDPR, CCPA)
**Description:** Privacy features exist but may not fully comply with GDPR/CCPA requirements (data export, deletion, consent management).

**Impact:** High  
**Likelihood:** Medium  
**Current State:**
- Privacy preferences table exists
- Data export endpoint exists (`/api/privacy/export`)
- Data deletion endpoint exists (`/api/privacy/delete`)
- May not cover all requirements

**Mitigation:**
1. **Immediate:** Audit compliance requirements
2. **Short-term:** Implement missing compliance features
3. **Long-term:** Compliance testing, legal review

**Files to Review:**
- `/frontend/app/api/privacy/**/route.ts` - Verify compliance
- `/backend/data_retention.py` - Ensure compliance

---

## Risk Summary

| Category | High Impact | Medium Impact | Low Impact |
|----------|------------|---------------|------------|
| Data | 2 | 2 | 0 |
| Security | 3 | 3 | 0 |
| Reliability | 1 | 3 | 0 |
| Product/UX | 0 | 0 | 2 |
| Business | 1 | 2 | 0 |
| **Total** | **7** | **10** | **2** |

**Priority Actions:**
1. Encrypt sensitive data at rest (RISK-DATA-001)
2. Enhance authentication checks (RISK-SEC-002)
3. Add retry logic for external APIs (RISK-REL-002)
4. Implement compliance features (RISK-BIZ-003)

---

## Review Schedule

- **Weekly:** Review new risks, update likelihood/impact
- **Monthly:** Review mitigation progress
- **Quarterly:** Full risk register review

---

## Change Log

- **2025-01-XX**: Initial risk register created
