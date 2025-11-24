# Stack Discovery Report

**Generated:** 2025-01-XX  
**Purpose:** Complete architectural overview of the Floyo monorepo

## Executive Summary

Floyo is a file usage pattern tracking system that suggests concrete, niche API integrations based on actual user routines. The repository is a monorepo with a Next.js frontend, Python FastAPI backend, and Supabase PostgreSQL database.

---

## 1. Architecture Overview

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **UI Components:** Radix UI primitives
- **Routing:** Next.js App Router (file-based)
- **Build Tool:** Next.js built-in (Webpack)
- **PWA:** Enabled via `next-pwa`

**Key Features:**
- Server-side rendering (SSR)
- Static site generation (SSG)
- Incremental static regeneration (ISR)
- API routes (Next.js API routes)
- Edge runtime support

### Backend
- **Framework:** FastAPI (Python)
- **Language:** Python 3.11+
- **ORM:** Prisma (via Prisma Client)
- **Database Access:** Direct PostgreSQL + Supabase client
- **Job Queue:** Celery (Redis-backed)
- **Caching:** Redis
- **API Style:** RESTful

**Key Features:**
- JWT authentication
- WebSocket support
- Background job processing
- Rate limiting
- Security middleware

### Database
- **Provider:** Supabase (PostgreSQL)
- **ORM:** Prisma (schema definition)
- **Migrations:** Supabase migrations (`supabase/migrations/`)
- **Schema Management:** 
  - Prisma schema: `prisma/schema.prisma`
  - Supabase migrations: `supabase/migrations/99999999999999_master_consolidated_schema.sql`
- **Extensions:** `uuid-ossp`, `pgcrypto`, `pg_trgm`

### Hosting & Infrastructure
- **Frontend Hosting:** Vercel
- **Database Hosting:** Supabase (managed PostgreSQL)
- **CI/CD:** GitHub Actions
- **Edge Functions:** Supabase Edge Functions (`supabase/functions/`)
- **CDN:** Vercel Edge Network

---

## 2. Code Structure

### Frontend Structure (`frontend/`)
```
frontend/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (Next.js API routes)
│   ├── (auth)/            # Auth-related pages
│   └── ...                # Feature pages
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and services
│   ├── api/              # API client
│   ├── db/               # Database (Prisma)
│   ├── services/         # Business logic services
│   └── ...
├── public/               # Static assets
└── tests/                # Tests (Jest + Playwright)
```

### Backend Structure (`backend/`)
```
backend/
├── api/                   # FastAPI route handlers
│   ├── v1/               # API versioning
│   └── ...
├── auth/                 # Authentication logic
├── jobs/                 # Background jobs (Celery)
├── services/             # Business logic services
├── middleware/           # FastAPI middleware
├── ml/                   # Machine learning models
└── ...
```

### Database Structure
- **Prisma Schema:** `prisma/schema.prisma` (447 lines, comprehensive schema)
- **Supabase Migrations:** `supabase/migrations/` (consolidated master schema)
- **Migration History:** Archived migrations in `supabase/migrations_archive/`

---

## 3. Data Flow

### Authentication Flow
1. User signs up/logs in → Frontend (`app/api/auth/*`)
2. JWT token generated → Stored in session
3. Token sent with requests → Backend validates via Supabase Auth
4. Session stored in `sessions` table

### Event Tracking Flow
1. File events tracked → Frontend (`app/api/events/route.ts`)
2. Events stored → `events` table via Prisma
3. Pattern analysis → Background jobs detect patterns
4. Suggestions generated → Stored in `patterns` table

### API Request Flow
```
Frontend (Next.js API Route)
  ↓
Backend (FastAPI) [if proxied]
  ↓
Supabase (PostgreSQL)
  ↓
Response → Frontend → UI
```

---

## 4. Configuration

### Environment Variables
- **Canonical Template:** `.env.example` (235 lines, comprehensive)
- **Validation:** `frontend/lib/env.ts` (Zod schemas)
- **Categories:**
  - Database (Supabase)
  - Vercel (deployment)
  - Security (secrets, JWT)
  - Integrations (Stripe, external APIs)
  - Monitoring (Sentry, PostHog)
  - Feature flags

### Build Configuration
- **Frontend:** `frontend/next.config.js` (PWA, optimizations)
- **Backend:** Python requirements (not visible in root)
- **Root:** `package.json` (monorepo scripts)

### Runtime Versions
- **Node.js:** >=20 <21 (pinned)
- **Python:** 3.11+ (from CI workflows)

---

## 5. CI/CD

### Active Workflows
1. **`ci.yml`** - Main CI pipeline
   - Lint (Python + TypeScript)
   - Type check
   - Unit tests
   - Build
   - Coverage (non-blocking)

