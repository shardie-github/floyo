# Living Architecture Guide

**Version:** 1.0.0  
**Last Updated:** 2024-12-19  
**Purpose:** Continuously updated system architecture documentation that evolves with the codebase

## Overview

This guide transforms static audit findings into a **living, adaptive architecture** that continuously validates its own integrity, intent alignment, and resilience. Unlike traditional documentation that drifts over time, this system uses automated checks, guardrails, and intelligence maps to maintain coherence.

## What Makes This "Living"

### 1. **Automated Guardrails**
- **Location:** `infra/selfcheck/guardrails.yaml`
- **Purpose:** Enforces architectural invariants derived from audit findings
- **Execution:** Runs in CI/CD and can be executed manually
- **Examples:**
  - SECRET_KEY must not be default in production
  - No circular dependencies in backend modules
  - Migrations must be up to date
  - Health checks must exist

### 2. **System Intelligence Map**
- **Location:** `src/observability/system_intelligence_map.json`
- **Purpose:** Links modules to business goals and resilience dependencies
- **Structure:**
  - Modules → Business goals mapping
  - Resilience dependencies graph
  - Architectural truths and their validations
  - Evolution path (immediate, short-term, long-term)

### 3. **Self-Reflection Tests**
- **Location:** `tests/self_reflection.test.js`
- **Purpose:** Scans repository to assert guardrails haven't regressed
- **Fails build if:** Audit regressions reappear

### 4. **SLO Monitors**
- **Location:** `infra/selfcheck/slo-monitors.yml`
- **Purpose:** Defines top 3 SLOs with synthetic monitors
- **SLOs:**
  1. API Availability: 99.9% uptime
  2. API Latency: P95 < 200ms, P99 < 500ms
  3. Database Pool Health: Utilization < 90%

### 5. **CI Intent Tests**
- **Location:** `.github/workflows/ci-intent-tests.yml`
- **Purpose:** Enforces architectural integrity on every PR
- **Runs:**
  - Guardrails validation
  - Circular dependency checks
  - Migration checks
  - Secret scanning
  - ADR alignment

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                    │
│  - React Components (app/, components/)                      │
│  - API Client (hooks/useApi.ts)                             │
│  - State: Zustand                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (FastAPI 0.104+)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  main.py (2,298 lines - Monolithic) ⚠️               │  │
│  │  - All 50+ routes (auth, events, patterns, etc.)     │  │
│  │  - WebSocket manager (ConnectionManager)             │  │
│  │  - Middleware (CORS, GZip, Security, Rate Limit)    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supporting Modules:                                   │  │
│  │  - database.py (SessionLocal, connection pool)        │  │
│  │  - cache.py (Redis/in-memory fallback)               │  │
│  │  - rate_limit.py (slowapi, per-instance) ⚠️         │  │
│  │  - circuit_breaker.py (exists, not wired) ⚠️        │  │
│  │  - config.py (Pydantic settings)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQLAlchemy ORM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL 15)                        │
│  - models.py (17 models) ✅                                  │
│  - schema.sql (incomplete, 8/17 tables) ⚠️                  │
│  - Alembic migrations ✅                                     │
└─────────────────────────────────────────────────────────────┘
```

### Critical Modules

#### `backend/main.py` (Monolithic Entry Point)
- **Purpose:** FastAPI application with all API routes
- **Concern:** 2,298 lines, all routes in single file
- **Evolution:** Split into `backend/routes/` modules
- **Dependencies:** All backend modules

#### `backend/config.py` (Configuration Management)
- **Purpose:** Centralized configuration with Pydantic settings
- **Guardrails:**
  - SECRET_KEY validation (must fail in production)
  - CORS validation (must fail if `*` in production)
- **Status:** ✅ Single source of truth

#### `backend/database.py` (Connection Pool)
- **Purpose:** Database connection management
- **Concern:** Pool exhaustion risk (pool_size=10)
- **Guardrails:**
  - Circuit breaker protection
  - Pool monitoring in health checks
- **Status:** Circuit breaker exists but needs wiring

#### `backend/rate_limit.py` (Rate Limiting)
- **Purpose:** DDoS protection and abuse prevention
- **Concern:** Per-instance storage (not global)
- **Evolution:** Redis-backed global rate limiting
- **Status:** ⚠️ Needs Redis backend

## Architectural Truths

These are non-negotiable architectural principles enforced by guardrails:

### 1. No Circular Dependencies
- **Validation:** `infra/selfcheck/check_circular_deps.py`
- **Rationale:** Circular dependencies make code hard to maintain and test

### 2. Production Security
- **Validation:** SECRET_KEY != default, CORS != `*`
- **Rationale:** Prevents token forgery and CSRF attacks

### 3. Migration Consistency
- **Validation:** `alembic check`
- **Rationale:** Schema drift causes runtime errors

### 4. Health Check Availability
- **Validation:** `/health`, `/health/readiness`, `/health/liveness` exist
- **Rationale:** Required for load balancer and monitoring

## Resilience Dependencies

### Database Connection Pool
- **Modules Dependent:** `main.py`, `database.py`, `models.py`
- **Failure Modes:** Pool exhaustion, connection timeout
- **Mitigations:**
  - Circuit breaker
  - Pool monitoring
  - Graceful degradation
- **Guardrails:**
  - Pool utilization < 90%
  - Health check endpoint
  - Alert on high utilization

### Rate Limiting
- **Modules Dependent:** `main.py`, `rate_limit.py`
- **Failure Modes:** Per-instance storage, Redis unavailable
- **Mitigations:**
  - Redis-backed global rate limiting
  - Fallback to in-memory
  - Health check for Redis
- **Guardrails:**
  - Redis health check
  - Global rate limit tracking

### Cache Persistence
- **Modules Dependent:** `cache.py`, `rate_limit.py`
- **Failure Modes:** Redis unavailable, cache lost on restart
- **Mitigations:**
  - Redis persistence
  - Cache warming
  - TTL jitter
- **Guardrails:**
  - Redis health check
  - Cache hit rate monitoring

## Business Goals Mapping

### User Authentication
- **Modules:** `main.py`, `config.py`
- **Critical Paths:** `POST /api/auth/register`, `POST /api/auth/login`
- **Resilience Requirements:**
  - SECRET_KEY validation
  - JWT token security
  - Password hashing
- **SLO Targets:**
  - API availability: 99.9%
  - API latency: P95 < 200ms

### Event Tracking
- **Modules:** `main.py`, `batch_processor.py`, `models.py`
- **Critical Paths:** `POST /api/events`, `POST /api/events/batch`
- **Resilience Requirements:**
  - Database connection pool
  - Batch processing retry
  - Dead letter queue
- **SLO Targets:**
  - API latency: P95 < 200ms
  - Data consistency: 99.99%

### Workflow Execution
- **Modules:** `main.py`, `workflow_scheduler.py`
- **Critical Paths:** `POST /api/workflows/{id}/execute`
- **Resilience Requirements:**
  - Workflow executor process
  - Step-level rollback
  - Timeout handling
- **SLO Targets:**
  - Functionality: Workflow execution must be automated

## How to Maintain This Guide

### 1. **Run Guardrails Regularly**
```bash
# Run all guardrails
python infra/selfcheck/run_guardrails.py

