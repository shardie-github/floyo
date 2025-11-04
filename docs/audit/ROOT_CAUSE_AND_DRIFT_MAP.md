# Root Cause & Architecture Drift Map

**Generated:** 2024-12-19  
**Scope:** Full codebase analysis with file-specific drift citations

## Current Architecture Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                    │
│  - React Components (app/, components/)                      │
│  - API Client (hooks/useApi.ts)                             │
│  - State: Zustand                                           │
│  - PWA Support (next-pwa)                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket (ws://)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (FastAPI 0.104+)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  main.py (2,298 lines - MONOLITHIC) ⚠️               │  │
│  │  - All 50+ routes (auth, events, patterns, etc.)     │  │
│  │  - WebSocket manager (ConnectionManager)             │  │
│  │  - Middleware (CORS, GZip, Security, Rate Limit)    │  │
│  │  - JWT auth (get_current_user)                       │  │
│  │  - Health checks (/health, /health/readiness)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supporting Modules (Good Separation):                 │  │
│  │  - database.py (SessionLocal, connection pool)        │  │
│  │  - cache.py (Redis/in-memory fallback)               │  │
│  │  - rate_limit.py (slowapi, per-instance) ⚠️         │  │
│  │  - circuit_breaker.py (exists, not wired) ⚠️        │  │
│  │  - audit.py (log_audit)                              │  │
│  │  - batch_processor.py (process_event_batch)         │  │
│  │  - workflow_scheduler.py (logic exists, no runner) ⚠️│  │
│  │  - connectors.py (integration management)            │  │
│  │  - organizations.py (multi-tenant)                    │  │
│  │  - feature_flags.py (models exist, not integrated) ⚠️│  │
│  │  - fraud_scoring.py (models exist, not integrated) ⚠️│  │
│  │  - experiments.py (models exist, not integrated) ⚠️ │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  api_v1.py (8 lines - EMPTY STUB) ⚠️                  │  │
│  │  DRIFT: Versioned API promised in docs, not used      │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQLAlchemy ORM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL 15)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  models.py (364 lines, 17 models) ✅                   │  │
│  │  - User, Event, Pattern, Suggestion, Workflow        │  │
│  │  - Organization, AuditLog, IntegrationConnector       │  │
│  │  - WorkflowVersion, WorkflowExecution                │  │
│  │  - FeatureFlag, Experiment, FraudScore (in migration) │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  schema.sql (178 lines - INCOMPLETE) ⚠️               │  │
│  │  DRIFT: Only 8/17 tables present                      │  │
│  │  DRIFT: RLS policies for Supabase (not used)         │  │
│  │  DRIFT: Missing: organizations, audit_logs, etc.      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  migrations/add_feature_flags_experiments_fraud.py     │  │
│  │  DRIFT: Migration exists but models not in models.py │  │
│  │  DRIFT: FeatureFlag models in feature_flags.py        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Alembic (alembic.ini) ✅                              │  │
│  │  - Migration check on startup (main.py:71-103)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         CI/CD (GitHub Actions) ✅                            │
│  - backend-tests (pytest, coverage)                         │
│  - frontend-tests (jest, playwright)                        │
│  - security-scan (CodeQL, SBOM)                             │
│  - performance-tests (k6)                                    │
│  - e2e-tests (playwright)                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         BACKGROUND JOBS (STUB ONLY) ⚠️                      │
│  - workflow_scheduler.py (cron logic exists)                │
│  - DRIFT: No Celery/worker process configured               │
│  - DRIFT: No scheduler running workflows automatically      │
└─────────────────────────────────────────────────────────────┘
```

## Module Dependency Graph

### Backend Module Dependencies
```
main.py
├── database.py (SessionLocal, get_db, engine)
├── config.py (settings)
├── cache.py (init_cache, get, set, delete)
├── rate_limit.py (limiter)
├── audit.py (log_audit)
├── batch_processor.py (process_event_batch)
├── organizations.py (create_organization, etc.)
├── workflow_scheduler.py (WorkflowScheduler)
├── connectors.py (initialize_connectors)
├── logging_config.py (setup_logging)
├── sentry_config.py (init_sentry)
└── database/models.py (all models)

database.py
└── config.py (settings)

cache.py
└── config.py (settings)

rate_limit.py
└── config.py (settings)

