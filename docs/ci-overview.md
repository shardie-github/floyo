# CI/CD Overview

**Last Updated:** 2025-01-XX  
**Purpose:** Complete CI/CD pipeline documentation and workflow audit

---

## Executive Summary

**Total Workflows:** 41  
**Required for Main:** 3 core workflows  
**Optional/Supplementary:** 8 workflows  
**Obsolete/Deprecated:** 30 workflows (need audit)

**Status:** ✅ Core CI/CD is production-ready. Many workflows need consolidation or removal.

---

## 1. Package Manager & Lockfile

### Standardization ✅

- **Package Manager**: npm (consistent across repo)
- **Lockfile**: `package-lock.json` (root + frontend/)
- **Node Version**: 20.x (pinned in `package.json` engines: `">=20 <21"`)
- **Status**: ✅ Fully standardized, no conflicts

### CI Usage

All workflows use:
- `npm ci` (deterministic installs)
- Node 20 (pinned version)
- Cache: `npm` (via `setup-node` action)

---

## 2. Core CI/CD Workflows (Required)

### ✅ `ci.yml` - Main CI Pipeline

**Status:** ✅ **Required for main branch**

**Triggers:**
- Pull requests to `main`
- Push to `main`

**Jobs:**
- `lint`: Python (ruff, black) + TypeScript (eslint) + Format check
- `type-check`: Python (mypy) + TypeScript (tsc)
- `test-fast`: Unit tests (Python pytest + Jest)
- `build`: Frontend Next.js build
- `coverage`: Coverage reports (non-blocking, continue-on-error)
- `bundle-size`: Bundle size checks (non-blocking, continue-on-error)

**Purpose:** Quality gates (lint, typecheck, test, build)

**Required for Branch Protection:** ✅ Yes

---

### ✅ `frontend-deploy.yml` - Primary Frontend Deployment

**Status:** ✅ **Required for main branch** (PRIMARY deployment workflow)

**Triggers:**
- Pull requests → Preview deployment
- Push to `main` → Production deployment
- `workflow_dispatch` → Manual trigger

**Jobs:**
- `build-and-test`: Lint → Typecheck → Test → Build (blocks deployment)
- `deploy`: Vercel deployment (preview for PRs, production for main)
  - **Enhanced:** Secret validation, error handling, troubleshooting hints

**Purpose:** Automated frontend deployment to Vercel

**Required for Branch Protection:** ✅ Yes (for production deployments)

**Recent Fixes (2025-01-XX):**
- ✅ Added secret validation step
- ✅ Enhanced error handling for Vercel CLI commands
- ✅ Improved troubleshooting messages
- ✅ Fixed PR comment step conditions

**Documentation:** 
- See [deploy-strategy.md](./deploy-strategy.md) for deployment flow
- See [vercel-troubleshooting.md](./vercel-troubleshooting.md) for troubleshooting

---

### ✅ `supabase-migrate.yml` - Database Migrations

**Status:** ✅ **Required for main branch** (when migrations exist)

**Triggers:**
- Push to `main` (if migrations changed)
- `workflow_dispatch` → Manual trigger

**Jobs:**
- `migrate`: Applies Supabase migrations via CLI

**Purpose:** Automated database migrations

**Required for Branch Protection:** ⚠️ Optional (runs independently)

**Separation:** Runs independently from frontend deployments (decoupled)

---

## 3. Supplementary Workflows (Optional but Useful)

### ✅ `preview-pr.yml` - PR Quality Gates

**Status:** ✅ **Optional** (supplementary quality checks)

**Triggers:**
- Pull requests to `main`
- `workflow_dispatch`

**Purpose:** Additional quality checks (Lighthouse, Pa11y accessibility)

**Jobs:**
- `preview`: Typecheck → Lint → Build → Lighthouse → Pa11y → Deploy preview

**Note:** Primary deployment handled by `frontend-deploy.yml`. This adds extra quality gates.

**Recent Fixes (2025-01-XX):**
- ✅ Added secret validation step
- ✅ Enhanced error handling for Vercel commands
- ✅ Fixed comment step path handling

**Required for Branch Protection:** ⚠️ Optional (non-blocking)

---

### ✅ `env-validation.yml` - Environment Variable Validation

**Status:** ✅ **Optional** (validates env var changes)

**Triggers:**
- PRs/pushes when `.env.example`, `frontend/lib/env.ts`, or `backend/env_validator.py` change

**Purpose:** Validates environment variable configuration

**Required for Branch Protection:** ⚠️ Optional

---

### ✅ `env-smoke-test.yml` - Environment Smoke Test

**Status:** ✅ **Optional** (manual trigger)

**Triggers:**
- Push to `main`/`master`
- `workflow_dispatch`

**Purpose:** Validates required environment variables exist in secrets

**Required for Branch Protection:** ⚠️ Optional

---

### ✅ `security-scan.yml` - Security Scanning

