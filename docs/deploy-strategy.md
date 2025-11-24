# Deployment Strategy - Canonical Paths

**Last Updated:** 2025-01-XX  
**Status:** ✅ Canonical Deployment Strategy Defined  
**Purpose:** Source of truth for Preview and Production deployments

---

## Executive Summary

**Canonical Host:** Vercel  
**Deployment Method:** GitHub Actions (CI-first, no local CLI required)  
**Primary Workflow:** `frontend-deploy.yml`  
**Preview Deployments:** Per-PR via `frontend-deploy.yml`  
**Production Deployments:** Push to `main` via `frontend-deploy.yml`

---

## 1. Preview Deployment (Pull Requests)

### Trigger
- **Event:** Pull request opened/updated to `main` branch
- **Workflow:** `.github/workflows/frontend-deploy.yml`
- **Job:** `deploy` (runs after `build-and-test` succeeds)

### Flow
1. **PR Created/Updated:**
   - `ci.yml` → Quality checks (lint, typecheck, test, build)
   - `frontend-deploy.yml` → `build-and-test` job:
     - Checkout repository
     - Setup Node.js 20
     - Install dependencies (`npm ci` in root + frontend)
     - Run lint (`npm run lint`)
     - Run tests (`npm test`)
     - Run typecheck (`npm run typecheck`)
     - Build Next.js (`npm run build`)
   - `frontend-deploy.yml` → `deploy` job:
     - Install Vercel CLI (`npm install -g vercel@latest`)
     - Determine environment (`preview` for PRs)
     - Pull Vercel config (`vercel pull --environment=preview`)
     - Build with Vercel (`vercel build`)
     - Deploy preview (`vercel deploy --prebuilt --prod=false`)
     - Comment PR with preview URL

### Expected Outcome
- ✅ Preview URL appears in PR comments
- ✅ Preview deployment accessible at `https://<project>-<hash>.vercel.app`
- ✅ Preview uses Preview environment variables from Vercel Dashboard

### Required Secrets (GitHub)
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (for build)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (for build)

### Required Environment Variables (Vercel Dashboard)
- `NEXT_PUBLIC_SUPABASE_URL` - Preview environment
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Preview environment
- `SUPABASE_SERVICE_ROLE_KEY` - Preview environment (if needed)
- `DATABASE_URL` - Preview environment (if needed)

---

## 2. Production Deployment (Main Branch)

### Trigger
- **Event:** Push to `main` branch
- **Workflow:** `.github/workflows/frontend-deploy.yml`
- **Job:** `deploy` (runs after `build-and-test` succeeds)

### Flow
1. **Push to Main:**
   - `ci.yml` → Quality checks (lint, typecheck, test, build)
   - `frontend-deploy.yml` → `build-and-test` job:
     - Same as Preview (lint, test, typecheck, build)
   - `frontend-deploy.yml` → `deploy` job:
     - Install Vercel CLI
     - Determine environment (`production` for main)
     - Pull Vercel config (`vercel pull --environment=production`)
     - Build with Vercel (`vercel build`)
     - Deploy production (`vercel deploy --prebuilt --prod=true`)
   - `supabase-migrate.yml` → Database migrations (if migrations changed)

### Expected Outcome
- ✅ Production deployment accessible at `https://<project>.vercel.app`
- ✅ Production uses Production environment variables from Vercel Dashboard
- ✅ Zero-downtime deployment (Vercel handles)

### Required Secrets (GitHub)
- Same as Preview (see above)

### Required Environment Variables (Vercel Dashboard)
- `NEXT_PUBLIC_SUPABASE_URL` - Production environment
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production environment
- `SUPABASE_SERVICE_ROLE_KEY` - Production environment (if needed)
- `DATABASE_URL` - Production environment (if needed)

---

## 3. Workflow Roles

### Primary Workflows

| Workflow | Purpose | Triggers | Status |
|----------|---------|----------|--------|
| `ci.yml` | Quality gates (lint, typecheck, test, build) | PR + Push to main | ✅ Required |
| `frontend-deploy.yml` | **Primary deployment** (Preview + Production) | PR + Push to main | ✅ Required |
| `supabase-migrate.yml` | Database migrations | Push to main (if migrations changed) | ✅ Required (when migrations exist) |

### Supplementary Workflows

| Workflow | Purpose | Triggers | Status |
|----------|---------|----------|--------|
| `preview-pr.yml` | Quality gates (Lighthouse, Pa11y) + Preview deploy | PR | ⚠️ Optional |
| `env-validation.yml` | Environment variable validation | PR (if env files changed) | ⚠️ Optional |
| `security-scan.yml` | Security vulnerability scanning | PR + Push | ⚠️ Optional |

