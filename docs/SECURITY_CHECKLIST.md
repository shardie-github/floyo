# Security Checklist

**Last Updated:** 2025-01-XX  
**Status:** Active Security Controls  
**Owner:** Security Team

This checklist provides actionable security controls for the Floyo codebase. Use this during code reviews, deployments, and security audits.

---

## Pre-Deployment Security Checks

### Authentication & Authorization

- [ ] **All API routes require authentication**
  - Verify: `grep -r "export.*GET\|export.*POST" frontend/app/api/ | grep -v "auth\|health"`
  - Check: Each route calls `getUserId()` or equivalent
  - Files: `/frontend/app/api/**/route.ts`

- [ ] **RLS policies enabled on all tables**
  - Verify: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';`
  - Expected: All tables have `rowsecurity = true`
  - Files: `/supabase/migrations/**/*.sql`

- [ ] **Service role key not exposed to client**
  - Verify: No `SUPABASE_SERVICE_ROLE_KEY` in client-side code
  - Check: `grep -r "SERVICE_ROLE" frontend/`
  - Files: `/frontend/**/*.ts`, `/frontend/**/*.tsx`

- [ ] **JWT tokens validated on all protected endpoints**
  - Verify: Token validation in middleware or route handlers
  - Check: Token expiration checked
  - Files: `/backend/api_v1.py`, `/frontend/middleware.ts`

- [ ] **MFA enforced for sensitive operations**
  - Verify: `checkMfaElevation()` called for sensitive endpoints
  - Check: Password changes, payment updates, data export
  - Files: `/backend/api_v1.py`, `/frontend/lib/auth-utils.ts`

---

### Secrets Management

- [ ] **No secrets in code or git history**
  - Verify: `git log --all --full-history --source -- "*.env*" "*.key" "*.pem"`
  - Tool: Run `npm run audit:secrets`
  - Action: Rotate any exposed secrets

- [ ] **Environment variables validated at startup**
  - Verify: `config.py` validates required secrets
  - Check: Production fails fast if secrets missing/weak
  - Files: `/backend/config.py`

- [ ] **Secrets encrypted at rest**
  - Verify: Integration credentials encrypted using `DataEncryption`
  - Check: `user_integrations.credentials` encrypted
  - Files: `/backend/connectors.py`, `/backend/security.py`

- [ ] **Secret rotation policy documented**
  - Verify: Rotation schedule for `SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Check: Secrets rotated quarterly or after exposure
  - Files: `/docs/OPERATIONS_RUNBOOK.md`

---

### Input Validation & Sanitization

- [ ] **All user inputs validated**
  - Verify: Pydantic models or Zod schemas for all inputs
  - Check: File paths, email addresses, URLs validated
  - Files: `/backend/input_validation.py`, `/backend/security.py`

- [ ] **SQL injection prevented**
  - Verify: All queries use parameterized statements
  - Check: No raw SQL with user input
  - Files: `/backend/api_v1.py`, `/backend/analytics.py`

- [ ] **XSS prevented**
  - Verify: User content sanitized before rendering
  - Check: No `dangerouslySetInnerHTML` without sanitization
  - Files: `/frontend/components/**/*.tsx`

- [ ] **Path traversal prevented**
  - Verify: File paths sanitized using `InputSanitizer.sanitize_filename()`
  - Check: No `../` in file paths
  - Files: `/backend/api_v1.py`, `/backend/export.py`

---

### Data Protection

- [ ] **PII not logged**
  - Verify: Logging scrubs email addresses, user IDs, file paths
  - Check: `logging_config.py` includes PII scrubbing
  - Files: `/backend/logging_config.py`

- [ ] **Sensitive data encrypted**
  - Verify: Encryption applied to:
    - OAuth tokens (`user_integrations.credentials`)
    - API keys
    - File paths containing user home directories
  - Files: `/backend/security.py`, `/backend/connectors.py`

- [ ] **Data retention policies enforced**
  - Verify: Retention cleanup job runs successfully
  - Check: No data older than retention period
  - Files: `/backend/data_retention.py`, `/frontend/app/api/privacy/cron/cleanup/route.ts`

- [ ] **Backup encryption verified**
  - Verify: Supabase backups encrypted at rest
  - Check: Backup restoration tested quarterly
  - Files: `/docs/DISASTER_RECOVERY.md` (to be created)

---

### API Security

- [ ] **Rate limiting enabled**
  - Verify: Rate limits applied to all endpoints
  - Check: Auth endpoints have stricter limits
  - Files: `/backend/rate_limit.py`, `/backend/api_v1.py`

- [ ] **CORS properly configured**
  - Verify: CORS origins not set to `*` in production
  - Check: Only allowed origins in `CORS_ORIGINS`
  - Files: `/backend/config.py`, `/backend/main.py`

- [ ] **Webhook signatures verified**
  - Verify: All webhook endpoints verify signatures
  - Check: Stripe, Zapier webhooks verify signatures
  - Files: `/backend/webhooks.py`, `/frontend/app/api/etl/**/route.ts`

- [ ] **CSRF protection enabled**
  - Verify: CSRF tokens for state-changing operations
  - Check: `CSRFProtectionMiddleware` applied
  - Files: `/backend/csrf_protection.py`, `/backend/main.py`

---

### Infrastructure Security

- [ ] **Security headers configured**
  - Verify: CSP, HSTS, X-Frame-Options headers set
  - Check: Headers configured in middleware
  - Files: `/frontend/middleware.ts`, `/backend/security.py`

- [ ] **HTTPS enforced**
  - Verify: All production traffic over HTTPS
  - Check: HSTS header set
  - Files: `/frontend/middleware.ts`

- [ ] **Database connections secured**
  - Verify: `DATABASE_URL` uses SSL
  - Check: Connection string includes `sslmode=require`
  - Files: `/backend/config.py`, `/backend/database.py`

- [ ] **Error messages don't leak information**
  - Verify: Production errors don't expose stack traces
  - Check: Generic error messages in production
  - Files: `/backend/error_handling.py`

---

### Monitoring & Alerting

- [ ] **Security events logged**
  - Verify: Failed logins, auth failures logged
  - Check: `SecurityAuditor.log_security_event()` called
  - Files: `/backend/security.py`, `/backend/api_v1.py`

- [ ] **Suspicious activity detected**
  - Verify: `detect_suspicious_activity()` implemented
  - Check: Alerts for multiple failed logins, IP changes
  - Files: `/backend/security.py`

- [ ] **Error tracking configured**
  - Verify: Sentry configured for error tracking
  - Check: PII scrubbed from Sentry events
  - Files: `/backend/sentry_config.py`

---

## Code Review Security Checklist

### New Feature Security Review

- [ ] **Authentication required**
  - Does the new endpoint require authentication?
  - Is user context validated?

- [ ] **Authorization checked**
  - Does the user have permission to perform this action?
  - Is RLS policy sufficient?

- [ ] **Input validated**
  - Are all inputs validated?
  - Are file paths sanitized?

- [ ] **Output sanitized**
  - Is user-generated content sanitized?
  - Are error messages safe?

- [ ] **Secrets handled securely**
  - Are secrets encrypted?
  - Are secrets not logged?

- [ ] **Rate limiting applied**
  - Is rate limiting enabled?
  - Are limits appropriate?

---

## Deployment Security Checklist

### Pre-Deployment

- [ ] **Secrets rotated** (if needed)
  - Rotate `SECRET_KEY` if exposed
  - Rotate `SUPABASE_SERVICE_ROLE_KEY` if exposed

- [ ] **Environment variables set**
  - Verify all required variables in Vercel/Supabase
  - Check: `npm run env:validate`

- [ ] **Database migrations reviewed**
  - Review migration SQL for security issues
  - Verify RLS policies created

- [ ] **Dependencies updated**
  - Run `npm audit` and `pip check`
  - Update vulnerable dependencies

- [ ] **Security tests passing**
  - Run `npm run security:check`
  - Run `npm run verify:rls`

### Post-Deployment

- [ ] **Health checks passing**
  - Verify `/api/health` returns 200
  - Verify `/api/monitoring/health` shows all systems healthy

- [ ] **Security headers verified**
  - Check response headers include CSP, HSTS
  - Verify headers using browser dev tools

- [ ] **Error tracking working**
  - Verify Sentry receiving errors
  - Check error volume is normal

---

## Incident Response Checklist

### Security Incident Detected

- [ ] **Contain the incident**
  - Disable affected feature flags
  - Revoke compromised tokens/keys
  - Block malicious IPs

- [ ] **Assess impact**
  - Determine scope of breach
  - Identify affected users/data
  - Check logs for suspicious activity

- [ ] **Notify stakeholders**
  - Alert security team
  - Notify affected users (if required)
  - Document incident

- [ ] **Remediate**
  - Fix security vulnerability
  - Rotate compromised secrets
  - Update security controls

- [ ] **Post-incident review**
  - Document lessons learned
  - Update security checklist
  - Improve monitoring/alerting

---

## Compliance Checklist

### GDPR Compliance

- [ ] **Data export functional**
  - Verify `/api/privacy/export` works
  - Test export includes all user data

- [ ] **Data deletion functional**
  - Verify `/api/privacy/delete` works
  - Test deletion removes all user data

- [ ] **Consent management**
  - Verify privacy preferences stored
  - Check consent tracking

- [ ] **Data retention**
  - Verify retention policies enforced
  - Check data deleted after retention period

### CCPA Compliance

- [ ] **Right to know**
  - Data export endpoint functional
  - Privacy policy accessible

- [ ] **Right to delete**
  - Data deletion endpoint functional
  - Deletion verified

- [ ] **Do not sell**
  - Verify no data sold to third parties
  - Check privacy policy

---

## Security Testing Checklist

### Automated Testing

- [ ] **Security tests in CI/CD**
  - Run `npm run security:check`
  - Run `npm run verify:rls`
  - Run `npm run audit:secrets`

- [ ] **Dependency scanning**
  - Run `npm audit`
  - Run `pip check`
  - Update vulnerable dependencies

- [ ] **Static analysis**
  - Run ESLint security rules
  - Run Python security linters
  - Fix security issues

### Manual Testing

- [ ] **Authentication bypass testing**
  - Test unauthenticated access to protected endpoints
  - Verify 401/403 responses

- [ ] **Authorization testing**
  - Test user accessing other user's data
  - Verify RLS policies prevent access

- [ ] **Input validation testing**
  - Test SQL injection attempts
  - Test XSS payloads
  - Test path traversal attempts

---

## Security Tools & Commands

### Useful Commands

```bash
# Audit secrets in codebase
npm run audit:secrets

# Verify RLS policies
npm run verify:rls

# Security self-check
npm run security:check

# Validate environment variables
npm run env:validate

# Check for vulnerable dependencies
npm audit
pip check
```

### Security Scripts

- `/scripts/security-self-check.ts` - Comprehensive security audit
- `/scripts/audit-secrets.ts` - Secret scanning
- `/scripts/verify-rls.ts` - RLS policy verification

---

## Security Contacts

- **Security Team:** [Add contact]
- **Incident Response:** [Add contact]
- **Compliance:** [Add contact]

---

## Change Log

- **2025-01-XX**: Initial security checklist created
