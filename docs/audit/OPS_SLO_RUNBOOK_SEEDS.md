# Operations: SLO, Observability & Runbook Seeds

## Draft SLOs (Service Level Objectives)

### API Availability

**SLO:** 99.9% uptime (8.76 hours downtime/year)
**SLA:** 99.5% uptime (43.8 hours downtime/year)

**Measurement:**
- Health check endpoint: `/health`
- Readiness check: `/health/readiness`
- Liveness check: `/health/liveness`

**Error Budget:** 0.1% (52.56 minutes/month)

**Current State:**
- Health checks exist ✓
- No SLO monitoring implemented
- **Proposed:** Add SLO monitoring (Prometheus + Grafana)

### API Latency

**SLO:** 95th percentile latency < 200ms
**SLA:** 99th percentile latency < 500ms

**Measurement:**
- Endpoint response times
- Database query times
- Cache hit rates

**Error Budget:** 5% of requests can exceed 200ms

**Current State:**
- No latency monitoring
- **Proposed:** Add APM (Application Performance Monitoring)

### API Error Rate

**SLO:** Error rate < 0.1% (1 in 1000 requests)
**SLA:** Error rate < 0.5% (1 in 200 requests)

**Measurement:**
- 4xx/5xx response codes
- Exception rates
- Database errors

**Error Budget:** 0.1% of requests can fail

**Current State:**
- Sentry configured for error tracking
- **Proposed:** Add error rate monitoring

### Database Performance

**SLO:** Database query time < 100ms (95th percentile)
**SLA:** Database query time < 500ms (99th percentile)

**Measurement:**
- Query execution times
- Connection pool utilization
- Slow query log

**Error Budget:** 5% of queries can exceed 100ms

**Current State:**
- No database monitoring
- **Proposed:** Add database performance monitoring

## Health Check Endpoints

### Current Implementation

**Files:** `backend/main.py:346-383`

1. **`/health`** - Basic health check
   - Returns: `{"status": "healthy", "timestamp": "...", "version": "1.0.0"}`
   - **Status:** ✓ Implemented

2. **`/health/readiness`** - Readiness check
   - Checks: Database connectivity
   - Returns: `{"status": "ready", "checks": {"database": "ok"}}`
   - **Status:** ✓ Implemented (checks database only)

3. **`/health/liveness`** - Liveness check
   - Returns: `{"status": "alive", "timestamp": "..."}`
   - **Status:** ✓ Implemented

### Proposed Enhancements

**Add to `/health/readiness`:**
- Redis connectivity (if Redis configured)
- Database connection pool status
- Migration status (pending migrations)

**Add to `/health`:**
- Component status (database, cache, etc.)
- Uptime metrics
- Version information

