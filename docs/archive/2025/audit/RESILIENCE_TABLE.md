> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Resilience Table: Failure Propagation Matrix

**Generated:** 2024-12-19  
**Scope:** Component-by-component failure analysis with blast radius and guardrails

## Failure Propagation Matrix

| Component | Failure Mode | Blast Radius | Current Guardrail | Proposed Guardrail | Effort | Priority |
|-----------|--------------|--------------|-------------------|-------------------|--------|----------|
| **Database** | Connection pool exhausted | Entire API (all endpoints return 500) | None (pool_size=10, max_overflow=20) | Circuit breaker + pool monitoring + graceful degradation | M (4-6h) | P0 |
| **Database** | Migration drift | Schema mismatch errors | Warning in dev, fails in prod (`main.py:71-103`) | Health check endpoint + alerting | S (30m) | P1 |
| **Database** | Connection timeout | All DB operations fail | `pool_pre_ping=True` (`database.py:23`) | Circuit breaker + retry with backoff | M (3h) | P1 |
| **JWT Auth** | SECRET_KEY default/compromised | Token forgery, unauthorized access | Warning in dev (`config.py:76-81`) | Fail startup in production | S (15m) | P0 |
| **JWT Auth** | Token expiry | User session expired | Token expiry check (`main.py:372`) | Refresh token mechanism (exists but can be improved) | S (30m) | P2 |
| **CORS** | Permissive origins (`["*"]`) | CSRF attacks | Warning in prod (`config.py:84-88`) | Fail startup in production | S (30m) | P0 |
| **Rate Limiting** | Redis unavailable | In-memory fallback (per-instance) | Fallback to in-memory (`rate_limit.py`) | Redis health check + alert; document limitation | S (1h) | P1 |
| **Rate Limiting** | Per-instance storage | DDoS bypass with multiple instances | slowapi in-memory (`rate_limit.py:12`) | Redis-backed global rate limiting | M (4h) | P1 |
| **Cache** | Redis unavailable | Cache misses, performance degradation | In-memory fallback (`cache.py:28-43`) | Health check + alert; document strategy | S (1h) | P1 |
| **Cache** | Cache stampede | Database overload | No protection | Cache warming + TTL jitter | M (2h) | P2 |
| **WebSocket** | Connection manager in-memory | Connections lost on restart | In-memory ConnectionManager (`main.py:214-233`) | Redis pub/sub for broadcasting | M (1-2d) | P2 |
| **WebSocket** | WebSocket disconnect | User loses real-time updates | try/except WebSocketDisconnect (`main.py:2291`) | Reconnection logic + exponential backoff | M (3h) | P2 |
| **Batch Processing** | Transaction failure | All events in batch lost | No retry (`batch_processor.py:39`) | Dead letter queue + retry with backoff | M (4-6h) | P2 |
| **Batch Processing** | Large batch timeout | Partial failure, inconsistent state | Single transaction (`batch_processor.py:39`) | Chunking + partial success handling | M (2h) | P2 |
| **Workflow Scheduler** | No executor process | Scheduled workflows never run | None (logic exists, no runner) | Celery worker or document manual execution | L (2-3d) | P2 |
| **Workflow Execution** | Workflow step failure | Execution stuck in "running" | try/except in execute_workflow (`workflow_scheduler.py:161-164`) | Timeout + retry logic + step-level rollback | M (4h) | P2 |
| **Integration Connectors** | API key expired | Integration fails | No automatic refresh | OAuth refresh token flow + alerting | M (1d) | P2 |
| **Integration Connectors** | Unencrypted credentials | Database compromise exposes keys | None (`database/models.py:328`) | Encrypt sensitive fields before storage | M (1-2d) | P1 |
| **File Upload** | Disk full | Uploads fail | No disk space check (`main.py:930-970`) | Disk space monitoring + quota enforcement | S (1h) | P2 |
| **Audit Logging** | Audit log write failure | Audit trail incomplete | No error handling (`audit.py`) | Async logging + dead letter queue | M (2h) | P2 |
| **Health Checks** | Readiness check failure | Load balancer marks unhealthy | DB check + Redis check (`main.py:401-446`) | More granular checks + circuit breaker status | S (1h) | P1 |

