# Root Cause & Architecture Drift Map

## Current Architecture Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  - React Components                                          │
│  - API Client (lib/api.ts)                                   │
│  - State: Zustand                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  main.py (1,832 lines - MONOLITHIC)                   │  │
│  │  - All routes, auth, events, patterns, suggestions   │  │
│  │  - WebSocket manager, middleware, deps                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supporting Modules:                                  │  │
│  │  - database.py (session management)                    │  │
│  │  - cache.py (Redis/in-memory fallback)                │  │
│  │  - rate_limit.py (slowapi)                            │  │
│  │  - audit.py (logging)                                 │  │
│  │  - batch_processor.py (event processing)              │  │
│  │  - workflow_scheduler.py (cron logic, no executor)    │  │
│  │  - connectors.py (integration stubs)                  │  │
│  │  - organizations.py (multi-tenant)                     │  │
│  │  - feature_flags.py (models, no runtime)          │  │
│  │  - experiments.py (models, no runtime)                │  │
│  │  - fraud_scoring.py (models, no runtime)              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  api_v1.py (8 lines - EMPTY STUB)                      │  │
│  │  ⚠️ DRIFT: Versioned API promised, not implemented   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQLAlchemy ORM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  models.py (17 models)                                │  │
│  │  - User, Event, Pattern, Suggestion, Workflow        │  │
│  │  - Organization, AuditLog, IntegrationConnector       │  │
│  │  - WorkflowVersion, WorkflowExecution                │  │
│  │  - FeatureFlag, Experiment, FraudScore (models only)  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  schema.sql (178 lines - INCOMPLETE)                    │  │
│  │  ⚠️ DRIFT: Missing tables (organizations, etc.)       │  │
│  │  ⚠️ DRIFT: RLS policies for Supabase (not used)       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  migrations/add_feature_flags_experiments_fraud.py     │  │
│  │  ⚠️ DRIFT: Migration exists but models.py missing     │  │
│  │        corresponding model classes                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         BACKGROUND JOBS (STUB ONLY)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  workflow_scheduler.py                                 │  │
│  │  ⚠️ DRIFT: Cron logic exists, no actual cron runner   │  │
│  │  ⚠️ DRIFT: No Celery/worker process configured       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Module Dependency Analysis

### Circular Dependencies
**None detected** - Good separation between backend modules.

### Implicit Contracts (Shared Assumptions)

1. **Database Session Management**
   - **File:** `backend/database.py`, `backend/main.py`
   - **Assumption:** `get_db()` always yields a valid session; no connection pool exhaustion handling
   - **Risk:** High - Under load, pool exhaustion causes 500s
   - **Fix:** Add connection pool monitoring, circuit breaker

2. **Cache Availability**
   - **File:** `backend/cache.py`
   - **Assumption:** Redis optional; in-memory fallback is acceptable
   - **Risk:** Medium - In-memory cache lost on restart, no persistence
   - **Fix:** Document cache strategy, add health check for Redis

3. **JWT Token Validation**
   - **File:** `backend/main.py:316-337`
   - **Assumption:** SECRET_KEY is always set and matches across instances
   - **Risk:** High - Token validation fails if SECRET_KEY changes
   - **Fix:** Document secret rotation process, add validation on startup

4. **Rate Limiting**
   - **File:** `backend/rate_limit.py`
   - **Assumption:** `slowapi` uses in-memory storage (no shared state across instances)
   - **Risk:** Medium - Rate limits per-instance, not global
   - **Fix:** Use Redis-backed rate limiting for multi-instance deployments

5. **WebSocket Connection State**
   - **File:** `backend/main.py:170-187`
   - **Assumption:** `ConnectionManager` state is process-local
   - **Risk:** Medium - WebSockets don't work across load balancers
   - **Fix:** Use Redis pub/sub for WebSocket message distribution

### Orphaned Components

1. **`backend/api_v1.py`** (8 lines)
   - **Status:** Empty stub; routes defined in `main.py` instead
   - **ADR Claim:** "API versioning" in main.py docs
   - **Reality:** No versioned routes implemented
   - **Action:** Either implement versioning or remove stub

2. **`database/schema.sql`**
   - **Status:** Incomplete schema; missing 10+ tables
   - **Models Reality:** 17 models in `models.py`
   - **Action:** Generate schema from models or archive schema.sql

3. **Feature Flags/Experiments/Fraud Scoring Models**
   - **Files:** `backend/feature_flags.py`, `backend/experiments.py`, `backend/fraud_scoring.py`
   - **Status:** Models defined but no runtime integration
   - **Migration:** `migrations/add_feature_flags_experiments_fraud.py` exists
   - **Action:** Either implement runtime or document as "coming soon"

