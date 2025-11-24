# CI/CD Overview

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive guide to CI/CD workflows and processes

## Overview

This repository uses GitHub Actions for continuous integration and deployment. All workflows are located in `.github/workflows/`.

---

## Active Workflows

### 1. Main CI Pipeline (`ci.yml`)

**Purpose:** Core CI checks for all pull requests and pushes

**Triggers:**
- Pull requests to `main`
- Pushes to `main`

**Jobs:**
1. **Lint** - Python (ruff, black) + TypeScript (ESLint)
2. **Type Check** - Python (mypy) + TypeScript (tsc)
3. **Test Fast** - Unit tests (Python pytest + Jest)
4. **Build** - Frontend Next.js build
5. **Coverage** - Test coverage (non-blocking)
6. **Bundle Size** - Bundle size check (non-blocking)

**Concurrency:** Cancels in-progress runs on new PR updates

**Status:** ✅ Active

---

### 2. Frontend Deployment (`frontend-deploy.yml`)

**Purpose:** Deploy frontend to Vercel (preview/production)

**Triggers:**
- Pull requests to `main` → Preview deployment
- Push to `main` → Production deployment
- Manual (`workflow_dispatch`)

**Jobs:**
1. **Build and Test**
   - Install dependencies
   - Lint
   - Run tests
   - Type check
   - Build Next.js

2. **Deploy**
   - Validate secrets
   - Determine environment (preview/production)
   - Vercel pull configuration
   - Vercel build
   - Deploy to Vercel
   - Comment PR with preview URL

**Concurrency:** Single deployment per branch

**Status:** ✅ Active (Primary deployment workflow)

---

### 3. Supabase Migrations (`supabase-migrate.yml`)

**Purpose:** Apply database migrations to Supabase

**Triggers:**
- Push to `main`
- Manual (`workflow_dispatch`)

**Steps:**
1. Checkout repository
2. Setup Node.js
3. Login to Supabase
4. Link Supabase project
5. Apply migrations (`supabase migration up`)
6. Validate schema (`scripts/db-validate-schema.ts`)

**Concurrency:** Single migration at a time (no cancellation)

**Status:** ✅ Active

**⚠️ Important:** Migrations run independently of deployments. Ensure migrations are applied before deploying code that depends on schema changes.

---

### 4. Preview PR (`preview-pr.yml`)

**Purpose:** Additional quality gates (Lighthouse, Pa11y) for PRs

**Triggers:**
- Pull requests to `main`
- Manual (`workflow_dispatch`)

**Jobs:**
1. Typecheck & Lint
2. Build Next.js
3. Validate secrets
4. Start server
5. Lighthouse (mobile)
6. Accessibility (Pa11y)
7. Upload QA artifacts
8. Supabase schema check (dry-run)
9. Vercel preview deployment
10. Comment PR with preview URL

**Status:** ✅ Active (Supplementary to `frontend-deploy.yml`)

**Note:** This workflow provides additional quality checks beyond the main frontend deployment.

---

## Deprecated/Disabled Workflows

### `deploy-main.yml`

**Status:** ❌ Deprecated and Disabled

**Reason:** Superseded by `frontend-deploy.yml`

**Note:** Marked as deprecated with `if: false` to prevent accidental execution.

---

## Workflow Triggers

### Pull Requests

**Triggers:**
- `ci.yml` - CI checks
- `frontend-deploy.yml` - Preview deployment
- `preview-pr.yml` - Quality gates + preview

**Result:**
- Preview deployments on Vercel
- PR comments with preview URLs
- CI checks must pass

### Push to Main

**Triggers:**
- `ci.yml` - CI checks
- `frontend-deploy.yml` - Production deployment
- `supabase-migrate.yml` - Database migrations

**Result:**
- Production deployment on Vercel
- Database migrations applied
- CI checks must pass

### Manual (`workflow_dispatch`)

**Available for:**
- `frontend-deploy.yml`
- `supabase-migrate.yml`
- `preview-pr.yml`

**Use Case:** Re-run workflows, deploy specific branches, apply migrations manually

---

## Required Secrets

### GitHub Secrets

**Location:** GitHub → Settings → Secrets and variables → Actions

**Required Secrets:**

| Secret | Used By | Purpose |
|--------|---------|---------|
| `VERCEL_TOKEN` | `frontend-deploy.yml`, `preview-pr.yml` | Vercel deployment authentication |
| `VERCEL_ORG_ID` | `frontend-deploy.yml`, `preview-pr.yml` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | `frontend-deploy.yml`, `preview-pr.yml` | Vercel project ID |
| `SUPABASE_ACCESS_TOKEN` | `supabase-migrate.yml`, `preview-pr.yml` | Supabase CLI authentication |
| `SUPABASE_PROJECT_REF` | `supabase-migrate.yml`, `preview-pr.yml` | Supabase project reference |

**Optional Secrets:**