## Critical Path Analysis

### User-Facing Critical Paths (No Fallback)

1. **User Registration → Email Verification**
   - **Path:** `POST /api/auth/register` → Generate token → Email (stub)
   - **Failure Points:** Database write, token generation, email service
   - **Current Fallback:** None (token logged in dev only)
   - **Impact:** User cannot verify email
   - **Proposed:** Email service circuit breaker + retry + fallback queue

2. **Event Creation → Pattern Analysis**
   - **Path:** `POST /api/events` → DB write → WebSocket broadcast → Pattern analysis (async?)
   - **Failure Points:** DB write, WebSocket connection, pattern analysis
   - **Current Fallback:** Event saved even if pattern analysis fails
   - **Impact:** Patterns not updated, suggestions stale
   - **Proposed:** Async pattern analysis + retry + DLQ

3. **Workflow Execution → Integration Call**
   - **Path:** `POST /api/workflows/{id}/execute` → Execute steps → Call external API
   - **Failure Points:** Workflow execution, external API call, timeout
   - **Current Fallback:** Execution marked as "failed" (`workflow_scheduler.py:161-164`)
   - **Impact:** Workflow partially executed, inconsistent state
   - **Proposed:** Step-level rollback + retry + timeout

### Operations Critical Paths

1. **Database Migration → Startup**
   - **Path:** `alembic upgrade head` → Check migration status → Start app
   - **Failure Points:** Migration failure, migration check failure
   - **Current Fallback:** Fails in production (`main.py:93-98`)
   - **Impact:** App won't start if migrations out of sync
   - **Proposed:** Migration status check + alerting + manual override flag

2. **Health Check → Load Balancer**
   - **Path:** `/health/readiness` → DB check → Redis check → Return status
   - **Failure Points:** DB connection, Redis connection
   - **Current Fallback:** Returns 503 if DB fails (`main.py:413-416`)
   - **Impact:** Load balancer marks unhealthy, requests routed away
   - **Proposed:** More granular health checks + circuit breaker status

## Failure Mode: API Outage

### Scenario: Database connection pool exhausted

**Trigger:** High load, connection leaks, or slow queries  
**Propagation:**
1. Connection pool exhausted (`database.py:22-28`)
2. `get_db()` generator fails to yield session
3. All endpoints requiring DB return 500
4. Health check fails (`/health/readiness`)
5. Load balancer marks unhealthy

**Current Mitigation:** None  
**Proposed Mitigation:**
- Circuit breaker on DB operations (`circuit_breaker.py` exists, wire it)
- Connection pool monitoring (`database.py:31-40` exists, add to health check)
- Graceful degradation (cache-only responses where possible)
- Alerting when pool utilization > 80%

**Effort:** M (4-6 hours)  
**Priority:** P0

## Failure Mode: Auth/Token Expiry

### Scenario: JWT token expires during request

**Trigger:** Long-running request, token expiry  
**Propagation:**
1. Token expires mid-request
2. `get_current_user()` raises 401 (`main.py:361-382`)
3. Request fails with 401
4. User must re-authenticate

**Current Mitigation:** Refresh token mechanism exists (`main.py:628-688`)  
**Proposed Mitigation:**
- Automatic token refresh on 401
- Extend token expiry for long-running requests
- Token refresh endpoint with rate limiting

**Effort:** S (30 minutes)  
**Priority:** P2

## Failure Mode: Schema Mismatch

### Scenario: Database schema out of sync with code

**Trigger:** Migration not applied, manual DB changes  
**Propagation:**
1. Alembic migration check fails (`main.py:71-103`)
2. App fails to start in production
3. Service unavailable