# Run specific checks
python infra/selfcheck/check_circular_deps.py
python infra/selfcheck/check_migrations.py
```

### 2. **Update System Intelligence Map**
- When adding new modules, update `src/observability/system_intelligence_map.json`
- Link modules to business goals
- Document resilience dependencies

### 3. **Review Audit Findings**
- Check `docs/audit/EXEC_SUMMARY.md` for new findings
- Add guardrails for new risks
- Update evolution path

### 4. **Run Self-Reflection Tests**
```bash
npm test -- tests/self_reflection.test.js
```

### 5. **Monitor SLOs**
- Check `infra/selfcheck/slo-monitors.yml` for SLO definitions
- Implement actual monitoring (Prometheus, DataDog, etc.)
- Alert on SLO violations

## Evolution Path

### Immediate (Week 1)
- ✅ Fix SECRET_KEY and CORS validation (fail in production)
- ✅ Add connection pool monitoring to health checks
- ⏳ Wire circuit breaker to database operations

### Short-Term (Week 2-3)
- Split `main.py` into route modules
- Implement Redis-backed rate limiting
- Add dead letter queue for batch processing

### Long-Term (Week 4-6)
- Encrypt integration credentials
- Add Celery worker for workflow execution
- Implement Redis pub/sub for WebSocket scaling

## Integration with CI/CD

### Pre-merge Gate
- **Workflow:** `.github/workflows/ci-intent-tests.yml`
- **Runs on:** Pull requests
- **Actions:**
  - Guardrails validation
  - Circular dependency checks
  - Migration checks
  - Secret scanning
  - Blocks merge if critical checks fail

### Nightly Drift Report
- **Schedule:** 2 AM UTC daily
- **Actions:**
  - Run all guardrails
  - Regenerate intelligence map
  - Post diff summary to maintainers

## Self-Healing Behavior

### Automated Checks
- **Guardrails:** Run on every PR and nightly
- **Self-Reflection:** Scans repo for regressions
- **SLO Monitors:** Validates health endpoints

### Adaptive Learning
- **Drift Tracker:** Records recurring findings
- **Rule Updates:** Suggests new guardrails based on patterns
- **PR Templates:** Prompts for architectural justification

## Troubleshooting

### Guardrails Failing
1. Check `infra/selfcheck/guardrails.yaml` for the failing check
2. Review audit reference in guardrails file
3. Fix the issue or update guardrail if false positive
4. Re-run guardrails: `python infra/selfcheck/run_guardrails.py`

### System Intelligence Map Out of Date
1. Review `src/observability/system_intelligence_map.json`
2. Update module mappings if structure changed
3. Add new modules to business goals
4. Document resilience dependencies

### SLO Monitors Not Working
1. Check `infra/selfcheck/slo-monitors.yml` for configuration
2. Implement actual monitoring (stubs are placeholders)
3. Verify health endpoints are accessible
4. Set up alerting channels

## Related Documentation

- **Audit Findings:** `docs/audit/EXEC_SUMMARY.md`
- **Root Cause Analysis:** `docs/audit/ROOT_CAUSE_AND_DRIFT_MAP.md`
- **Resilience Table:** `docs/audit/RESILIENCE_TABLE.md`
- **SLO Runbook:** `docs/audit/OPS_SLO_RUNBOOK_SEEDS.md`
- **Config Entropy:** `docs/audit/CONFIG_ENTROPY_REPORT.md`

## Contributing

When adding new features or modules:

1. **Update System Intelligence Map:** Add module to `system_intelligence_map.json`
2. **Add Guardrails:** If new risks identified, add to `guardrails.yaml`
3. **Update This Guide:** Document new modules and their purpose
4. **Run Self-Reflection:** Ensure tests still pass
5. **Review CI:** Verify guardrails run successfully

## Questions?

- **Guardrails:** See `infra/selfcheck/guardrails.yaml` and validation scripts
- **Intelligence Map:** See `src/observability/system_intelligence_map.json`
- **SLOs:** See `infra/selfcheck/slo-monitors.yml`
- **CI/CD:** See `.github/workflows/ci-intent-tests.yml`

---

**This is a living document.** It evolves with the codebase. If you find inconsistencies, update this guide or add a guardrail to prevent drift.