4. **`floyo/` CLI Package**
   - **Status:** Standalone CLI tool, minimal integration with backend API
   - **Usage:** Local file watching, not connected to backend
   - **Action:** Document as separate tool or integrate with backend

## Architecture Document vs Reality

### ADR 001: FastAPI Selection ✓
- **Status:** Aligned
- **Evidence:** `backend/main.py` uses FastAPI, Pydantic models, OpenAPI docs

### ADR 002: PostgreSQL + SQLAlchemy ✓
- **Status:** Aligned
- **Evidence:** `database/models.py`, `backend/database.py`

### Declared Architecture (SYSTEM_DIAGRAM_FINAL.md)
- **Claim:** "45 endpoints"
- **Reality:** ~40 endpoints in `main.py` ✓

- **Claim:** "Workflow Scheduler exists but needs cron registration"
- **Reality:** `workflow_scheduler.py` has cron logic but no runner process ⚠️

- **Claim:** "Redis (optional)" for cache
- **Reality:** Fallback to in-memory, no persistence ⚠️

- **Claim:** "Sentry (optional)" for monitoring
- **Reality:** `sentry_config.py` exists, requires `SENTRY_DSN` env var ✓

## Single Points of Failure (SPOFs)

### Critical SPOFs

1. **Database Connection Pool**
   - **Location:** `backend/database.py:22-30`
   - **Impact:** All API requests fail if pool exhausted
   - **Blast Radius:** 100% user-facing
   - **Current Guardrail:** `pool_pre_ping=True`, pool_size=10, max_overflow=20
   - **Proposed Guardrail:**
     - Add health check endpoint that checks pool status
     - Circuit breaker for DB operations
     - Connection pool metrics/logging
     - Graceful degradation (return cached data if DB unavailable)

2. **JWT Secret Key**
   - **Location:** `backend/main.py:60`
   - **Impact:** All authenticated requests fail if key changes/rotates
   - **Blast Radius:** 100% authenticated users
   - **Current Guardrail:** Hardcoded default "your-secret-key-change-in-production"
   - **Proposed Guardrail:**
     - Require SECRET_KEY in production (fail startup if missing)
     - Support key rotation with grace period (validate against old + new)
     - Document rotation procedure

3. **Single FastAPI Process (main.py)**
   - **Location:** `backend/main.py` (1,832 lines)
   - **Impact:** Process crash = complete API outage
   - **Blast Radius:** 100% API
   - **Current Guardrail:** None (assumes container orchestration)
   - **Proposed Guardrail:**
     - Health check endpoints (`/health`, `/health/readiness`, `/health/liveness`) ✓ (already exists)
     - Add process monitoring/restart in docker-compose
     - Consider multiple worker processes (gunicorn + uvicorn workers)

4. **In-Memory Cache (Redis Fallback)**
   - **Location:** `backend/cache.py:17-18`
   - **Impact:** Cache lost on restart; no persistence
   - **Blast Radius:** Performance degradation (not failure)
   - **Current Guardrail:** Falls back to in-memory
   - **Proposed Guardrail:**
     - Document that in-memory cache is dev-only
     - Add Redis health check; fail startup in production if Redis unavailable
     - Consider persistence layer (write-through cache)

5. **Rate Limiting (In-Memory)**
   - **Location:** `backend/rate_limit.py:11`
   - **Impact:** Rate limits per-instance, not global
   - **Blast Radius:** DDoS protection ineffective across multiple instances
   - **Current Guardrail:** `slowapi` with `get_remote_address`
   - **Proposed Guardrail:**
     - Use Redis-backed rate limiting for multi-instance deployments
     - Add rate limit headers to responses

6. **WebSocket State (Process-Local)**
   - **Location:** `backend/main.py:170-187`
   - **Impact:** WebSocket messages don't reach users on different instances
   - **Blast Radius:** Real-time features broken in multi-instance setup
   - **Current Guardrail:** None
   - **Proposed Guardrail:**
     - Use Redis pub/sub for WebSocket message distribution
     - Or document WebSocket as single-instance only

7. **Workflow Scheduler (No Runner)**
   - **Location:** `backend/workflow_scheduler.py`
   - **Impact:** Scheduled workflows never execute
   - **Blast Radius:** Users expecting scheduled workflows
   - **Current Guardrail:** None (manual execution only)
   - **Proposed Guardrail:**
     - Add Celery worker process or cron job
     - Document manual execution requirement until automated

8. **Database Migrations (Alembic)**
   - **Location:** `migrations/`
   - **Impact:** Schema drift if migrations not run
   - **Blast Radius:** Database queries fail
   - **Current Guardrail:** Alembic configured
   - **Proposed Guardrail:**
     - Add migration check on startup (fail if pending migrations)
     - Add migration status endpoint