**Current Mitigation:** Warning in dev, fails in prod  
**Proposed Mitigation:**
- Health check endpoint for migration status (`/health/migrations` exists)
- Alerting on migration drift
- Migration status dashboard

**Effort:** S (30 minutes)  
**Priority:** P1

## Failure Mode: Queue Backlog

### Scenario: Batch event processing backlog

**Trigger:** High event volume, slow processing  
**Propagation:**
1. Event batch queue grows (`POST /api/events/batch`)
2. Database writes slow down
3. Connection pool exhausted
4. New events rejected

**Current Mitigation:** None (no queue, direct DB writes)  
**Proposed Mitigation:**
- Async queue (Celery/RQ) for batch processing
- Dead letter queue for failed batches
- Backpressure (reject new events if queue > threshold)
- Monitoring + alerting

**Effort:** M (1-2 days)  
**Priority:** P2

## Failure Mode: Rate-Limit Bypass

### Scenario: DDoS attack with multiple instances

**Trigger:** Attacker uses multiple IPs, load balancer distributes requests  
**Propagation:**
1. Rate limiting per-instance (`rate_limit.py:12`)
2. Each instance tracks rate limit independently
3. Attacker bypasses rate limit by hitting different instances
4. Server overload

**Current Mitigation:** Per-instance rate limiting (slowapi)  
**Proposed Mitigation:**
- Redis-backed global rate limiting
- IP-based rate limiting + distributed tracking
- DDoS protection (Cloudflare/WAF)

**Effort:** M (4 hours)  
**Priority:** P1

## Minimal Guardrails (Proposed)

### Phase 1: Critical (Week 1)
1. **SECRET_KEY validation** - Fail startup in production
   - File: `backend/config.py:71-81`
   - Effort: S (15 minutes)

2. **CORS validation** - Fail startup in production
   - File: `backend/config.py:83-88`
   - Effort: S (30 minutes)

### Phase 2: Resilience (Week 2-3)
3. **Connection pool monitoring** - Add to health check
   - File: `backend/main.py:431-439`, `backend/database.py:31-40`
   - Effort: S (1 hour)

4. **Circuit breaker** - Wire into database operations
   - File: `backend/database.py`, `backend/circuit_breaker.py`
   - Effort: M (3 hours)

5. **Redis-backed rate limiting** - Global protection
   - File: `backend/rate_limit.py`
   - Effort: M (4 hours)

### Phase 3: Operations (Week 3-4)
6. **Dead letter queue** - Batch processing retry
   - File: `backend/batch_processor.py`
   - Effort: M (4-6 hours)

7. **Workflow executor** - Celery worker
   - File: `backend/celery_app.py` (new), `docker-compose.yml`
   - Effort: L (2-3 days)

## Guardrail Implementation Priority

| Guardrail | Impact | Effort | Priority | Dependencies |
|-----------|--------|--------|----------|--------------|
| SECRET_KEY validation | Critical | S (15m) | P0 | None |
| CORS validation | Critical | S (30m) | P0 | None |
| Connection pool monitoring | High | S (1h) | P0 | None |
| Circuit breaker | High | M (3h) | P0 | Pool monitoring |
| Redis rate limiting | High | M (4h) | P1 | Redis available |
| DLQ for batches | Medium | M (4-6h) | P2 | Redis/Celery |
| Workflow executor | Medium | L (2-3d) | P2 | Redis/Celery |

## Summary

**Total Critical Guardrails Missing:** 5  
**Total High-Priority Guardrails:** 3  
**Total Medium-Priority Guardrails:** 4  

**Estimated Effort:** 
- Phase 1 (Critical): 1 hour
- Phase 2 (Resilience): 1-2 days
- Phase 3 (Operations): 1-2 weeks

**Risk Reduction:** 
- Phase 1: Eliminates 2 critical security risks
- Phase 2: Reduces blast radius of DB/rate limiting failures
- Phase 3: Adds retry/queue mechanisms for reliability

See `docs/audit/PR_PLAN_GUARDRAILS.md` for implementation details.