**Status:** ✅ **Optional** (security checks)

**Triggers:** (Need to check)

**Purpose:** Security vulnerability scanning

**Required for Branch Protection:** ⚠️ Optional (but recommended)

---

### ✅ `performance-tests.yml` - Performance Testing

**Status:** ✅ **Optional** (performance checks)

**Triggers:** (Need to check)

**Purpose:** Performance testing and benchmarking

**Required for Branch Protection:** ⚠️ Optional

---

## 4. Workflow Audit & Recommendations

### Workflows Requiring Review

**Total:** 41 workflows found

**Categories:**

#### ✅ Core (3 workflows) - Keep
- `ci.yml` - Main CI pipeline
- `frontend-deploy.yml` - Primary deployment
- `supabase-migrate.yml` - Database migrations

#### ✅ Supplementary (8 workflows) - Keep (Optional)
- `preview-pr.yml` - PR quality gates
- `env-validation.yml` - Env var validation
- `env-smoke-test.yml` - Env smoke tests
- `security-scan.yml` - Security scanning
- `performance-tests.yml` - Performance tests
- `privacy-ci.yml` - Privacy compliance
- `wiring-check.yml` - Integration health
- `vercel-guard.yml` - Vercel deployment guard

#### ⚠️ Legacy/Deprecated (1 workflow) - Disabled
- `deploy-main.yml` - **DISABLED** - Legacy production deploy (conflicted with `frontend-deploy.yml`, now disabled)
  - **Status:** Disabled via `if: false` and removed `push` trigger
  - **Reason:** Prevented conflicts with `frontend-deploy.yml`
  - **Action:** Can be manually triggered but won't auto-run on push to main

#### ❓ Unknown Purpose (27 workflows) - Audit Needed
- `agent-runner.yml`
- `backup-automation.yml`
- `benchmarks.yml`
- `bundle-analyzer.yml`
- `canary-deploy.yml`
- `ci-integration.yml`
- `ci-intent-tests.yml`
- `ci-performance.yml`
- `data_quality.yml`
- `docs-guard.yml`
- `docs-pdf.yml`
- `integration-audit.yml`
- `meta-audit.yml`
- `mobile.yml`
- `nightly-etl.yml`
- `on_failure_doctor.yml`
- `openapi-generation.yml`
- `post_deploy_verify.yml`
- `project-governance.yml`
- `status_pages.yml`
- `system_health.yml`
- `supabase_delta_apply.yml`
- `systems-metrics.yml`
- `telemetry.yml`
- `ui-ingest.yml`
- `unified-agent.yml`
- `weekly-maint.yml`

**Recommendation:** Audit each workflow to determine if it's:
1. **Active and needed** → Keep
2. **Redundant** → Consolidate or remove
3. **Obsolete** → Remove
4. **Experimental** → Move to separate branch or disable

---

## 5. Required GitHub Secrets

### For Vercel Deployment

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `VERCEL_TOKEN` | Vercel API token | `frontend-deploy.yml`, `preview-pr.yml`, `deploy-main.yml` |
| `VERCEL_ORG_ID` | Vercel organization ID | `frontend-deploy.yml`, `preview-pr.yml`, `deploy-main.yml` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `frontend-deploy.yml`, `preview-pr.yml`, `deploy-main.yml` |

### For Supabase Migrations

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token | `supabase-migrate.yml`, `preview-pr.yml` |
| `SUPABASE_PROJECT_REF` | Supabase project reference | `supabase-migrate.yml`, `preview-pr.yml` |

### For Environment Variables (Builds)

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (public) | `ci.yml`, `frontend-deploy.yml` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | `ci.yml`, `frontend-deploy.yml` |

### Optional Secrets

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection | `env-smoke-test.yml` (if used) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | `env-smoke-test.yml` (if used) |
| `SENTRY_DSN` | Error tracking | Various workflows (if used) |
| `SLACK_WEBHOOK_URL` | Notifications | Various workflows (if used) |

**See [env-and-secrets.md](./env-and-secrets.md) for complete mapping.**

---

## 6. Branch Protection Recommendations

### Required Checks for `main` Branch

**Minimum Required:**
1. ✅ `ci.yml` - Main CI pipeline (lint, typecheck, test, build)
2. ✅ `frontend-deploy.yml` - Frontend deployment (build-and-test job)

**Recommended Additional:**
3. ⚠️ `preview-pr.yml` - Quality gates (non-blocking, but useful)
4. ⚠️ `security-scan.yml` - Security scanning (if configured)
5. ⚠️ `supabase-migrate.yml` - Database migrations (if migrations exist)

**Optional (Non-blocking):**
- `env-validation.yml` - Env var validation
- `performance-tests.yml` - Performance tests
- `privacy-ci.yml` - Privacy compliance

### Checks to Remove from Branch Protection

