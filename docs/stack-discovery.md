# Stack Discovery Report

**Generated:** 2025-01-XX  
**Purpose:** Complete architectural audit and stack detection

---

## Executive Summary

**Floyo** is a file usage pattern tracking and integration suggestion platform. The repository is a monorepo with a modern, production-ready stack:

- **Frontend:** Next.js 14+ (App Router) with TypeScript
- **Backend:** Python FastAPI
- **Database:** PostgreSQL via Supabase (with Prisma schema)
- **Hosting:** Vercel (frontend), Supabase (database)
- **CI/CD:** GitHub Actions (CI-first, no local CLI required)

**Status:** ✅ Production-ready with solid foundations. Some normalization needed for dual database tooling.

---

## 1. Frontend Stack

### Framework & Build Tooling
- **Framework:** Next.js 14.0.4+ (App Router)
- **Language:** TypeScript 5.3.3
- **Styling:** Tailwind CSS 3.3.6
- **UI Components:** Radix UI primitives, Headless UI
- **State Management:** Zustand 4.4.7
- **Data Fetching:** TanStack Query (React Query) 5.12.2
- **Build Tool:** Next.js built-in (Webpack/Turbopack)

### Key Dependencies
- **Analytics:** PostHog, Vercel Analytics
- **Error Tracking:** Sentry (@sentry/nextjs)
- **Auth:** Supabase Auth (via @supabase/supabase-js)
- **Testing:** Jest, Playwright (E2E)
- **Accessibility:** @axe-core/react, pa11y-ci

### Build Configuration
- **Config:** `frontend/next.config.js`
- **Vercel Config:** `vercel.json` (root)
- **Output:** Static + Server-side rendering (hybrid)

### Package Manager
- **Manager:** npm
- **Lockfile:** `package-lock.json` (root + frontend/)
- **Node Version:** 20.x (pinned in `package.json` engines)

---

## 2. Backend Stack

### Framework & Runtime
- **Framework:** FastAPI (Python)
- **Python Version:** 3.11+ (from CI workflows)
- **ASGI Server:** Uvicorn
- **API Versioning:** `/api/v1/` routes present

### Key Dependencies
- **Database ORM:** SQLAlchemy 2.0.23+
- **Database Driver:** psycopg2-binary (PostgreSQL)
- **Migrations:** Alembic 1.12.1+
- **Auth:** python-jose, passlib[bcrypt]
- **Validation:** Pydantic 2.5.0+
- **Background Jobs:** Celery 5.3.4+ (with Redis)
- **ML/Analytics:** scikit-learn, pandas, numpy, tensorflow

### Structure
```
backend/
├── api/              # API route handlers
│   ├── v1/          # Versioned API routes
│   └── integrations/ # Third-party integrations
├── services/         # Business logic
├── ml/              # Machine learning models
├── jobs/            # Background jobs
└── middleware/      # Request middleware
```

### API Endpoints
- Health checks (`/api/health`)
- Telemetry ingestion (`/api/telemetry`)
- Patterns & insights (`/api/insights`, `/api/patterns`)
- Privacy controls (`/api/privacy/*`)
- Integrations (TikTok, Meta, Zapier, etc.)

---

## 3. Database & Persistence

### Database Provider
- **Primary:** Supabase (PostgreSQL)
- **Connection:** Via Supabase client SDK + direct PostgreSQL connection

### Schema Management (⚠️ Dual Setup)
**Issue:** Two schema management tools coexist:

1. **Supabase Migrations** (Canonical)
   - Location: `supabase/migrations/`
   - Master file: `99999999999999_master_consolidated_schema.sql`
   - CLI: `supabase` CLI
   - CI: `.github/workflows/supabase-migrate.yml`

2. **Prisma Schema** (Also Present)
   - Location: `prisma/schema.prisma`
   - Client: `@prisma/client`
   - CLI: `prisma` CLI
   - **Status:** Schema exists but migrations appear to be Supabase-first

**Recommendation:** 
- Use **Supabase migrations** as canonical (already consolidated)
- Keep Prisma schema for type generation if needed, but align with Supabase migrations
- Document this dual setup clearly

### Database Schema Highlights
- **Core Tables:** users, sessions, events, patterns, relationships
- **Privacy:** privacy_prefs, app_allowlist, signal_toggles, telemetry_events
- **Organizations:** organizations, organization_members
- **Workflows:** workflows, workflow_versions, workflow_executions
- **Analytics:** metrics_log, cohorts, utm_tracks
- **Billing:** subscriptions, offers

