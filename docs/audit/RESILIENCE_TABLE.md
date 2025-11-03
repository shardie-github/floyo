# Resilience & Failure Propagation Matrix

## Component Failure Mode Analysis

| Component | Failure Mode | Blast Radius | Current Guardrail | Proposed Guardrail | Effort | Priority |
|-----------|--------------|--------------|-------------------|-------------------|--------|----------|
| **PostgreSQL Database** | Connection pool exhausted | All API requests | `pool_pre_ping=True`, pool_size=10 | Circuit breaker, pool metrics, graceful degradation | M | P0 |
| **PostgreSQL Database** | Database unavailable | All API requests | Health check endpoint | Read replica, failover, retry with backoff | L | P1 |
| **PostgreSQL Database** | Schema migration failure | API startup | Alembic migrations | Startup migration check, rollback plan | S | P0 |
| **JWT Secret Key** | Missing or rotated | All authenticated requests | Hardcoded default | Require env var, key rotation with grace period | S | P0 |
| **Redis Cache** | Unavailable | Performance degradation | In-memory fallback | Health check, require Redis in prod, document fallback | S | P1 |
| **Rate Limiting** | In-memory (per-instance) | DDoS protection ineffective | `slowapi` with `get_remote_address` | Redis-backed rate limiting | M | P1 |
| **WebSocket Manager** | Process-local state | Real-time features broken | None | Redis pub/sub for message distribution | L | P2 |
| **Workflow Scheduler** | No runner process | Scheduled workflows never run | Manual execution only | Celery worker or cron job | L | P2 |
| **File Uploads** | Container restart | Files lost | Local storage only | S3/cloud storage, volume persistence | M | P2 |
| **CORS Configuration** | Permissive origins | CSRF attacks | `allow_origins=["*"]` | Env var validation, fail in prod | S | P0 |
| **Sentry Monitoring** | DSN missing | No error tracking | Optional | Document as required in prod | S | P1 |
| **Batch Event Processing** | Processing failure | Event data loss | `process_event_batch()` | Dead letter queue, retry logic | M | P1 |
| **API Authentication** | Token expiry | User session lost | 30min access token | Refresh token mechanism exists | - | - |
| **Database Queries** | N+1 queries | Performance degradation | None | Query optimization, eager loading | M | P1 |
| **Email Verification** | Email service down | Users can't verify | Logs token (dev only) | Email service integration, retry | M | P2 |
| **Password Reset** | Token expiry | Reset link invalid | 1-hour expiry | Clear error messages, resend | S | P2 |

## Failure Propagation Matrix

### Scenario 1: Database Connection Pool Exhausted
```
Database Pool Exhausted
  → All API requests fail (500 errors)
  → Frontend shows error messages
  → Users cannot access any data
  → No graceful degradation
  → Cache may serve stale data (if available)
```

**Mitigation Chain:**
1. Circuit breaker opens after threshold
2. Return cached data if available
3. Return 503 with retry-after header
4. Log pool exhaustion metrics

### Scenario 2: JWT Secret Key Rotation
```
Secret Key Changes
  → All existing tokens invalid
  → Users logged out
  → Refresh tokens also invalid
  → Users must re-authenticate
```

**Mitigation Chain:**
1. Support old + new key during grace period
2. Accept tokens signed with either key
3. Issue new tokens with new key
4. Deprecate old key after grace period

### Scenario 3: Redis Unavailable
```
Redis Unavailable
  → Cache falls back to in-memory
  → Cache lost on restart
  → Rate limiting per-instance (not global)
  → Performance degradation
```

**Mitigation Chain:**
1. Detect Redis unavailability
2. Log warning
3. Fallback to in-memory cache
4. Degrade gracefully (slower responses)

### Scenario 4: Rate Limiting Bypass (Multi-Instance)
```
Rate Limiting Per-Instance
  → Attacker hits multiple instances
  → Each instance has separate limit
  → Global limit effectively multiplied
  → DDoS protection ineffective
```

**Mitigation Chain:**
1. Use Redis-backed rate limiting
2. Shared state across instances
3. Global rate limit enforcement

### Scenario 5: Workflow Scheduler Not Running
```
No Cron Runner
  → Scheduled workflows never execute
  → Users expect automation
  → Manual execution only
  → No error notification
```

**Mitigation Chain:**
1. Add Celery worker process
2. Or document manual execution requirement
3. Add workflow execution status monitoring
4. Alert on missed executions

### Scenario 6: File Upload Storage Lost
```
Container Restart
  → Local file storage lost
  → User-uploaded files gone
  → No backup
  → Data loss
```

**Mitigation Chain:**
1. Use persistent volume in docker-compose
2. Or use S3/cloud storage
3. Add backup strategy
4. Document retention policy

## Critical Path Analysis

### User Registration Flow
```
Frontend → POST /api/auth/register
  → Backend validates email/username
  → Database insert (users table)
  → Generate verification token
  → [SPOF] Email service (logs token in dev)
  → Return user object
```
**Fallback:** None - registration fails if DB unavailable

