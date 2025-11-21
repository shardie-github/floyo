# Guardrail System Design

**Last Updated:** 2025-01-XX  
**Status:** Implementation Guide  
**Owner:** Engineering Team

This document outlines the guardrail layer for the Floyo codebase, providing structure and safety mechanisms to prevent failures and security issues as the system grows.

---

## Overview

The guardrail system provides multiple layers of protection:

1. **Feature Flags** - Gradual rollouts and emergency kill switches
2. **Logging & Structured Events** - Observability and audit trails
3. **Monitoring & Alerting** - Proactive issue detection
4. **Access Control** - Authentication and authorization enforcement

---

## 1. Feature Flags & Configuration Strategy

### Current State

- Feature flag system exists (`/backend/feature_flags.py`)
- Supports boolean flags, gradual rollouts, user/org overrides
- Kill-switch mechanism available

### Recommendations

**1.1 Standardize Feature Flag Usage**

All new features should be behind feature flags:

```python
from backend.feature_flags import FeatureFlagService

# Check feature flag
if FeatureFlagService.is_enabled(db, "new_feature", user_id=user_id):
    # New feature code
    pass
else:
    # Fallback behavior
    pass
```

**1.2 Feature Flag Naming Convention**

- Format: `{category}_{feature_name}`
- Examples:
  - `ai_recommendations`
  - `workflow_automation`
  - `billing_stripe`

**1.3 Gradual Rollout Process**

1. Create flag with `enabled=False`, `rollout_percentage=0`
2. Enable for internal users (`target_users`)
3. Gradual rollout: 1% → 10% → 50% → 100%
4. Monitor error rates, user feedback
5. Remove flag after full rollout (or keep for emergency disable)

**1.4 Configuration Management**

- Use environment variables for configuration
- Validate configuration at startup (`config_helpers.py`)
- Fail fast on invalid production configuration

---

## 2. Logging & Structured Events

### Current State

- Structured JSON logging exists (`logging_config.py`)
- PII scrubbing not consistently applied
- Event logging not standardized

### Recommendations

**2.1 Use Structured Event Logging**

Replace ad-hoc logging with structured events:

```python
from backend.logging_helpers import log_event, log_api_request

# Instead of:
logger.info(f"User {user_id} logged in")

# Use:
log_event(
    event_type="user.login",
    level="INFO",
    user_id=user_id,
    details={"ip_address": "[MASKED]"}
)
```

**2.2 Standard Event Types**

- `user.{action}` - User actions (login, logout, signup)
- `api.{endpoint}` - API requests
- `database.{operation}` - Database operations
- `security.{event}` - Security events
- `integration.{service}` - External integrations

**2.3 PII Scrubbing**

All log messages must scrub PII:

```python
from backend.logging_helpers import scrub_pii

# Automatic scrubbing in log_event()
log_event("user.action", details={"email": "user@example.com"})  # Email scrubbed
```

**2.4 Log Levels**

- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARNING**: Warning messages (non-critical issues)
- **ERROR**: Error messages (handled errors)
- **CRITICAL**: Critical errors (unhandled exceptions)

---

## 3. Monitoring & Alerting Approach

### Current State

- Health check endpoints exist (`/api/health`, `/api/monitoring/health`)
- Sentry configured for error tracking
- No structured alerting system

### Recommendations

**3.1 Key Metrics to Monitor**

**Application Metrics:**
- Request rate (requests/second)
- Error rate (errors/requests)
- Response time (P50, P95, P99)
- Database connection pool usage

**Business Metrics:**
- User signups
- Active users
- Feature flag adoption
- Integration usage

**Infrastructure Metrics:**
- Database query performance
- External API latency
- Cache hit rate
- Background job success rate

**3.2 Alerting Thresholds**

**Critical Alerts (P0):**
- Service down (health check fails)
- Error rate > 5%
- Database connection pool exhausted
- Security breach detected

**Warning Alerts (P1):**
- Error rate > 1%
- Response time P95 > 2s
- Retention policy violations
- Feature flag kill-switch activated

**Info Alerts (P2):**
- High request rate (> 1000/min)
- Slow queries (> 1s)
- External API errors

**3.3 Monitoring Implementation**

**Health Check Endpoint:**
```python
# /api/monitoring/health
{
  "status": "ok",
  "database": {
    "connected": true,
    "pool_usage": 0.5,
    "query_time_p95": 120
  },
  "features": {
    "ai_recommendations": {"enabled": true, "users": 1000}
  },
  "retention": {
    "last_cleanup": "2025-01-XXT00:00:00Z",
    "violations": 0
  }
}
```