### Edge Functions
- Location: `supabase/functions/`
- Functions:
  - `ingest-telemetry/` - Telemetry ingestion
  - `analyze-patterns/` - Pattern analysis
  - `analyze-performance/` - Performance analysis
  - `generate-suggestions/` - Integration suggestions

---

## 4. Infrastructure & Hosting

### Frontend Hosting
- **Provider:** Vercel
- **Deployment:** Automated via GitHub Actions
- **Workflow:** `.github/workflows/frontend-deploy.yml`
- **Preview:** Per-PR deployments
- **Production:** `main` branch deployments
- **Config:** `vercel.json` (crons, headers, build settings)

### Database Hosting
- **Provider:** Supabase (managed PostgreSQL)
- **Migrations:** Automated via GitHub Actions
- **Workflow:** `.github/workflows/supabase-migrate.yml`
- **Backups:** Managed by Supabase (automatic)

### Backend Hosting
- **Status:** ⚠️ **Not clearly deployed**
- **Code Present:** FastAPI backend exists in `backend/`
- **Deployment:** No clear production deployment path
- **Options:**
  1. Deploy to Vercel Serverless Functions (if API routes are minimal)
  2. Deploy to Render/Fly.io/Railway (if full backend needed)
  3. Migrate API routes to Next.js API routes (simplest)

**Recommendation:** Assess if backend is actively used. If minimal, migrate to Next.js API routes. If substantial, deploy separately.

---

## 5. CI/CD & Automation

### GitHub Actions Workflows

#### Core CI/CD
- **`ci.yml`** - Main CI pipeline
  - Lint (Python + TypeScript)
  - Type check (Python + TypeScript)
  - Tests (unit tests)
  - Build (frontend)
  - Coverage (non-blocking)

- **`frontend-deploy.yml`** - Frontend deployment
  - Build & test
  - Deploy to Vercel (preview/production)
  - PR comments with preview URLs

- **`supabase-migrate.yml`** - Database migrations
  - Runs on `main` push or manual trigger
  - Applies Supabase migrations

#### Additional Workflows (Review Needed)
- `preview-pr.yml` - PR preview with Lighthouse/Pa11y
- `deploy-main.yml` - Legacy production deploy (may be redundant)
- `env-smoke-test.yml` - Environment validation
- `env-validation.yml` - Environment variable checks
- `security-scan.yml` - Security scanning
- `performance-tests.yml` - Performance testing
- `privacy-ci.yml` - Privacy compliance checks
- `wiring-check.yml` - Integration health checks
- `vercel-guard.yml` - Vercel deployment guard
- Many others (30+ workflows total)

**Recommendation:** Audit all workflows, mark obsolete ones as deprecated, consolidate where possible.

### Package Manager & Lockfiles
- **Manager:** npm (consistent across repo)
- **Lockfiles:** 
  - `package-lock.json` (root)
  - `frontend/package-lock.json`
- **Status:** ✅ Consistent, no conflicts

### Node Version
- **Pinned:** Node 20.x (in `package.json` engines)
- **CI:** Node 20 (consistent across workflows)

---

## 6. Environment Variables & Secrets

### Documentation
- **Template:** `.env.example` (comprehensive, 235 lines)
- **Categories:**
  - Database (DATABASE_URL, Supabase URLs/keys)
  - Vercel (deployment tokens)
  - Security (SECRET_KEY, encryption keys)
  - Monitoring (Sentry, PostHog)
  - Integrations (Stripe, AWS, third-party APIs)

### Public vs Private
- **Public (NEXT_PUBLIC_*):** Supabase URLs/keys, PostHog, Sentry DSN
- **Private:** Service role keys, API secrets, database passwords

### Secrets Management
- **CI:** GitHub Secrets
- **Hosting:** Vercel Environment Variables
- **Database:** Supabase Dashboard

**Status:** ✅ Well-documented, needs normalization mapping (CI ↔ Hosting)

---

## 7. Testing & Quality

### Test Types
- **Unit Tests:** Jest (frontend), pytest (backend)
- **E2E Tests:** Playwright
- **Accessibility:** Pa11y CI, axe-core
- **Performance:** Lighthouse CI
- **Type Checking:** TypeScript, mypy (Python)