### Event Tracking Flow
```
CLI/File Watcher → POST /api/events
  → JWT validation
  → Database insert (events table)
  → Batch processing (optional)
  → Pattern analysis (async)
  → WebSocket broadcast (optional)
```
**Fallback:** Events can be queued, but no queue implemented

### Pattern Analysis Flow
```
Event Creation → Pattern Analysis
  → Query events from database
  → Aggregate patterns
  → Store patterns (patterns table)
  → Generate suggestions (async)
```
**Fallback:** None - analysis fails if DB unavailable

### Workflow Execution Flow
```
Cron Trigger → Workflow Scheduler
  → [SPOF] No cron runner process
  → Manual execution only
  → Execute workflow steps
  → Integration connectors
  → Audit logging
```
**Fallback:** Manual execution available, but no automation

## Guardrail Implementation Priority

### P0 (Critical - Implement First)
1. **SECRET_KEY validation** - Fail startup if missing/default in prod
2. **CORS validation** - Fail startup if `allow_origins=["*"]` in prod
3. **Migration status check** - Fail startup if pending migrations
4. **Database pool circuit breaker** - Prevent cascade failures

### P1 (High - Implement Soon)
1. **Redis health check** - Document in-memory as dev-only
2. **Redis-backed rate limiting** - Global protection
3. **Query optimization** - Prevent N+1 queries
4. **Read replica support** - Database failover

### P2 (Medium - Implement When Needed)
1. **Celery worker** - Automated workflow execution
2. **S3 storage** - Persistent file uploads
3. **Redis pub/sub** - WebSocket distribution
4. **Dead letter queue** - Event processing resilience

## Proposed Minimal Guardrails

### 1. Database Connection Pool Guardrail
**File:** `backend/database.py`
```python
# Add pool monitoring
from sqlalchemy.pool import Pool
import logging

def check_pool_health():
    pool = engine.pool
    if pool.size() >= pool.maxsize():
        logger.warning("Connection pool near capacity")
        # Could raise exception or return 503
```

### 2. SECRET_KEY Validation Guardrail
**File:** `backend/main.py`
```python
# Fail startup if SECRET_KEY is default in production
if os.getenv("ENVIRONMENT") == "production":
    if SECRET_KEY == "your-secret-key-change-in-production":
        raise ValueError("SECRET_KEY must be set in production")
```

### 3. CORS Validation Guardrail
**File:** `backend/main.py`
```python
# Fail startup if CORS is permissive in production
if os.getenv("ENVIRONMENT") == "production":
    if "*" in app.state.cors_origins:
        raise ValueError("CORS allow_origins cannot be '*' in production")
```

### 4. Migration Status Check
**File:** `backend/main.py` (in `init_db()`)
```python
from alembic.config import Config
from alembic import script
from alembic.runtime import migration

def check_migrations():
    alembic_cfg = Config("alembic.ini")
    script_dir = script.ScriptDirectory.from_config(alembic_cfg)
    head = script_dir.get_current_head()
    # Check if migrations are up to date
    # Fail if pending migrations
```

### 5. Circuit Breaker Stub
**File:** `backend/database.py` (new function)
```python
from functools import wraps
import time

circuit_breaker_state = {"open": False, "failures": 0, "last_failure": None}

def circuit_breaker(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if circuit_breaker_state["open"]:
            # Check if should attempt reset
            if time.time() - circuit_breaker_state["last_failure"] > 60:
                circuit_breaker_state["open"] = False
                circuit_breaker_state["failures"] = 0
            else:
                raise Exception("Circuit breaker open - DB unavailable")
        try:
            result = func(*args, **kwargs)
            circuit_breaker_state["failures"] = 0
            return result
        except Exception as e:
            circuit_breaker_state["failures"] += 1
            circuit_breaker_state["last_failure"] = time.time()
            if circuit_breaker_state["failures"] >= 5:
                circuit_breaker_state["open"] = True
            raise
    return wrapper
```

## Idempotency Keys

**Current State:** No idempotency keys implemented

**Proposed:**
- Add `Idempotency-Key` header support
- Store in Redis with TTL (24 hours)
- Return cached response if key exists
- **Files to modify:** `backend/main.py` (add middleware)

## Dead Letter Queue (DLQ)

**Current State:** No DLQ for failed event processing

**Proposed:**
- Add `failed_events` table
- Store failed events with error details
- Retry logic with exponential backoff
- **Files to modify:** `backend/batch_processor.py`, `database/models.py`

## Feature Flags as Kill Switches

**Current State:** Feature flags exist but not integrated

**Proposed:**
- Integrate `backend/feature_flags.py` with route handlers
- Add feature flag checks for critical paths
- Use as kill switches for new features
- **Files to modify:** `backend/main.py`, `backend/feature_flags.py`
