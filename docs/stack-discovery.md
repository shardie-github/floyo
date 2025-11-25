# Stack Discovery & Architecture Analysis

**Generated:** 2025-01-20  
**Agent:** Unified Background Agent v3.0  
**Status:** Complete

## Executive Summary

This repository is a **full-stack SaaS application** for file usage pattern tracking and integration suggestions, built with modern TypeScript/React frontend and Python/FastAPI backend, deployed on Vercel with Supabase as the database and backend services provider.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  Next.js 14 (React 18, TypeScript)                          │
│  - App Router (Server Components + Client Components)       │
│  - PWA Support (Service Worker)                              │
│  - TailwindCSS + Radix UI                                    │
│  - React Query (TanStack Query) for data fetching           │
│  - Zustand for state management                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │ WebSocket (real-time)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                │
│  Next.js API Routes (frontend/app/api/*)                    │
│  FastAPI Backend (backend/api/*)                            │
│  Supabase Edge Functions (supabase/functions/*)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ PostgreSQL (via Prisma)
                            │ Supabase Auth
                            │ Supabase Storage
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  PostgreSQL (Supabase)                                       │
│  - Prisma ORM (schema.prisma)                               │
│  - Row Level Security (RLS) policies                         │
│  - Real-time subscriptions                                   │
│  Redis (Caching, Rate Limiting, Celery)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ External APIs
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATIONS                              │
│  Stripe (Payments)                                           │
│  Zapier (Workflow Automation)                               │
│  Meta Ads, TikTok Ads (Marketing)                            │
│  Sentry (Error Tracking)                                     │
│  PostHog (Analytics)                                         │
│  AWS S3 (File Storage)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework:** Next.js 14.0.4 (App Router)
- **Language:** TypeScript 5.3.3
- **UI Library:** React 18.2.0
- **Styling:** TailwindCSS 3.3.6 + Radix UI components
- **State Management:** Zustand 4.4.7
- **Data Fetching:** TanStack Query (React Query) 5.12.2
- **Forms:** React Hook Form (implied from patterns)
- **Animations:** Framer Motion 12.23.24
- **Charts:** Recharts 2.10.3
- **Workflows:** React Flow 11.11.4
- **PWA:** next-pwa 5.6.0
- **Internationalization:** next-intl 3.19.1

### Backend
- **Framework:** FastAPI 0.104.1+
- **Language:** Python 3.11+
- **ORM:** Prisma 5.7.0 (TypeScript), SQLAlchemy 2.0.23+ (Python)
- **Database:** PostgreSQL (via Supabase)
- **Migrations:** Alembic 1.12.1+ (Python), Prisma Migrate (TypeScript)
- **Background Jobs:** Celery 5.3.4+ with Redis
- **Rate Limiting:** slowapi 0.1.9+
- **Caching:** Redis 5.0.1+
- **ML/AI:** scikit-learn, pandas, numpy, transformers (optional)

### Database
- **Provider:** Supabase (PostgreSQL)
- **ORM:** Prisma Client
- **Schema Management:** Prisma Migrate + Supabase Migrations
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage + AWS S3

### Infrastructure & DevOps
- **Hosting:** Vercel (Frontend)
- **Database Hosting:** Supabase Cloud
- **CI/CD:** GitHub Actions (37 workflows)
- **Monitoring:** Sentry, PostHog
- **Error Tracking:** Sentry SDK
- **Analytics:** PostHog, Vercel Analytics

### Development Tools
- **Linting:** ESLint, Ruff (Python), Black (Python)
- **Type Checking:** TypeScript, mypy (Python)
- **Testing:** Jest, Playwright, pytest
- **Code Quality:** ts-prune, knip, depcheck, madge

## Data Flow

### User Authentication Flow
```
1. User → Frontend (Login Form)
2. Frontend → Supabase Auth API
3. Supabase → JWT Token
4. Frontend → Stores token in session
5. Frontend → API calls with Authorization header
6. Backend → Validates JWT via Supabase
7. Backend → Returns data
```

### File Event Tracking Flow
```
1. Desktop App/CLI → POST /api/telemetry/ingest
2. Backend → Validates user session
3. Backend → Stores event in PostgreSQL (events table)
4. Backend → Triggers pattern detection job (Celery)
5. Pattern Detection → Analyzes events, updates patterns table
6. Frontend → Queries patterns via GET /api/patterns
7. Frontend → Displays insights and suggestions
```

### Workflow Execution Flow
```
1. User → Creates workflow in UI
2. Frontend → POST /api/workflows
3. Backend → Stores workflow definition
4. Workflow Scheduler → Triggers execution
5. Executor → Runs workflow steps
6. Results → Stored in workflow_executions table
7. Frontend → Polls for status updates
```

## Environment Variables

### Required (Production)
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase anonymous key

### Optional (Feature Flags)
- `SENTRY_DSN` - Error tracking
- `NEXT_PUBLIC_POSTHOG_KEY` - Analytics
- `STRIPE_API_KEY` - Payment processing
- `REDIS_URL` - Caching and rate limiting
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - File storage

**See `.env.example` for complete list (235+ variables documented)**

## Database Schema

### Core Models (Prisma)
- **User** - User accounts with email/password or OAuth
- **Session** - Authentication sessions
- **Event** - File system events (created, modified, accessed, deleted)
- **Pattern** - Detected file usage patterns
- **Relationship** - File-to-file relationships
- **Subscription** - Billing and plan management
- **Organization** - Multi-tenant organizations
- **Workflow** - Workflow definitions and executions
- **UserIntegration** - Third-party integrations (Zapier, Meta, TikTok, etc.)

### Privacy & Compliance Models
- **PrivacyPrefs** - User privacy preferences
- **AppAllowlist** - App-level permissions
- **SignalToggle** - Granular signal controls
- **TelemetryEvent** - Privacy-first telemetry events
- **PrivacyTransparencyLog** - Audit trail for privacy actions
- **AuditLog** - General audit logging
- **RetentionPolicy** - Data retention policies

### Analytics Models
- **UTMTrack** - UTM tracking for growth
- **Cohort** - Cohort analysis
- **MetricsLog** - System metrics
- **NPSSubmission** - Net Promoter Score submissions

**Total:** 20+ models with comprehensive relationships

## API Endpoints

### Frontend API Routes (Next.js)
- **95+ routes** in `frontend/app/api/*`
- Categories:
  - Authentication (`/api/auth/*`)
  - Privacy (`/api/privacy/*`)
  - Analytics (`/api/analytics/*`)
  - Integrations (`/api/integrations/*`)
  - Workflows (`/api/workflows/*`)
  - Billing (`/api/billing/*`)
  - Admin (`/api/admin/*`)
  - Telemetry (`/api/telemetry/*`)

### Backend API Routes (FastAPI)
- **38+ endpoints** in `backend/api/*`
- Categories:
  - REST API (`/api/v1/*`)
  - WebSocket (`/api/websocket`)
  - Admin (`/api/admin`)
  - Integrations (`/api/integrations/*`)

### Supabase Edge Functions
- `analyze-patterns` - Pattern analysis
- `analyze-performance` - Performance analysis
- `generate-suggestions` - AI-powered suggestions
- `ingest-telemetry` - Telemetry ingestion

## CI/CD Pipeline

### GitHub Actions Workflows (37 total)

**Core CI:**
- `ci.yml` - Lint, type-check, test, build, coverage
- `ci-integration.yml` - Integration tests
- `ci-performance.yml` - Performance tests
- `ci-intent-tests.yml` - Intent-based tests

**Deployment:**
- `frontend-deploy.yml` - Frontend deployment (Preview + Production)
- `backend-deploy.yml` - Backend deployment
- `supabase-migrate.yml` - Database migrations
- `preview-pr.yml` - PR preview deployments

**Quality Assurance:**
- `security-scan.yml` - Security scanning
- `privacy-ci.yml` - Privacy compliance checks
- `bundle-analyzer.yml` - Bundle size analysis
- `performance-tests.yml` - Performance benchmarks

**Monitoring:**
- `system_health.yml` - System health checks
- `telemetry.yml` - Telemetry collection
- `weekly-maint.yml` - Weekly maintenance

**Specialized:**
- `unified-agent.yml` - Autonomous agent runs
- `wiring-check.yml` - Dependency wiring validation
- `on_failure_doctor.yml` - Failure diagnostics

## Dependencies

### Frontend Dependencies
- **Production:** 68 packages
- **Dev:** 15 packages
- **Key:** Next.js, React, TypeScript, TailwindCSS, Radix UI, React Query, Zustand

### Backend Dependencies
- **Production:** 30+ packages
- **Key:** FastAPI, SQLAlchemy, Prisma, Celery, Redis, Sentry, Stripe

### Root Dependencies
- **Production:** 9 packages (CLI tools, Prisma, Zod)
- **Dev:** 25 packages (Testing, linting, tooling)

## Security Posture

### Implemented
- ✅ Row Level Security (RLS) policies in Supabase
- ✅ JWT authentication via Supabase Auth
- ✅ CSRF protection middleware
- ✅ Rate limiting (slowapi + Redis)
- ✅ Input validation (Zod schemas, Pydantic models)
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Secrets scanning scripts
- ✅ Audit logging
- ✅ MFA support (2FA)

### Areas for Improvement
- ⚠️ OpenAPI documentation generation (incomplete)
- ⚠️ API rate limiting per endpoint (needs review)
- ⚠️ Secrets rotation automation
- ⚠️ Dependency vulnerability scanning automation

## Performance Characteristics

### Frontend Optimizations
- ✅ Code splitting (webpack optimization)
- ✅ Image optimization (Next.js Image component)
- ✅ PWA caching strategies
- ✅ Bundle size monitoring
- ✅ Lazy loading components
- ✅ ISR (Incremental Static Regeneration)

### Backend Optimizations
- ✅ Database indexes (Prisma schema)
- ✅ Redis caching
- ✅ Celery background jobs
- ✅ Connection pooling (Supabase)
- ⚠️ Query optimization (needs review)

## Cost Analysis

### Current Hosting Costs (Estimated)
- **Vercel:** Free tier (Hobby) or Pro ($20/mo)
- **Supabase:** Free tier or Pro ($25/mo)
- **Redis:** Free tier or paid ($10-50/mo)
- **AWS S3:** Pay-per-use (~$5-20/mo)
- **Stripe:** Transaction fees only

### Optimization Opportunities
- ⚠️ Database query optimization (reduce Supabase usage)
- ⚠️ Redis caching strategy (reduce cache misses)
- ⚠️ Bundle size reduction (reduce Vercel bandwidth)
- ⚠️ Background job optimization (reduce compute)

## Risk Heatmap

### High Risk Areas
1. **Database Migrations** - Multiple migration files, potential drift
2. **Environment Variables** - 235+ variables, potential inconsistencies
3. **API Endpoint Coverage** - 95+ routes, incomplete OpenAPI docs
4. **Dependency Updates** - Large dependency tree, potential vulnerabilities

### Medium Risk Areas
1. **Type Safety** - Mix of TypeScript and Python, potential type mismatches
2. **Error Handling** - Inconsistent error handling patterns
3. **Testing Coverage** - Unit tests exist but coverage unknown
4. **Documentation** - Scattered documentation, needs consolidation

### Low Risk Areas
1. **CI/CD** - Well-structured workflows
2. **Security** - Good security practices implemented
3. **Performance** - Optimizations in place
4. **Code Quality** - Linting and type checking enforced

## Misalignments & Issues

### Critical
1. ❌ **Migration Drift** - Multiple migration files, master schema exists but historical migrations archived
2. ❌ **OpenAPI Docs** - Incomplete API documentation
3. ❌ **Environment Parity** - No validation script for dev/staging/prod parity

### Important
1. ⚠️ **Type Safety** - Backend Python types don't match frontend TypeScript types
2. ⚠️ **API Consistency** - Frontend routes vs backend endpoints need reconciliation
3. ⚠️ **Dependency Health** - No automated dependency update process

### Minor
1. ℹ️ **Documentation** - Scattered across multiple files
2. ℹ️ **Test Coverage** - No coverage reports visible
3. ℹ️ **Bundle Analysis** - Not automated in CI

## Safe Fixes to Apply

### Immediate (Safe)
1. ✅ Generate OpenAPI specification from existing routes
2. ✅ Create environment validation script
3. ✅ Consolidate documentation structure
4. ✅ Add dependency health monitoring
5. ✅ Create API endpoint audit script

### Short-term (Review Required)
1. ⚠️ Reconcile database migrations
2. ⚠️ Align TypeScript types with Python types
3. ⚠️ Standardize error handling
4. ⚠️ Add test coverage reporting

### Long-term (Planning Required)
1. 📋 Migrate to unified API layer
2. 📋 Implement GraphQL or tRPC for type safety
3. 📋 Add comprehensive E2E test suite
4. 📋 Implement feature flags system

## Next Steps

1. **Mode 2:** Strategic Backend Evaluator - Analyze current Supabase setup
2. **Mode 3:** Migration & Schema Orchestrator - Reconcile migrations
3. **Mode 4:** API Truth Reconciliation - Generate OpenAPI docs
4. **Mode 5:** Secrets & Drift Guardian - Validate environment variables
5. **Mode 6:** Cost Optimization - Analyze and optimize costs
6. **Mode 7:** Deploy Hardener - Review and fix CI/CD workflows

---

**Generated by Unified Background Agent v3.0**  
**Last Updated:** 2025-01-20