| Secret | Used By | Purpose |
|--------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `ci.yml`, `frontend-deploy.yml` | Build-time env var (fallback) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ci.yml`, `frontend-deploy.yml` | Build-time env var (fallback) |
| `SUPABASE_DB_PASSWORD` | `preview-pr.yml` | Database password (if needed) |

**Setup:** See `docs/env-and-secrets.md` for detailed instructions.

---

## Runtime Versions

### Node.js
- **Version:** 20.x (pinned)
- **Package Manager:** npm
- **Lockfile:** `package-lock.json`

### Python
- **Version:** 3.11 (pinned)
- **Package Manager:** pip
- **Requirements:** `backend/requirements.txt`

---

## Build Process

### Frontend Build

**Command:** `npm run build` (in `frontend/` directory)

**Steps:**
1. Install dependencies (`npm ci`)
2. Lint (`npm run lint`)
3. Type check (`npm run type-check`)
4. Tests (`npm test`)
5. Build Next.js (`npm run build`)

**Output:** `.next/` directory

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` (required for build)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required for build)

### Backend Build

**Current Status:** ❌ No backend deployment workflow

**Note:** Backend may be:
- Deployed separately (not via GitHub Actions)
- Not deployed (local development only)
- Deployed manually

**Recommendation:** Document backend deployment process or create workflow.

---

## Deployment Strategy

### Preview Deployments

**Trigger:** Pull requests to `main`

**Workflow:** `frontend-deploy.yml`

**Process:**
1. Build and test
2. Deploy to Vercel Preview
3. Comment PR with preview URL

**Environment:** Uses Vercel Preview environment variables

**URL Format:** `https://<project>-<hash>.vercel.app`

### Production Deployments

**Trigger:** Push to `main`

**Workflow:** `frontend-deploy.yml`

**Process:**
1. Build and test
2. Deploy to Vercel Production
3. Output deployment URL

**Environment:** Uses Vercel Production environment variables

**URL Format:** `https://<project>.vercel.app` (or custom domain)

---

## Database Migrations

### Migration Workflow

**File:** `supabase-migrate.yml`

**Process:**
1. Login to Supabase
2. Link project
3. Apply migrations (`supabase migration up`)
4. Validate schema

**Timing:** Runs independently of deployments

**⚠️ Important:** 
- Migrations run **before** deployments (on push to main)
- Ensure migrations are applied before deploying code that depends on schema changes
- Test migrations locally before pushing

---

## Quality Gates

### Required Checks

**Must Pass:**
- Lint (Python + TypeScript)
- Type check (Python + TypeScript)
- Unit tests (Python + TypeScript)
- Build (Frontend)

**Optional Checks:**
- Coverage (non-blocking)
- Bundle size (non-blocking)
- Lighthouse (in `preview-pr.yml`)
- Accessibility (in `preview-pr.yml`)

### Branch Protection

**Recommended:** Protect `main` branch with:
- Require status checks (lint, type-check, test, build)
- Require up-to-date branches
- Require pull request reviews

---

## Troubleshooting

### Workflow Fails

**Common Causes:**
1. Missing secrets
2. Build errors
3. Test failures
4. Migration failures

**Steps:**
1. Check workflow logs in GitHub Actions
2. Verify secrets are set correctly
3. Test locally: `npm run ci`
4. Check for recent changes that might have broken CI

### Deployment Fails

**Common Causes:**
1. Missing Vercel secrets
2. Build errors
3. Environment variable issues

**Steps:**
1. Check `frontend-deploy.yml` logs
2. Verify Vercel secrets are set
3. Check Vercel Dashboard → Environment Variables
4. Test build locally: `cd frontend && npm run build`

### Migration Fails

**Common Causes:**
1. Missing Supabase secrets
2. Migration syntax errors
3. Schema conflicts

**Steps:**
1. Check `supabase-migrate.yml` logs
2. Verify Supabase secrets are set
3. Test migrations locally: `supabase start && supabase migration up`
4. Check migration file syntax

---

## Best Practices

### 1. Keep Workflows Fast

- Use caching (`cache: 'npm'`)
- Run tests in parallel
- Skip unnecessary checks

### 2. Fail Fast

- Run lint/type-check before tests
- Run fast tests before slow tests
- Use `continue-on-error: false` for critical checks

### 3. Clear Error Messages

- Validate secrets with helpful error messages
- Provide troubleshooting links
- Document common issues

### 4. Security

- Never commit secrets
- Use GitHub Secrets
- Rotate secrets regularly
- Use least-privilege access

### 5. Monitoring

- Monitor workflow success rates
- Track deployment frequency
- Alert on failures

---

## Related Documentation

- [Deploy Strategy](./deploy-strategy.md) - Deployment details
- [Environment Variables](./env-and-secrets.md) - Secrets management
- [Stack Discovery](./stack-discovery.md) - Overall architecture

---

## Quick Reference

### Run CI Locally

```bash
# Full CI pipeline
npm run ci

# Individual checks
npm run lint
npm run type-check
npm test
npm run build
```

### Manual Deployment

```bash
# Preview
cd frontend
vercel deploy --prebuilt --token=$VERCEL_TOKEN

# Production
cd frontend
vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

### Manual Migration

```bash
# Apply migrations
supabase migration up

# Validate schema
tsx scripts/db-validate-schema.ts
```

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent
