# Ops SLO & Runbook Seeds

**Generated:** 2024-12-19  
**Scope:** SLOs, health checks, observability, and incident response

## Draft SLOs (Service Level Objectives)

### API Availability

**Target:** 99.9% uptime (8.76 hours downtime/year)  
**Measurement:** `GET /health` returns 200  
**Error Budget:** 0.1% (52.56 minutes/year)

**Current Status:**
- Health check exists: `GET /health` (`backend/main.py:391`)
- Readiness check exists: `GET /health/readiness` (`backend/main.py:401`)
- Liveness check exists: `GET /health/liveness` (`backend/main.py:449`)

**Gaps:**
- No SLO tracking/monitoring
- No error budget tracking
- No alerting on SLO violations

### API Latency

**Target:** P95 < 200ms, P99 < 500ms  
**Measurement:** Endpoint response time  
**Error Budget:** 5% of requests exceed thresholds

**Current Status:**
- No latency tracking
- No performance monitoring

**Gaps:**
- No metrics collection
- No latency monitoring
- No performance alerts

### Data Consistency

**Target:** 99.99% consistency (eventual consistency acceptable)  
**Measurement:** Database replication lag < 100ms  
**Error Budget:** 0.01% (5.26 minutes/year)

**Current Status:**
- Single database instance (no replication)
- No replication lag monitoring

**Gaps:**
- No replication
- No consistency monitoring

## Health Check Endpoints

### Existing Health Checks

1. **`GET /health`** - Basic health check
   - **Location:** `backend/main.py:391`
   - **Status:** Returns `{"status": "healthy", "timestamp": "...", "version": "1.0.0"}`
   - **Use Case:** Load balancer health check

2. **`GET /health/readiness`** - Readiness check
   - **Location:** `backend/main.py:401`
   - **Status:** Checks database, Redis, connection pool
   - **Use Case:** Kubernetes readiness probe

3. **`GET /health/liveness`** - Liveness check
   - **Location:** `backend/main.py:449`
   - **Status:** Returns `{"status": "alive", "timestamp": "..."}`
   - **Use Case:** Kubernetes liveness probe

4. **`GET /health/migrations`** - Migration status
   - **Location:** `backend/main.py:458`
   - **Status:** ✅ Exists
   - **Use Case:** Check schema consistency

### Proposed Health Checks

5. **`GET /health/detailed`** - Detailed health check
   - **Content:** All component status (DB, Redis, cache, rate limiter)
   - **Effort:** S (1 hour)

6. **`GET /health/metrics`** - Prometheus metrics
   - **Content:** Prometheus-compatible metrics
   - **Effort:** M (2-3 hours)

## Log/Metric/Tracing Points

### Current Logging

**Location:** `backend/logging_config.py`

**Logged:**
- Application logs (INFO, WARNING, ERROR)
- Error tracking (Sentry integration)
- Audit logs (`backend/audit.py`)

**Gaps:**
- No structured logging (JSON)
- No log aggregation
- No distributed tracing

### Proposed Metrics

1. **Request Metrics**
   - Request count (by endpoint, method, status)
   - Request latency (P50, P95, P99)
   - Error rate (by endpoint)

2. **Database Metrics**
   - Connection pool utilization
   - Query latency
   - Transaction count

3. **Cache Metrics**
   - Cache hit rate
   - Cache miss rate
   - Cache size

4. **Rate Limiting Metrics**
   - Rate limit hits
   - Rate limit bypasses

### Proposed Tracing

1. **Distributed Tracing** - OpenTelemetry
   - Trace requests across services
   - Identify bottlenecks
   - Debug slow requests

## Oncall Quick-Wins

### Common Incidents

1. **Database Connection Pool Exhausted**
   - **Symptoms:** 500 errors, slow responses
   - **Diagnosis:** Check `/health/readiness` → database_pool status
   - **Fix:** Restart app, increase pool size, check for connection leaks
   - **Prevention:** Add pool monitoring, circuit breaker

2. **Migration Drift**
   - **Symptoms:** Database errors, schema mismatch
   - **Diagnosis:** Check `/health/migrations` → status
   - **Fix:** Run `alembic upgrade head`
   - **Prevention:** Migration check in CI/CD

