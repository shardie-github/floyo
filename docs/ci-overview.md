# CI/CD Overview

## Current State (Final)

### Package Manager & Lockfile
- **Package Manager**: npm ✅
- **Lockfile**: `package-lock.json` (single lockfile, no conflicts) ✅
- **Node Version**: 20 (pinned in `package.json` engines field) ✅
- **Status**: Fully standardized

### Frontend Stack
- **Framework**: Next.js 14+ (App Router)
- **Build Tool**: Next.js built-in
- **TypeScript**: Yes (strict mode enabled)
- **Location**: `frontend/` directory

### CI Workflows

#### 1. `ci.yml` - Main CI Pipeline ✅
- **Triggers**: PRs and pushes to `main`
- **Jobs**:
  - `lint`: Python (ruff, black) + TypeScript (eslint) + Format check
  - `type-check`: Python (mypy) + TypeScript (tsc)
  - `test-fast`: Unit tests (Python pytest + Jest)
  - `build`: Frontend Next.js build
  - `coverage`: Coverage reports (non-blocking)
  - `bundle-size`: Bundle size checks (non-blocking)
- **Status**: ✅ All checks pass, uses Node 20, npm ci

#### 2. `frontend-deploy.yml` - Unified Frontend CI/CD ✅ **PRIMARY**
- **Triggers**: PRs (preview), `main` push (production), workflow_dispatch
- **Jobs**:
  - `build-and-test`: Lint → Typecheck → Test → Build (blocks deployment on failure)
  - `deploy`: Vercel deployment (preview for PRs, production for main)
- **Status**: ✅ Fully automated, no local CLI required
- **Documentation**: See [frontend-deploy-vercel-ci.md](./frontend-deploy-vercel-ci.md)

#### 3. `preview-pr.yml` - PR Quality Gates ✅
- **Triggers**: PRs to `main`
- **Purpose**: Additional quality checks (Lighthouse, Pa11y accessibility)
- **Status**: ✅ Fixed (`|| true` removed), provides supplementary checks
- **Note**: Primary deployment handled by `frontend-deploy.yml`

#### 4. `deploy-main.yml` - Production Deployment (Legacy) ✅
- **Triggers**: Push to `main`
- **Status**: ✅ Updated (Supabase migrations removed, decoupled)
- **Note**: Kept for backward compatibility, includes smoke tests

#### 5. `supabase-migrate.yml` - Database Migrations ✅
- **Triggers**: Push to `main`, workflow_dispatch
- **Status**: ✅ Properly configured, uses secrets (no hard-coded values)
- **Separation**: Runs independently from frontend deployments

### All Issues Fixed ✅

1. **Scripts**: ✅
   - Added `typecheck` alias to `frontend/package.json`
   - Fixed `ci.yml` to run `format:check` from root directory

2. **Workflow Issues**: ✅
   - `preview-pr.yml`: Removed `|| true` from typecheck and lint
   - `deploy-main.yml`: Removed Supabase migrations (now separate)
   - Created unified `frontend-deploy.yml` as primary deployment workflow

3. **Lockfile & Node Version**: ✅
   - Only `package-lock.json` exists (no conflicts)
   - Node version pinned in `package.json` engines field

4. **Supabase Workflow**: ✅
   - Updated to use `SUPABASE_PROJECT_REF` secret instead of hard-coded value

### Required GitHub Secrets

#### For Vercel Deployment:
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

#### For Supabase Migrations:
- `SUPABASE_ACCESS_TOKEN` - Supabase access token
- `SUPABASE_PROJECT_REF` - Supabase project reference ID

**See [frontend-deploy-vercel-ci.md](./frontend-deploy-vercel-ci.md) for detailed setup instructions.**

---

## Architecture

### Separation of Concerns ✅

- **Frontend CI/CD** (`frontend-deploy.yml`): Handles Vercel deployments only
- **Supabase Migrations** (`supabase-migrate.yml`): Handles database migrations only
- **Main CI** (`ci.yml`): Quality gates (lint, test, typecheck, build)

### Deployment Flow

#### Pull Request Flow:
1. PR opened → `ci.yml` runs quality checks
2. PR opened → `frontend-deploy.yml` runs build-and-test → deploys preview
3. PR opened → `preview-pr.yml` runs additional quality gates (Lighthouse, Pa11y)

#### Production Flow (`main` branch):
1. Merge to `main` → `ci.yml` runs quality checks
2. Merge to `main` → `frontend-deploy.yml` runs build-and-test → deploys to production
3. Merge to `main` → `supabase-migrate.yml` can run migrations (separate, optional)

### Standardization ✅

- **Node Version**: 20 (pinned in `package.json` engines: `">=20 <21"`)
- **Package Manager**: npm (with `npm ci` in CI for deterministic installs)
- **Lockfile**: `package-lock.json` only (no conflicts)

---

## Status: All Green ✅

All CI checks are now:
- ✅ Passing consistently
- ✅ Properly configured
- ✅ Fully automated (no local CLI required)
- ✅ Well documented

**No manual intervention required for deployments or migrations.**