**Structured Events for Monitoring:**
- Emit events for all critical operations
- Aggregate events in monitoring system (e.g., Datadog, New Relic)
- Create dashboards for key metrics

---

## 4. Access Control Model

### Current State

- Supabase Auth for authentication
- RLS policies for database access
- Inconsistent API route authentication

### Recommendations

**4.1 Authentication Middleware**

Create consistent authentication middleware:

```python
# backend/auth_middleware.py
from fastapi import Depends, HTTPException
from backend.database import get_db
from backend.auth import get_current_user

def require_auth(db: Session = Depends(get_db)):
    """Require authentication for endpoint."""
    user = get_current_user(db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
```

**4.2 Authorization Levels**

- **Public**: No authentication required (health checks, public APIs)
- **Authenticated**: User must be logged in
- **MFA Required**: Sensitive operations require MFA
- **Admin**: Admin-only endpoints

**4.3 RLS Policy Coverage**

Ensure all tables have RLS policies:

```sql
-- Check RLS coverage
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;  -- Should be empty
```

**4.4 Access Control Testing**

- Test unauthenticated access (should fail)
- Test user accessing other user's data (should fail)
- Test admin access (should succeed)

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Integrate `logging_helpers.py` into existing code
- [ ] Add PII scrubbing to all log messages
- [ ] Standardize error handling with `error_handling_helpers.py`
- [ ] Add configuration validation to startup

### Phase 2: Monitoring (Week 3-4)

- [ ] Enhance health check endpoint with detailed metrics
- [ ] Set up alerting for critical metrics
- [ ] Create monitoring dashboards
- [ ] Implement structured event logging

### Phase 3: Access Control (Week 5-6)

- [ ] Audit all API routes for authentication
- [ ] Create authentication middleware
- [ ] Verify RLS policy coverage
- [ ] Add access control tests

### Phase 4: Feature Flags (Week 7-8)

- [ ] Migrate existing features to feature flags
- [ ] Document feature flag usage
- [ ] Create feature flag management UI (optional)
- [ ] Implement gradual rollout process

---

## Guardrail Checklist

Use this checklist when adding new features:

- [ ] **Feature Flag**: Is the feature behind a feature flag?
- [ ] **Logging**: Are events logged with structured logging?
- [ ] **PII**: Is PII scrubbed from logs?
- [ ] **Error Handling**: Are errors handled gracefully?
- [ ] **Authentication**: Is authentication required?
- [ ] **Authorization**: Is authorization checked?
- [ ] **Input Validation**: Are inputs validated?
- [ ] **Monitoring**: Are metrics emitted?
- [ ] **Testing**: Are tests written?

---

## Tools & Utilities

### Helper Modules

- `/backend/logging_helpers.py` - Structured logging with PII scrubbing
- `/backend/error_handling_helpers.py` - User-friendly error handling
- `/backend/config_helpers.py` - Configuration validation

### Scripts

- `npm run security:check` - Security audit
- `npm run verify:rls` - RLS policy verification
- `npm run audit:secrets` - Secret scanning

### Documentation

- `/docs/SECURITY_CHECKLIST.md` - Security controls
- `/docs/OPERATIONS_RUNBOOK.md` - Operational procedures
- `/docs/RISK_REGISTER.md` - Risk management

---

## Best Practices

### Logging

1. **Always use structured logging** - Don't use string formatting
2. **Scrub PII** - Never log email addresses, user IDs, file paths
3. **Include context** - Add user_id, request_id, operation context
4. **Use appropriate levels** - DEBUG for dev, INFO for production

### Error Handling

1. **User-friendly messages** - Don't expose technical details
2. **Log technical details** - Log full error for debugging
3. **Handle gracefully** - Don't crash on expected errors
4. **Return appropriate status codes** - 400 for validation, 500 for server errors

### Feature Flags

1. **Default to disabled** - New features start disabled
2. **Gradual rollout** - 1% → 10% → 50% → 100%
3. **Monitor closely** - Watch error rates during rollout
4. **Keep kill-switch** - Always have emergency disable mechanism

### Access Control

1. **Fail secure** - Default to denying access
2. **Check authentication** - Verify user is authenticated
3. **Check authorization** - Verify user has permission
4. **Use RLS** - Database-level access control

---

## Change Log

- **2025-01-XX**: Initial guardrail system design created