**Obsolete (Already Disabled):**
- `deploy-main.yml` - **DISABLED** - Conflicts with `frontend-deploy.yml`
  - Removed from branch protection (workflow disabled via `if: false`)

**If Other Workflows Become Obsolete:**
- Mark as deprecated in workflow comments
- Remove from branch protection rules
- Document removal in this file

---

## 7. Deployment Flow

### Pull Request Flow

1. **PR Opened:**
   - `ci.yml` → Quality checks (lint, typecheck, test, build)
   - `frontend-deploy.yml` → Build & test → Deploy preview
   - `preview-pr.yml` → Additional quality gates (Lighthouse, Pa11y)
   - `env-validation.yml` → Validate env vars (if changed)

2. **PR Comments:**
   - Preview URL commented on PR (via `frontend-deploy.yml`)
   - Quality reports uploaded as artifacts (via `preview-pr.yml`)

### Production Flow (`main` Branch)

1. **Merge to `main`:**
   - `ci.yml` → Quality checks (lint, typecheck, test, build)
   - `frontend-deploy.yml` → Build & test → Deploy to production
   - `supabase-migrate.yml` → Apply database migrations (if migrations changed)
   - ~~`deploy-main.yml`~~ → **DISABLED** (no longer runs)

2. **Post-Deploy:**
   - `post_deploy_verify.yml` → Post-deployment verification (if configured)
   - `env-smoke-test.yml` → Environment smoke tests (manual trigger)

---

## 8. Standardization

### Node Version

- **Pinned:** Node 20.x (`">=20 <21"` in `package.json` engines)
- **CI:** All workflows use Node 20
- **Status:** ✅ Consistent

### Package Manager

- **Manager:** npm (consistent across repo)
- **CI Command:** `npm ci` (deterministic installs)
- **Cache:** `npm` (via `setup-node` action)
- **Status:** ✅ Consistent

### Lockfile

- **Files:** `package-lock.json` (root + frontend/)
- **Conflicts:** None (no yarn.lock or pnpm-lock.yaml)
- **Status:** ✅ Clean

---

## 9. Deployment Reliability Improvements (2025-01-XX)

### Fixes Applied
- [x] Added secret validation to `frontend-deploy.yml`
- [x] Added secret validation to `preview-pr.yml`
- [x] Disabled `deploy-main.yml` to prevent conflicts
- [x] Enhanced error handling in deployment workflows
- [x] Created `deploy-doctor` diagnostic script
- [x] Created comprehensive troubleshooting documentation

### New Documentation
- [x] `docs/deploy-strategy.md` - Canonical deployment paths
- [x] `docs/vercel-troubleshooting.md` - Troubleshooting guide
- [x] `docs/deploy-reliability-plan.md` - Action plan and verification
- [x] `docs/deploy-failure-postmortem-initial.md` - Failure analysis

### Diagnostic Tools
- [x] `scripts/deploy-doctor.ts` - Automated diagnostic checks
- [x] `npm run deploy:doctor` - Run diagnostics locally

---

## 10. Action Items

### Immediate
- [x] Document CI/CD overview
- [x] Fix deployment workflows (secret validation, error handling)
- [x] Disable conflicting workflows (`deploy-main.yml`)
- [x] Create diagnostic tooling (`deploy-doctor`)
- [x] Create troubleshooting documentation
- [ ] Verify deployments work after fixes (create test PR, merge to main)
- [ ] Update branch protection rules (remove `deploy-main.yml` if present)

### Short-Term
- [ ] Audit remaining workflows (27 workflows need review)
- [ ] Mark obsolete workflows as deprecated
- [ ] Consolidate redundant workflows
- [ ] Add workflow status badges to README

### Short-Term
- [ ] Add workflow status badges to README
- [ ] Create workflow runbook (troubleshooting guide)
- [ ] Document workflow dependencies
- [ ] Set up workflow notifications (Slack, email)

### Long-Term
- [ ] Implement workflow monitoring/alerting
- [ ] Optimize workflow performance (reduce CI time)
- [ ] Add workflow cost tracking
- [ ] Create workflow templates for new workflows

---

## 11. References

### Deployment Documentation
- [Deployment Strategy](./deploy-strategy.md) - Canonical deployment paths
- [Vercel Troubleshooting](./vercel-troubleshooting.md) - Troubleshooting guide
- [Deploy Reliability Plan](./deploy-reliability-plan.md) - Action plan and verification
- [Deploy Failure Postmortem](./deploy-failure-postmortem-initial.md) - Failure analysis

### Configuration Documentation
- [Environment Variables](./env-and-secrets.md) - Environment variables guide
- [Frontend Hosting Strategy](./frontend-hosting-strategy.md) - Hosting platform details

### Other Documentation
- [Backend Strategy](./backend-strategy.md)
- [Stack Discovery](./stack-discovery.md)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Core CI/CD Documented, Deployment Fixes Applied, Workflow Audit Needed