9. **File Uploads (Local Storage)**
   - **Location:** `backend/main.py:817-857`
   - **Impact:** Files lost if container restarts; no backup
   - **Blast Radius:** User-uploaded files
   - **Current Guardrail:** None
   - **Proposed Guardrail:**
     - Use S3/cloud storage for uploads
     - Add volume persistence in docker-compose
     - Document backup strategy

10. **CORS Configuration (Permissive)**
    - **Location:** `backend/main.py:133-139`
    - **Impact:** CSRF attacks, unauthorized origins
    - **Blast Radius:** Cross-origin requests
    - **Current Guardrail:** `allow_origins=["*"]` in dev
    - **Proposed Guardrail:**
      - Use `CORS_ORIGINS` env var (already in .env.example)
      - Fail startup in production if `allow_origins=["*"]`
      - Add CORS validation

## Top 10 SPOFs Summary

| Rank | SPOF | File | Impact | Blast Radius | Current Guardrail | Proposed Guardrail | Effort |
|------|------|------|--------|--------------|-------------------|-------------------|--------|
| 1 | Database Pool Exhaustion | `backend/database.py` | High | 100% | Pool config | Circuit breaker + metrics | M |
| 2 | JWT Secret Key | `backend/main.py:60` | High | 100% | Hardcoded default | Require env var + rotation | S |
| 3 | Single FastAPI Process | `backend/main.py` | High | 100% | None | Health checks + workers | M |
| 4 | Redis Fallback Cache | `backend/cache.py` | Medium | Performance | In-memory fallback | Require Redis in prod | S |
| 5 | Rate Limiting (In-Memory) | `backend/rate_limit.py` | Medium | DDoS protection | Per-instance | Redis-backed | M |
| 6 | WebSocket State | `backend/main.py:170` | Medium | Real-time features | Process-local | Redis pub/sub | L |
| 7 | Workflow Scheduler | `backend/workflow_scheduler.py` | Medium | Scheduled jobs | None | Celery worker | L |
| 8 | Database Migrations | `migrations/` | Medium | Schema drift | Alembic | Startup check | S |
| 9 | File Uploads | `backend/main.py:817` | Low | User files | None | S3/volume | M |
| 10 | CORS (Permissive) | `backend/main.py:133` | Medium | Security | `allow_origins=["*"]` | Env var validation | S |

## Proposed Guardrails (Minimal, Reversible)

### Step 1: Low-Risk Wins (≤1 day)
- Add SECRET_KEY validation on startup (fail if missing/default in prod)
- Add Redis health check; document in-memory as dev-only
- Add CORS validation (fail if `allow_origins=["*"]` in prod)
- Add migration status check on startup

### Step 2: Boundary Hardening (≤1 week)
- Add connection pool metrics + circuit breaker
- Add Redis-backed rate limiting
- Add volume persistence for file uploads
- Add migration status endpoint

### Step 3: System Decoupling (≤3 weeks)
- Implement Redis pub/sub for WebSockets
- Add Celery worker for scheduled workflows
- Add S3/cloud storage for file uploads
- Split `main.py` into route modules

## File-Specific Findings

### `backend/main.py` (1,832 lines)
- **Issue:** Monolithic file; all routes in one place
- **Drift:** `api_v1.py` exists but unused
- **Risk:** Hard to maintain, test, and scale
- **Fix:** Extract routes into modules (auth.py, events.py, etc.)

### `database/schema.sql` (178 lines)
- **Issue:** Incomplete schema; missing organizations, audit_logs, etc.
- **Drift:** Models have 17 tables, schema.sql has ~8
- **Risk:** Confusion about actual schema
- **Fix:** Generate from models or archive

### `backend/api_v1.py` (8 lines)
- **Issue:** Empty stub; versioning promised but not implemented
- **Drift:** Routes in `main.py` use `/api/*`, not `/api/v1/*`
- **Risk:** Breaking changes when versioning is needed
- **Fix:** Implement versioning or remove stub

### `backend/workflow_scheduler.py`
- **Issue:** Cron logic exists but no runner process
- **Drift:** Documentation implies automated execution
- **Risk:** Users expect scheduled workflows to run
- **Fix:** Add Celery worker or document manual execution

### `migrations/add_feature_flags_experiments_fraud.py`
- **Issue:** Migration exists but models not in `database/models.py`
- **Drift:** Models in separate files (`feature_flags.py`, etc.) but not in main models
- **Risk:** Migration fails or schema drift
- **Fix:** Integrate models into `database/models.py` or remove migration