organizations.py
├── database/models.py (Organization, OrganizationMember)
└── audit.py (log_audit)

workflow_scheduler.py
├── database/models.py (Workflow, WorkflowExecution, WorkflowVersion)
└── audit.py (log_audit)

feature_flags.py
├── database/models.py (Base) [but defines its own models] ⚠️
└── DRIFT: Models not imported into main models.py
```

**Circular Dependencies:** None detected ✅

### Orphaned Components
1. **`backend/api_v1.py`** - Empty stub (8 lines), declared but not used
   - **Location:** `backend/api_v1.py:1-8`
   - **Fix:** Implement versioned routes or remove

2. **`backend/circuit_breaker.py`** - Circuit breaker exists but never imported/used
   - **Location:** `backend/circuit_breaker.py` (68 lines)
   - **Fix:** Wire into database.py or document as future enhancement

3. **`migrations/add_feature_flags_experiments_fraud.py`** - Migration exists but models partially defined
   - **Location:** `migrations/add_feature_flags_experiments_fraud.py`
   - **Fix:** Integrate FeatureFlag models from feature_flags.py into main models.py

## Implicit Contracts (Shared Assumptions)

### 1. Database Session Lifecycle
- **File:** `backend/database.py:51-60`, `backend/main.py:28`
- **Assumption:** `get_db()` generator always yields valid session; pool never exhausted
- **Reality:** No connection pool monitoring; pool exhaustion causes 500s
- **Risk:** High - Single point of failure
- **Evidence:** `backend/database.py:22-28` - pool_size=10, max_overflow=20, no monitoring
- **Fix:** Add pool status endpoint, circuit breaker, graceful degradation

### 2. JWT Secret Key Consistency
- **File:** `backend/main.py:62`, `backend/config.py:23`
- **Assumption:** SECRET_KEY same across all instances; token validation works
- **Reality:** Default hardcoded in .env.example; no validation in production
- **Risk:** Critical - Token forgery if default used
- **Evidence:** `backend/config.py:76-81` - validation exists but only warns in dev
- **Fix:** Fail startup in production if SECRET_KEY is default

### 3. CORS Origins Validation
- **File:** `backend/main.py:178-184`, `backend/config.py:33`
- **Assumption:** CORS_ORIGINS env var is always set to safe values
- **Reality:** No validation; `["*"]` allowed in dev
- **Risk:** High - CSRF attacks if deployed with permissive CORS
- **Evidence:** `backend/config.py:84-88` - validation exists but only warns
- **Fix:** Fail startup in production if CORS includes "*"

### 4. Cache Persistence
- **File:** `backend/cache.py:16-43`
- **Assumption:** Redis optional; in-memory fallback acceptable
- **Reality:** In-memory cache lost on restart; no persistence
- **Risk:** Medium - Cache misses after restart; rate limiting ineffective across instances
- **Evidence:** `backend/cache.py:62-73` - in-memory fallback without persistence
- **Fix:** Document cache strategy; add health check for Redis

### 5. Rate Limiting Per-Instance
- **File:** `backend/rate_limit.py:12`, `backend/main.py:206`
- **Assumption:** Rate limiting protects against abuse
- **Reality:** Per-instance storage (slowapi default); DDoS bypass with multiple instances
- **Risk:** High - Rate limiting ineffective across load balancer
- **Evidence:** `backend/rate_limit.py:12` - `Limiter(key_func=get_remote_address)` uses in-memory
- **Fix:** Use Redis-backed rate limiting for global protection

### 6. Workflow Execution
- **File:** `backend/workflow_scheduler.py:85-122`, `backend/main.py:55`
- **Assumption:** Workflows execute automatically based on schedule
- **Reality:** Cron logic exists but no worker process; workflows never auto-execute
- **Risk:** Medium - Feature not functional
- **Evidence:** `backend/workflow_scheduler.py:86-122` - `should_run()` logic exists, no executor
- **Fix:** Add Celery worker or document manual execution only

### 7. Integration Credentials Encryption
- **File:** `database/models.py:319-341`, `backend/connectors.py`
- **Assumption:** Integration credentials stored securely
- **Reality:** Credentials in `UserIntegration.config` (JSONB) unencrypted
- **Risk:** High - Database compromise exposes all API keys
- **Evidence:** `database/models.py:328` - `config = Column(JSONB, nullable=False)` - no encryption
- **Fix:** Encrypt sensitive fields before storage (see TODO in docs)

## Architecture vs ADRs

### ADR 001: API Framework Selection (FastAPI)
- **Status:** ✅ Aligned
- **File:** `docs/ADRs/001-api-framework-selection.md`
- **Reality:** FastAPI used throughout; OpenAPI auto-generated
- **Drift:** None

### ADR 002: Database Choice (PostgreSQL)
- **Status:** ✅ Aligned
- **File:** `docs/ADRs/002-database-choice.md`
- **Reality:** PostgreSQL 15, SQLAlchemy ORM, Alembic migrations
- **Drift:** None

### Implicit ADR: API Versioning
- **Status:** ⚠️ Diverged
- **File:** `backend/api_v1.py`, `backend/main.py:174`
- **Expected:** Versioned API routes (`/api/v1/*`)
- **Reality:** Empty stub (`api_v1.py`), routes still in `main.py` under `/api/*`
- **Drift:** High - Versioning promised but not implemented
- **Fix:** Move routes to versioned router or remove versioning

## Single Points of Failure (SPOFs)

### 1. Database Connection Pool Exhaustion
- **Location:** `backend/database.py:22-28`
- **Impact:** All API requests fail (500s)
- **Blast Radius:** Entire application
- **Current Guardrail:** None (pool_size=10, no monitoring)
- **Proposed Guardrail:** Circuit breaker + pool monitoring + graceful degradation
- **Effort:** M (4-6 hours)

### 2. SECRET_KEY Hardcoded Default
- **Location:** `backend/config.py:23`, `.env.example:11`
- **Impact:** Token forgery if default used in production
- **Blast Radius:** All authenticated endpoints
- **Current Guardrail:** Warning in dev (`backend/config.py:76-81`)
- **Proposed Guardrail:** Fail startup in production
- **Effort:** S (15 minutes)

### 3. CORS Permissive Configuration
- **Location:** `backend/main.py:178-184`, `backend/config.py:33`
- **Impact:** CSRF attacks possible
- **Blast Radius:** All endpoints
- **Current Guardrail:** Warning if "*" in production (`backend/config.py:84-88`)
- **Proposed Guardrail:** Fail startup in production
- **Effort:** S (30 minutes)

### 4. Rate Limiting Per-Instance
- **Location:** `backend/rate_limit.py:12`
- **Impact:** DDoS protection ineffective across load balancer
- **Blast Radius:** All endpoints
- **Current Guardrail:** Per-instance rate limiting (slowapi)
- **Proposed Guardrail:** Redis-backed global rate limiting
- **Effort:** M (4 hours)

### 5. Redis Unavailable (Cache/Rate Limiting)
- **Location:** `backend/cache.py:28-43`
- **Impact:** In-memory cache lost on restart; rate limiting ineffective
- **Blast Radius:** Performance degradation
- **Current Guardrail:** Fallback to in-memory (no persistence)
- **Proposed Guardrail:** Health check + alert if Redis unavailable in production
- **Effort:** S (1 hour)

### 6. Workflow Scheduler Not Running
- **Location:** `backend/workflow_scheduler.py`
- **Impact:** Scheduled workflows never execute
- **Blast Radius:** Workflow feature non-functional
- **Current Guardrail:** None (logic exists, no executor)
- **Proposed Guardrail:** Celery worker process or document manual execution
- **Effort:** L (2-3 days)

### 7. Unencrypted Integration Credentials
- **Location:** `database/models.py:328`, `backend/connectors.py`
- **Impact:** Database compromise exposes all API keys
- **Blast Radius:** All integrations
- **Current Guardrail:** None
- **Proposed Guardrail:** Encrypt sensitive fields before storage
- **Effort:** M (1-2 days)

### 8. Migration Status Check Failure
- **Location:** `backend/main.py:71-103`
- **Impact:** Schema drift if migrations not applied
- **Blast Radius:** Database operations fail
- **Current Guardrail:** Warning in dev, fails in production
- **Proposed Guardrail:** Health check endpoint for migration status
- **Effort:** S (30 minutes) - Already partially implemented

### 9. WebSocket Connection Manager (In-Memory)
- **Location:** `backend/main.py:214-233`
- **Impact:** WebSocket connections lost on restart; no pub/sub across instances
- **Blast Radius:** Real-time features
- **Current Guardrail:** In-memory ConnectionManager
- **Proposed Guardrail:** Redis pub/sub for WebSocket broadcasting
- **Effort:** M (1-2 days)

### 10. Batch Event Processing (No DLQ)
- **Location:** `backend/batch_processor.py:8-45`
- **Impact:** Failed batches lost; no retry mechanism
- **Blast Radius:** Event tracking
- **Current Guardrail:** None (transactions, no retry)
- **Proposed Guardrail:** Dead letter queue + retry logic
- **Effort:** M (4-6 hours)

## Top 10 SPOFs Summary

| Rank | SPOF | File | Impact | Effort | Priority |
|------|------|------|--------|--------|----------|
| 1 | SECRET_KEY default | `backend/config.py:23` | Critical | S | P0 |
| 2 | CORS permissive | `backend/main.py:178-184` | Critical | S | P0 |
| 3 | Connection pool exhaustion | `backend/database.py:22-28` | High | M | P0 |
| 4 | Rate limiting per-instance | `backend/rate_limit.py:12` | High | M | P1 |
| 5 | Unencrypted credentials | `database/models.py:328` | High | M | P1 |
| 6 | Workflow scheduler not running | `backend/workflow_scheduler.py` | Medium | L | P2 |
| 7 | Redis unavailable | `backend/cache.py:28-43` | Medium | S | P1 |
| 8 | WebSocket in-memory | `backend/main.py:214-233` | Medium | M | P2 |
| 9 | Batch processing no DLQ | `backend/batch_processor.py` | Medium | M | P2 |
| 10 | Migration drift | `database/schema.sql` | Low | S | P1 |

## Proposed Guardrails (Minimal, Reversible)

### Phase 1: Critical Security (Week 1)
1. **SECRET_KEY validation** - Fail startup in production if default
   - File: `backend/config.py:71-81`
   - Change: Raise ValueError instead of warning

2. **CORS validation** - Fail startup in production if "*" in origins
   - File: `backend/config.py:83-88`
   - Change: Raise ValueError instead of warning

### Phase 2: Resilience (Week 2-3)
3. **Connection pool monitoring** - Health check endpoint
   - File: `backend/database.py:31-40` (exists), `backend/main.py:431-439`
   - Change: Add pool status to readiness check

4. **Circuit breaker** - Wire existing circuit breaker into database operations
   - File: `backend/database.py`, `backend/circuit_breaker.py`
   - Change: Apply circuit breaker to critical DB operations

5. **Redis-backed rate limiting** - Global protection
   - File: `backend/rate_limit.py`
   - Change: Use Redis for rate limit storage if available

### Phase 3: Feature Completeness (Week 3-4)
6. **Workflow executor** - Celery worker or document manual execution
   - File: `backend/celery_app.py` (new), `docker-compose.yml`
   - Change: Add Celery worker process

7. **Integration credentials encryption** - Encrypt before storage
   - File: `backend/connectors.py`, `database/models.py`
   - Change: Add encryption layer for sensitive fields

## Architecture Drift Summary

| Category | Expected | Reality | Drift Level |
|----------|----------|---------|-------------|
| API Versioning | `/api/v1/*` routes | Empty stub, routes in `/api/*` | High |
| Database Schema | `schema.sql` complete | 8/17 tables present | High |
| Feature Flags | Integrated | Models exist, not wired | Medium |
| Workflow Execution | Auto-execute | Logic exists, no runner | High |
| Circuit Breaker | Used | Exists, not wired | Medium |
| Rate Limiting | Global | Per-instance | High |
| Integration Security | Encrypted | Plain text | High |

## Next Steps

1. **Immediate (Week 1):** Fix SECRET_KEY and CORS validation (1 hour)
2. **Short-term (Week 2-3):** Add connection pool monitoring, circuit breaker (1-2 days)
3. **Medium-term (Week 3-4):** Redis-backed rate limiting, workflow executor (1 week)
4. **Long-term (Week 4-6):** Split main.py, encrypt credentials, complete schema (2-3 weeks)

See `docs/audit/THREE_STEP_REFACTOR_PLAN.md` for detailed refactoring roadmap.