**Example Enhanced Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "components": {
    "database": "ok",
    "cache": "ok",
    "redis": "ok"
  },
  "uptime_seconds": 3600
}
```

## Metrics, Logs & Tracing Points

### Current Observability

**Logging:**
- Structured logging (JSON) - `backend/logging_config.py`
- Sentry error tracking - `backend/sentry_config.py`
- **Missing:** Metrics, tracing

### Proposed Metrics

**Application Metrics:**
- Request count (per endpoint)
- Request latency (per endpoint)
- Error rate (per endpoint)
- Authentication failures
- Rate limit hits

**Database Metrics:**
- Connection pool size/utilization
- Query execution time
- Slow queries
- Transaction count

**Cache Metrics:**
- Cache hit rate
- Cache miss rate
- Cache eviction rate
- Redis connection status

**System Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

**Proposed Tools:**
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Jaeger** - Distributed tracing
- **ELK Stack** - Log aggregation

### Logging Points

**Current Logging:**
- Email verification tokens (dev only) - **Remove in production**
- Password reset tokens (dev only) - **Remove in production**
- Error logs via Sentry
- **Missing:** Request logging, audit logging (partially implemented)

**Proposed Logging:**
- Request/response logging (with PII redaction)
- Authentication events
- Authorization failures
- Data access events
- Configuration changes

**Files to Modify:**
- `backend/logging_config.py` - Add request logging middleware
- `backend/main.py` - Remove token logging in production

### Tracing Points

**Current State:** No tracing implemented

**Proposed Tracing:**
- HTTP request/response
- Database queries
- Cache operations
- External API calls (integrations)
- Workflow execution

**Proposed Tool:** OpenTelemetry + Jaeger

## Runbook Seeds

### 1. Deployment

**File:** `docs/RUNBOOK.md` (new)

**Deployment Steps:**
1. Run database migrations (`alembic upgrade head`)
2. Check migration status
3. Verify environment variables
4. Build Docker images
5. Deploy backend service
6. Deploy frontend service
7. Verify health checks
8. Run smoke tests

**Rollback Steps:**
1. Identify previous version
2. Rollback database migrations (if needed)
3. Deploy previous Docker images
4. Verify health checks
5. Monitor error rates

### 2. Database Migration

**File:** `docs/RUNBOOK.md` (new)

**Migration Steps:**
1. Backup database
2. Run migrations in staging
3. Verify migration success
4. Run migrations in production
5. Verify schema changes
6. Monitor for errors

**Rollback Steps:**
1. Identify migration to rollback
2. Run `alembic downgrade -1`
3. Verify rollback success
4. Monitor for errors

### 3. Incident Response

**File:** `docs/RUNBOOK.md` (new)

**Incident Types:**
1. **API Unavailable**
   - Check health endpoints
   - Check database connectivity
   - Check Redis connectivity
   - Check process status
   - Check logs for errors

2. **Database Issues**
   - Check connection pool status
   - Check slow queries
   - Check database logs
   - Check disk space
   - Check replication status (if applicable)

3. **High Error Rate**
   - Check Sentry for errors
   - Check logs for patterns
   - Check rate limiting
   - Check database performance
   - Check external dependencies

4. **Security Incident**
   - Check audit logs
   - Check for unauthorized access
   - Rotate secrets (SECRET_KEY, etc.)
   - Notify security team
   - Document incident

### 4. Monitoring Setup

**File:** `docs/RUNBOOK.md` (new)

**Monitoring Components:**
1. **Health Checks**
   - Configure `/health` endpoint monitoring
   - Configure `/health/readiness` endpoint monitoring
   - Configure `/health/liveness` endpoint monitoring
   - Set up alerts for failures

2. **Metrics Collection**
   - Set up Prometheus
   - Configure metric exporters
   - Set up Grafana dashboards
   - Configure alerts

3. **Log Aggregation**
   - Set up ELK Stack or similar
   - Configure log shipping
   - Set up log retention policies
   - Configure log search

4. **Error Tracking**
   - Configure Sentry
   - Set up error alerts
   - Configure error grouping
   - Set up error notifications

## Oncall Quick-Wins

### 1. Health Check Monitoring

**Setup:**
- Monitor `/health` endpoint (every 30 seconds)
- Alert on failures
- **Effort:** S (1 hour)

### 2. Error Rate Monitoring

**Setup:**
- Monitor 5xx error rate
- Alert if error rate > 0.5%
- **Effort:** S (1 hour)

### 3. Database Connection Pool Monitoring

**Setup:**
- Monitor connection pool utilization
- Alert if pool > 80% utilized
- **Effort:** M (4 hours)

### 4. Slow Query Detection

**Setup:**
- Enable slow query log
- Alert on queries > 1 second
- **Effort:** M (4 hours)

### 5. Cache Hit Rate Monitoring

**Setup:**
- Monitor Redis cache hit rate
- Alert if hit rate < 80%
- **Effort:** M (4 hours)

## Flaky CI Checklist

### Current CI Jobs

**File:** `.github/workflows/ci.yml`

**Jobs:**
1. **backend-tests** - Backend unit tests
2. **frontend-tests** - Frontend unit tests
3. **security-scan** - Security scanning
4. **performance-tests** - Performance testing
5. **e2e-tests** - End-to-end tests

### Potential Flaky Tests

**Issues Found:**
1. **Database Tests** - May fail if database not ready
   - **Mitigation:** Health check wait already implemented ✓

2. **Performance Tests** - May fail if system under load
   - **Mitigation:** Baseline checks implemented ✓

3. **E2E Tests** - May fail if services not ready
   - **Mitigation:** Wait for services implemented ✓

4. **Security Scan** - May fail if dependencies have issues
   - **Mitigation:** SBOM generation implemented ✓

### CI Improvement Recommendations

1. **Add Retry Logic** - Retry flaky tests 3 times
2. **Add Test Timeouts** - Prevent tests from hanging
3. **Add Test Isolation** - Ensure tests don't interfere
4. **Add Parallel Execution** - Speed up test runs
5. **Add Test Caching** - Cache test dependencies

## Observability Gaps

### Missing Components

1. **Metrics Collection** - No Prometheus/metrics
2. **Distributed Tracing** - No tracing implementation
3. **Log Aggregation** - No centralized logging
4. **APM** - No application performance monitoring
5. **Alerting** - No alerting system

### Proposed Observability Stack

**Metrics:** Prometheus + Grafana
**Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
**Tracing:** Jaeger + OpenTelemetry
**APM:** Sentry (already configured) + New Relic/Datadog
**Alerting:** PagerDuty + Slack

## SLO Monitoring Implementation

### Phase 1: Basic Monitoring (Week 1)
- Set up health check monitoring
- Set up error rate monitoring
- Set up basic alerts

### Phase 2: Metrics Collection (Week 2)
- Set up Prometheus
- Configure metric exporters
- Set up Grafana dashboards

### Phase 3: Advanced Observability (Week 3-4)
- Set up distributed tracing
- Set up log aggregation
- Set up APM
- Set up comprehensive alerting