### Test Coverage
- **Frontend:** Jest coverage reports
- **Backend:** pytest-cov reports
- **CI:** Coverage uploaded to Codecov (non-blocking)

### Quality Gates
- **PR:** Lint, typecheck, tests, build
- **Main:** All checks + deployment
- **Optional:** Lighthouse, Pa11y (in preview-pr.yml)

---

## 8. Business Intent & User Flows

### Primary Purpose
**Floyo** tracks file usage patterns and suggests automation integrations.

### Core User Flows
1. **Sign Up** → Onboarding → Dashboard
2. **File Tracking** → Pattern Detection → Insights
3. **Integration Suggestions** → Action → Automation

### Key Features
- File system event tracking
- Pattern recognition (ML-based)
- Integration suggestions (Zapier, TikTok, Meta, etc.)
- Privacy-first monitoring
- Workflow automation

### User Personas
- Data analysts (CSV processing automation)
- Developers (script → deployment automation)
- Content creators (markdown → PDF → upload)
- Researchers (data analysis → visualization → sharing)

---

## 9. Notable Gaps & Red Flags

### ⚠️ Critical Issues

1. **Dual Database Tooling**
   - Supabase migrations + Prisma schema coexist
   - Need to clarify canonical approach
   - Risk: Schema drift

2. **Backend Deployment Unclear**
   - FastAPI backend exists but no deployment path
   - May need to migrate to Next.js API routes or deploy separately

3. **Workflow Proliferation**
   - 30+ GitHub Actions workflows
   - Some may be obsolete or redundant
   - Need audit and consolidation

### ⚠️ Medium Priority

4. **Migration Consolidation**
   - Single master migration file exists (good)
   - But Prisma schema may not align
   - Need validation script

5. **Environment Variable Mapping**
   - Well-documented but needs CI ↔ Hosting mapping
   - Some secrets may be duplicated

### ✅ Strengths

- **CI-First Approach:** No local CLI required ✅
- **Comprehensive Documentation:** README, env.example, docs/ ✅
- **Modern Stack:** Next.js, TypeScript, Supabase ✅
- **Security:** RLS policies, auth, rate limiting ✅
- **Testing:** Unit, E2E, accessibility, performance ✅

---

## 10. Recommendations

### Immediate Actions
1. **Clarify Database Strategy:** Choose Supabase migrations as canonical, align Prisma if needed
2. **Audit CI Workflows:** Mark obsolete workflows, consolidate duplicates
3. **Backend Deployment:** Decide on FastAPI deployment or migration to Next.js API routes
4. **Environment Mapping:** Create CI ↔ Hosting secrets mapping doc

### Short-Term Improvements
5. **Smoke Tests:** Add basic smoke tests for demo readiness
6. **Seed Data:** Create seed scripts for demo scenarios
7. **Demo Script:** Document demo flow and URLs
8. **Local Dev Guide:** Comprehensive setup instructions

### Long-Term Considerations
9. **Observability:** Add structured logging, error tracking (Sentry exists)
10. **Cost Monitoring:** Document service costs and limits
11. **Scaling:** Plan for multi-region, connection pooling, caching

---

## 11. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions (CI/CD)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   CI (lint,  │  │  Frontend    │  │  Supabase    │      │
│  │   test,      │  │  Deploy      │  │  Migrate     │      │
│  │   build)     │  │  (Vercel)    │  │  (DB)        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Production Environment                   │
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Frontend   │◄─────►│   Backend    │◄─────►│ Database │ │
│  │  (Next.js)   │      │  (FastAPI?)  │      │(Supabase) │ │
│  │  (Vercel)    │      │  (TBD)       │      │(Postgres) │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                     │                            │
│         │                     │                            │
│         ▼                     ▼                            │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │ Edge Functions│      │  Edge        │                  │
│  │ (Supabase)    │      │  Functions   │                  │
│  └──────────────┘      └──────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Next Steps

See:
- `docs/backend-strategy.md` - Backend & database strategy
- `docs/frontend-hosting-strategy.md` - Frontend hosting details
- `docs/env-and-secrets.md` - Environment variables mapping
- `docs/ci-overview.md` - CI/CD pipeline documentation
- `docs/local-dev.md` - Local development setup
- `docs/demo-script.md` - Demo readiness guide

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Discovery Complete