### Deprecated Workflows

| Workflow | Purpose | Status | Action |
|----------|---------|--------|--------|
| `deploy-main.yml` | Legacy production deploy | ⚠️ Deprecated | Disable or consolidate |

---

## 4. Vercel Project Configuration

### Expected Project Settings

**Project Name:** (To be confirmed in Vercel Dashboard)  
**Organization:** (To be confirmed in Vercel Dashboard)  
**Framework:** Next.js  
**Root Directory:** `frontend` (or root, depending on Vercel config)  
**Build Command:** `cd frontend && npm ci && npm run build` (from `vercel.json`)  
**Output Directory:** `frontend/.next` (from `vercel.json`)

### Git Integration

**Status:** ⚠️ **MUST BE DISABLED** if using GitHub Actions

**Rationale:**
- GitHub Actions handles all deployments
- Vercel Git Integration would cause conflicts (double deployments)
- CI-first approach (no local CLI required)

**How to Disable:**
1. Vercel Dashboard → Project → Settings → Git
2. Disconnect repository or disable automatic deployments
3. Keep manual deployments disabled

**Alternative:** If Vercel Git Integration is preferred, remove GitHub Actions deploy workflows and rely solely on Vercel's native integration.

---

## 5. Environment Variables Mapping

### GitHub Secrets → Vercel Environment Variables

| GitHub Secret | Vercel Variable | Purpose | Required For |
|---------------|-----------------|---------|--------------|
| `VERCEL_TOKEN` | - | CI deployment auth | CI workflows |
| `VERCEL_ORG_ID` | - | CI deployment org | CI workflows |
| `VERCEL_PROJECT_ID` | - | CI deployment project | CI workflows |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | Both |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + Runtime | Both |
| - | `SUPABASE_SERVICE_ROLE_KEY` | Runtime only | Vercel |
| - | `DATABASE_URL` | Runtime only | Vercel |

**Note:** `NEXT_PUBLIC_*` variables must exist in both GitHub Secrets (for CI builds) and Vercel Dashboard (for runtime).

---

## 6. Deployment Verification

### Preview Deployment Verification

**Checklist:**
- [ ] PR created/updated
- [ ] `frontend-deploy.yml` workflow triggered
- [ ] `build-and-test` job passes
- [ ] `deploy` job runs (not skipped)
- [ ] Preview URL appears in PR comments
- [ ] Preview URL accessible and functional

**If Preview Fails:**
1. Check GitHub Actions logs for `frontend-deploy.yml`
2. Verify required secrets are set (see `env-and-secrets.md`)
3. Check Vercel Dashboard → Deployments for errors
4. Run `deploy-doctor` script (see `deploy-reliability-plan.md`)

### Production Deployment Verification

**Checklist:**
- [ ] Push to `main` branch
- [ ] `frontend-deploy.yml` workflow triggered
- [ ] `build-and-test` job passes
- [ ] `deploy` job runs (not skipped)
- [ ] Production URL accessible and functional
- [ ] Database migrations applied (if applicable)

**If Production Fails:**
1. Check GitHub Actions logs for `frontend-deploy.yml`
2. Verify required secrets are set
3. Check Vercel Dashboard → Deployments for errors
4. Verify Vercel Git Integration is disabled
5. Run `deploy-doctor` script

---

## 7. Rollback Procedure

### Via Vercel Dashboard
1. Vercel Dashboard → Project → Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

### Via GitHub
1. Revert commit: `git revert <commit-hash>`
2. Push to `main`
3. New deployment will be created automatically

---

## 8. Branch Protection Rules

### Required Checks for `main` Branch

**Minimum Required:**
1. ✅ `ci.yml` - Quality gates (lint, typecheck, test, build)
2. ✅ `frontend-deploy.yml` - Build and test (deploy can be optional)

**Recommended:**
3. ⚠️ `frontend-deploy.yml` - Deploy job (for production deployments)
4. ⚠️ `supabase-migrate.yml` - Database migrations (if migrations exist)

**Optional (Non-blocking):**
- `preview-pr.yml` - Quality gates
- `security-scan.yml` - Security scanning
- `env-validation.yml` - Environment validation

---

## 9. Troubleshooting

See:
- `docs/vercel-troubleshooting.md` - Vercel-specific issues
- `docs/deploy-reliability-plan.md` - Step-by-step troubleshooting
- `docs/env-and-secrets.md` - Environment variable issues

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Canonical Deployment Strategy Documented