2. **`frontend-deploy.yml`** - Frontend deployment
   - Build and test
   - Deploy to Vercel (preview/production)
   - PR comments with preview URLs

3. **`supabase-migrate.yml`** - Database migrations
   - Applies Supabase migrations
   - Schema validation

### Deprecated/Disabled Workflows
- **`deploy-main.yml`** - Marked as deprecated, disabled

### Workflow Triggers
- **Pull Requests:** Preview deployments
- **Push to main:** Production deployments
- **Manual:** `workflow_dispatch`

---

## 6. Persistence & Migrations

### Migration Systems
1. **Supabase Migrations**
   - Location: `supabase/migrations/`
   - Master schema: `99999999999999_master_consolidated_schema.sql`
   - CI: Applied via `supabase-migrate.yml`
   - Validation: `scripts/db-validate-schema.ts`

2. **Prisma Schema**
   - Location: `prisma/schema.prisma`
   - Purpose: ORM type definitions
   - Generation: `prisma generate`
   - Migration: `prisma migrate` (may be separate from Supabase)

### Schema Reconciliation
⚠️ **Potential Issue:** Two migration systems (Supabase + Prisma) may drift.  
**Recommendation:** Ensure Prisma schema matches Supabase migrations.

### Core Tables (from Prisma schema)
- `users` - User accounts
- `sessions` - Auth sessions
- `events` - File system events
- `patterns` - Detected usage patterns
- `relationships` - File relationships
- `subscriptions` - Billing
- `privacy_prefs` - Privacy settings
- `organizations` - Multi-tenant support
- `workflows` - Workflow definitions
- `audit_logs` - Compliance auditing

---

## 7. External Services

### Authentication
- **Supabase Auth** - JWT-based authentication

### Payment Processing
- **Stripe** - Subscription management

### Monitoring & Observability
- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **Vercel Analytics** - Web analytics

### Integrations
- **Zapier** - Workflow automation
- **Meta Ads** - Advertising
- **TikTok Ads** - Advertising
- **ElevenLabs** - Voice synthesis
- **MindStudio** - AI workflows

### Storage
- **AWS S3** - File exports
- **Cloudinary** - Image hosting

---

## 8. Known Gaps & Risk Areas

### ⚠️ High Priority
1. **Dual Migration Systems**
   - Prisma and Supabase migrations may drift
   - Need reconciliation strategy

2. **Backend Deployment**
   - No visible backend deployment workflow
   - Backend may be deployed separately or not deployed

3. **Environment Variable Drift**
   - Many env vars defined, need validation script
   - Some may be unused

### ⚠️ Medium Priority
1. **API Documentation**
   - No OpenAPI spec visible
   - Many API routes undocumented

2. **Test Coverage**
   - Tests exist but coverage unknown
   - E2E tests via Playwright

3. **Cost Optimization**
   - Multiple preview deployments
   - Potential unused Supabase features

### ⚠️ Low Priority
1. **Documentation**
   - Extensive docs in `docs/` but may be outdated
   - Need consolidation

2. **Dependency Management**
   - Multiple package managers possible
   - Need audit

---

## 9. Recommendations

### Immediate Actions
1. ✅ Create `env-doctor` script to validate environment variables
2. ✅ Reconcile Prisma schema with Supabase migrations
3. ✅ Document all API endpoints
4. ✅ Create backend deployment workflow (if needed)

### Short-term (30 days)
1. Generate OpenAPI spec from FastAPI
2. Consolidate migration strategy
3. Add API endpoint tests
4. Optimize CI/CD (reduce redundant workflows)

### Long-term (90 days)
1. Implement comprehensive monitoring
2. Add performance benchmarks
3. Optimize database queries
4. Implement caching strategy

---

## 10. Stack Summary

| Component | Technology | Version | Status |
|-----------|-----------|---------|--------|
| Frontend Framework | Next.js | 14.0.4 | ✅ Active |
| Frontend Language | TypeScript | 5.3.3 | ✅ Active |
| Backend Framework | FastAPI | Latest | ✅ Active |
| Backend Language | Python | 3.11+ | ✅ Active |
| Database | PostgreSQL (Supabase) | Latest | ✅ Active |
| ORM | Prisma | 5.7.0 | ✅ Active |
| Hosting (Frontend) | Vercel | Latest | ✅ Active |
| Hosting (Database) | Supabase | Latest | ✅ Active |
| CI/CD | GitHub Actions | Latest | ✅ Active |
| Package Manager | npm | Latest | ✅ Active |

---

**Next Steps:** See `docs/backend-strategy.md`, `docs/db-migrations-and-schema.md`, and `docs/api.md` for detailed analysis.
