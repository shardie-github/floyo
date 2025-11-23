# Phase 1: Repo Digest & Diagnostic Model

**Generated:** 2025-01-XX  
**Status:** ✅ Complete  
**Scope:** Full repository analysis and mapping

---

## 1. Repo Map

### Directory Structure Overview

```
floyo-monorepo/
├── frontend/              # Next.js 14 App Router frontend
│   ├── app/              # App router pages (65 files)
│   ├── components/       # React components (40+ components)
│   ├── lib/              # Utilities, API clients, services
│   ├── hooks/            # React hooks
│   └── e2e/              # Playwright E2E tests
│
├── backend/              # Python FastAPI backend
│   ├── api/              # API route modules (24 files)
│   ├── ml/               # ML models and inference (20 files)
│   ├── guardian/         # Autonomous guardian system (10 files)
│   ├── services/         # Business logic services
│   ├── jobs/             # Background jobs
│   └── main.py           # FastAPI app entry point
│
├── floyo/                # Core CLI tracking library
│   ├── tracker.py        # Usage pattern tracking
│   ├── suggester.py      # Integration suggestions
│   ├── watcher.py        # File system monitoring
│   └── cli.py            # Command-line interface
│
├── supabase/             # Database migrations and functions
│   ├── migrations/       # SQL migration files (13 migrations)
│   └── functions/        # Edge functions (4 functions)
│
├── prisma/               # Prisma ORM schema
│   └── schema.prisma    # Database schema definition
│
├── tests/                # Test suite
│   ├── unit/             # Unit tests
│   └── integration/     # Integration tests
│
├── scripts/              # Utility scripts (67 files)
├── docs/                 # Documentation (411 files)
├── ops/                  # Operations tooling (53 files)
├── unified-agent/        # Autonomous agent system
└── agent-engine/         # Agent orchestration engine
```

### Key Modules & Dependencies

#### Frontend Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3.3
- **UI:** React 18, Tailwind CSS, Framer Motion
- **State:** Zustand, React Query
- **Testing:** Jest, Playwright
- **Analytics:** PostHog, Vercel Analytics
- **Monitoring:** Sentry

#### Backend Stack
- **Framework:** FastAPI 0.104+
- **Language:** Python 3.9+
- **ORM:** SQLAlchemy 2.0, Prisma
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth, JWT
- **ML:** Custom ML models in `backend/ml/`
- **Jobs:** Celery (Redis broker)
- **Testing:** pytest

#### Infrastructure
- **Frontend Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Edge Functions:** Supabase Edge Functions
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry, PostHog

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Floyo System Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Frontend   │◄─────►│   Backend    │◄─────►│ Database │ │
│  │  (Next.js)   │ HTTP │  (FastAPI)   │ SQL   │(Supabase) │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                     │                            │
│         │                     │                            │
│         ▼                     ▼                            │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │ File Watcher │      │  Pattern     │                  │
│  │  (CLI Tool)  │      │  Analyzer    │                  │
│  └──────────────┘      └──────────────┘                  │
│         │                     │                            │
│         └─────────────────────┘                            │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                          │
│         │ Integration Suggester │                          │
│         │   (ML Engine)         │                          │
│         └──────────────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Entry Points

1. **Frontend:** `frontend/app/page.tsx` (Next.js App Router)
2. **Backend API:** `backend/main.py` (FastAPI app)
3. **CLI Tool:** `floyo/cli.py` (Python CLI)
4. **Edge Functions:** `supabase/functions/*/index.ts`
5. **Background Jobs:** `backend/jobs/*.py` (Celery tasks)

---

## 2. Architecture Summary

### Current Architecture Pattern

**Type:** Monolithic Backend + Frontend Separation

**Strengths:**
- ✅ Clear separation of frontend/backend
- ✅ Modular API structure (`backend/api/` modules)
- ✅ Service layer separation (`backend/services/`)
- ✅ ML models isolated (`backend/ml/`)
- ✅ Database migrations managed (Supabase + Prisma)

**Weaknesses:**
- ⚠️ Large API route registration file (`backend/api/__init__.py` - 135 lines)
- ⚠️ Some business logic mixed with API handlers
- ⚠️ No clear service layer boundaries in some modules
- ⚠️ Frontend state management scattered (Zustand + React Query + Context)