3. **Rate Limiting Issues**
   - **Symptoms:** 429 errors, legitimate users blocked
   - **Diagnosis:** Check rate limit configuration
   - **Fix:** Adjust rate limits, check Redis availability
   - **Prevention:** Redis-backed rate limiting

4. **Redis Unavailable**
   - **Symptoms:** Cache misses, performance degradation
   - **Diagnosis:** Check `/health/readiness` → redis status
   - **Fix:** Restart Redis, check network
   - **Prevention:** Health check + alerting

5. **SECRET_KEY Issues**
   - **Symptoms:** JWT validation failures, 401 errors
   - **Diagnosis:** Check SECRET_KEY consistency across instances
   - **Fix:** Ensure SECRET_KEY same across all instances
   - **Prevention:** Centralized secret management

## Runbook Skeleton

### Incident Response

1. **Identify Issue**
   - Check health endpoints
   - Check logs (Sentry, application logs)
   - Check metrics (if available)

2. **Diagnose Root Cause**
   - Review error messages
   - Check database status
   - Check Redis status
   - Check configuration

3. **Apply Fix**
   - Follow runbook for specific incident
   - Document fix
   - Verify resolution

4. **Post-Incident**
   - Root cause analysis
   - Update runbook
   - Prevent recurrence

### Top 3 User Journeys

1. **User Registration**
   - **Path:** `POST /api/auth/register` → Email verification
   - **Failure Points:** Database write, email service
   - **Runbook:** Check database, check email service, resend verification

2. **Event Creation**
   - **Path:** `POST /api/events` → Database write → Pattern analysis
   - **Failure Points:** Database write, pattern analysis
   - **Runbook:** Check database, check pattern analysis service

3. **Workflow Execution**
   - **Path:** `POST /api/workflows/{id}/execute` → Execute steps
   - **Failure Points:** Workflow execution, external API calls
   - **Runbook:** Check workflow status, check external APIs, retry execution

## Flaky CI Checklist

### CI Job Graph

**Location:** `.github/workflows/ci.yml`

**Jobs:**
1. `backend-tests` - Python tests, linting
2. `frontend-tests` - JavaScript tests, linting
3. `security-scan` - CodeQL, SBOM generation
4. `performance-tests` - k6 load tests
5. `e2e-tests` - Playwright tests

**Dependencies:**
- `backend-tests` → `security-scan`
- `frontend-tests` → `security-scan`
- `performance-tests` → `backend-tests`
- `e2e-tests` → `backend-tests`, `frontend-tests`

### Potential Flaky Steps

1. **Database Setup** - Postgres service health check
   - **Location:** `.github/workflows/ci.yml:12-25`
   - **Risk:** Medium - Service startup timing
   - **Fix:** Add retry logic, increase timeout

2. **Backend Startup** - Backend service startup
   - **Location:** `.github/workflows/ci.yml:262-268`
   - **Risk:** Medium - Port binding, startup timing
   - **Fix:** Add retry logic, increase timeout

3. **Frontend Build** - Next.js build
   - **Location:** `.github/workflows/ci.yml:270-277`
   - **Risk:** Low - Usually stable
   - **Fix:** Cache dependencies

### Cache Misses

1. **Python Dependencies** - `pip cache`
   - **Location:** `.github/workflows/ci.yml:34`
   - **Status:** ✅ Cached
   - **Risk:** Low

2. **Node Dependencies** - `npm cache`
   - **Location:** `.github/workflows/ci.yml:72`
   - **Status:** ✅ Cached
   - **Risk:** Low

## Recommendations

### Immediate (Week 1)
1. **Add detailed health check** - All component status
2. **Add metrics collection** - Request metrics, latency
3. **Create runbook** - Common incidents, troubleshooting

### Short-term (Week 2-3)
4. **Add distributed tracing** - OpenTelemetry
5. **Add SLO tracking** - Error budget monitoring
6. **Add alerting** - SLO violations, health check failures

### Medium-term (Week 3-4)
7. **Add log aggregation** - Centralized logging
8. **Add performance monitoring** - APM tool
9. **Improve CI reliability** - Retry logic, better error handling

See `docs/audit/PR_PLAN_GUARDRAILS.md` for health check implementation details.