### Architectural Patterns Identified

1. **API Versioning:** Partial (`/api/v1/` exists, but legacy `/api/` routes still active)
2. **Service Layer:** Present but inconsistent (`backend/services/` exists, but some logic in API handlers)
3. **Repository Pattern:** Not explicitly used (direct SQLAlchemy/Prisma access)
4. **Dependency Injection:** Limited (some services use direct DB access)
5. **Error Handling:** Standardized (`backend/error_handling.py` exists)
6. **Middleware:** Centralized (`backend/middleware/`)

### Environment & Secrets Management

**Current State:**
- ✅ `.env.example` exists with comprehensive documentation
- ✅ Environment variables documented
- ⚠️ No runtime validation (env vars checked but not validated on startup)
- ⚠️ Secrets scattered (some in `.env`, some in Vercel/Supabase)

**Recommendations:**
- Implement `backend/config.py` with Pydantic Settings for validation
- Centralize secrets management
- Add startup validation for required env vars

---

## 3. Risk/Tech-Debt Table

| Risk Area | Severity | Impact | Description | Files Affected |
|-----------|----------|--------|-------------|----------------|
| **API Route Organization** | Medium | High | Large route registration file, mixed concerns | `backend/api/__init__.py` |
| **Service Layer Inconsistency** | Medium | Medium | Some business logic in API handlers | Multiple API files |
| **Frontend State Management** | Low | Medium | Multiple state management solutions (Zustand + React Query + Context) | `frontend/lib/`, `frontend/hooks/` |
| **Test Coverage** | High | High | Limited test coverage (only 4 test files found) | Entire codebase |
| **Error Handling** | Low | Low | Standardized but not consistently applied | Various API endpoints |
| **Database Query Performance** | Medium | High | No explicit query optimization, potential N+1 queries | `backend/api/`, `backend/services/` |
| **Type Safety** | Low | Medium | TypeScript strict mode not enforced, some `any` types | `frontend/` |
| **Documentation** | Low | Low | Good docs exist but some API endpoints undocumented | `backend/api/` |
| **Dependency Management** | Low | Low | Dependencies up to date, but no automated updates | `package.json`, `requirements.txt` |
| **CI/CD Coverage** | Medium | Medium | GitHub Actions exist but may not cover all checks | `.github/workflows/` |

### High-Priority Tech Debt

1. **Test Coverage** (Critical)
   - Only 4 test files found for entire codebase
   - No backend unit tests visible
   - E2E tests exist but coverage unknown

2. **API Route Organization** (High)
   - `backend/api/__init__.py` has 135 lines registering 20+ routers
   - Should be split into logical groups
   - Legacy routes mixed with v1 routes

3. **Service Layer Consistency** (High)
   - Business logic sometimes in API handlers
   - Should extract to `backend/services/` consistently

4. **Database Query Performance** (High)
   - No explicit query optimization
   - Potential N+1 queries in pattern/insight endpoints
   - Missing indexes may exist

---

## 4. High-Leverage Improvement Targets

### Target 1: Test Coverage Infrastructure ⭐⭐⭐
**Impact:** High | **Effort:** Medium | **Risk Reduction:** Critical

**What:** Establish comprehensive test coverage
- Set up pytest for backend (unit + integration)
- Expand Jest/Playwright coverage for frontend
- Add CI/CD test gates
- Target: 60%+ coverage for service layer

**Why:** Current test coverage is insufficient for production readiness. Critical for sprint completion.

**Files:**
- `pytest.ini` (exists, needs expansion)
- `frontend/jest.config.js` (exists, needs expansion)
- `.github/workflows/ci.yml` (needs test gates)

---

### Target 2: API Route Refactoring ⭐⭐⭐
**Impact:** High | **Effort:** Medium | **Maintainability:** High

**What:** Refactor API route registration
- Split `backend/api/__init__.py` into logical groups
- Create `backend/api/v1/` and `backend/api/legacy/` separation
- Standardize route patterns
- Add route documentation

**Why:** Current route registration is hard to maintain and understand. Blocks future development.

**Files:**
- `backend/api/__init__.py` (135 lines → split into modules)
- `backend/api/v1/` (create new structure)

---

### Target 3: Service Layer Standardization ⭐⭐
**Impact:** Medium | **Effort:** Medium | **Code Quality:** High

**What:** Extract business logic from API handlers
- Move logic to `backend/services/`
- Create service interfaces
- Add dependency injection
- Standardize error handling

**Why:** Improves testability and maintainability. Aligns with best practices.

**Files:**
- `backend/services/` (expand and standardize)
- Various API handler files (extract logic)

---

### Target 4: Database Query Optimization ⭐⭐
**Impact:** High | **Effort:** Low-Medium | **Performance:** High

**What:** Optimize database queries
- Add missing indexes (analyze query patterns)
- Fix N+1 queries (use joins/batch loading)
- Add query performance monitoring
- Implement caching for frequent queries

**Why:** Performance bottlenecks will appear at scale. Proactive optimization prevents issues.

**Files:**
- `supabase/migrations/` (add performance indexes)
- `backend/api/` (fix N+1 queries)
- `backend/cache.py` (expand caching)

---

### Target 5: Environment Variable Validation ⭐
**Impact:** Medium | **Effort:** Low | **Reliability:** High

**What:** Add startup validation for env vars
- Create `backend/config.py` with Pydantic Settings
- Validate all required vars on startup
- Provide clear error messages
- Document required vs optional vars

**Why:** Prevents runtime errors from missing config. Improves developer experience.

**Files:**
- `backend/config.py` (enhance with validation)
- `.env.example` (already good, add validation)

---

### Target 6: Frontend State Management Consolidation ⭐
**Impact:** Low | **Effort:** Medium | **Developer Experience:** Medium

**What:** Consolidate state management
- Choose primary pattern (Zustand recommended)
- Migrate Context usage to Zustand
- Keep React Query for server state
- Document state management patterns

**Why:** Reduces confusion and improves maintainability.

**Files:**
- `frontend/lib/` (consolidate state)
- `frontend/hooks/` (standardize hooks)

---

### Target 7: Error Handling Standardization ⭐
**Impact:** Medium | **Effort:** Low | **User Experience:** Medium

**What:** Standardize error handling across API
- Use consistent error response format
- Add error codes
- Implement error boundaries in frontend
- Add error logging/monitoring

**Why:** Improves debugging and user experience.

**Files:**
- `backend/error_handling.py` (enhance)
- `frontend/lib/error-boundary/` (expand)

---

### Target 8: API Documentation ⭐
**Impact:** Low | **Effort:** Low | **Developer Experience:** Medium

**What:** Complete API documentation
- Generate OpenAPI spec from code
- Add endpoint documentation
- Create API client examples
- Document authentication flows

**Why:** Improves developer experience and onboarding.

**Files:**
- `backend/api/` (add OpenAPI annotations)
- `API.md` (already exists, needs updates)

---

### Target 9: Dependency Updates & Security ⭐
**Impact:** Low | **Effort:** Low | **Security:** Medium

**What:** Audit and update dependencies
- Run `npm audit` and `pip check`
- Update outdated dependencies
- Add Dependabot for automated updates
- Review security advisories

**Why:** Prevents security vulnerabilities and keeps dependencies current.

**Files:**
- `package.json`
- `requirements.txt`
- `.github/dependabot.yml` (create)

---

### Target 10: Monitoring & Observability ⭐
**Impact:** Medium | **Effort:** Medium | **Operational:** High

**What:** Enhance monitoring
- Add APM (Application Performance Monitoring)
- Implement distributed tracing
- Add performance metrics
- Create monitoring dashboards

**Why:** Critical for production operations and debugging.

**Files:**
- `backend/monitoring.py` (enhance)
- `frontend/lib/monitoring/` (expand)

---

## Summary

**Total High-Leverage Targets:** 10  
**Critical (⭐⭐⭐):** 2 (Test Coverage, API Refactoring)  
**High Priority (⭐⭐):** 2 (Service Layer, Query Optimization)  
**Medium Priority (⭐):** 6 (Env Validation, State Management, Error Handling, Docs, Dependencies, Monitoring)

**Recommended Sprint Focus:**
1. Test Coverage Infrastructure (Critical for sprint completion)
2. API Route Refactoring (High impact, blocks future work)
3. Database Query Optimization (Performance critical)
4. Service Layer Standardization (Code quality)

---

**Next Phase:** Phase 2 - Sprint Review & Roadblock Analysis
