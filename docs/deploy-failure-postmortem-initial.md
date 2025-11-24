# Deployment Failure Postmortem - Initial Investigation

**Date:** 2025-01-XX  
**Status:** Initial Analysis  
**Purpose:** Identify root causes of Vercel deployment failures

---

## Executive Summary

**Symptoms:**
- No preview deployments appearing for PRs
- No production deployments on pushes to `main`
- Workflows may run but fail before or during deploy

**Investigation Method:** Configuration-based analysis (no access to GitHub UI logs)

---

## 1. Existing Workflows Analysis

### 1.1 Primary Deployment Workflow: `frontend-deploy.yml`

**Status:** ✅ **ACTIVE** - Primary deployment workflow

**Triggers:**
- `pull_request` → branches: `[main]`
- `push` → branches: `[main]`
- `workflow_dispatch`

**Jobs:**
1. `build-and-test` - Runs lint, tests, typecheck, build
2. `deploy` - Deploys to Vercel (preview for PRs, production for main)

**Deploy Job Conditions:**
```yaml
if: |
  (github.event_name == 'pull_request' && github.event.action != 'closed') ||
  (github.ref == 'refs/heads/main' && github.event_name == 'push') ||
  github.event_name == 'workflow_dispatch'
```

**Analysis:**
- ✅ Triggers look correct
- ✅ Conditions properly distinguish PR vs main
- ⚠️ **POTENTIAL ISSUE:** Deploy step uses `if: steps.env.outputs.is_production == 'false'` and `if: steps.env.outputs.is_production == 'true'` - if `env` step fails, deploy won't run
- ⚠️ **POTENTIAL ISSUE:** Missing validation that required secrets exist before attempting deploy

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL` (for build)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for build)

---

### 1.2 Legacy Deployment Workflow: `deploy-main.yml`

**Status:** ⚠️ **DEPRECATED** - Marked as deprecated but still active

**Triggers:**
- `push` → branches: `[main]`
- `workflow_dispatch`

**Jobs:**
1. `deploy` - Builds and deploys to production

**Analysis:**
- ⚠️ **CONFLICT RISK:** Runs on same trigger as `frontend-deploy.yml` (push to main)
- ⚠️ **CONCURRENCY:** Uses `cancel-in-progress: false` - could cause race conditions
- ✅ Has smoke tests (CRUX hardening, trust artifacts)
- ⚠️ **ISSUE:** Uses `npm run vercel:pull` which expects `$VERCEL_TOKEN` env var, but workflow sets it correctly

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `VERCEL_PROJECT_DOMAIN` (for `NEXT_PUBLIC_SITE_URL`)

**Recommendation:** 
- **Option A:** Disable this workflow entirely (rely on `frontend-deploy.yml`)
- **Option B:** Keep only for smoke tests, remove deploy step
- **Option C:** Consolidate smoke tests into `frontend-deploy.yml`

---

### 1.3 Preview PR Workflow: `preview-pr.yml`

**Status:** ✅ **SUPPLEMENTARY** - Adds quality gates (Lighthouse, Pa11y)

**Triggers:**
- `pull_request` → branches: `[main]`
- `workflow_dispatch`

**Jobs:**
1. `preview` - Typecheck, lint, build, Lighthouse, Pa11y, deploy preview

**Analysis:**
- ✅ Adds value (quality gates)
- ⚠️ **REDUNDANCY:** Also deploys preview (overlaps with `frontend-deploy.yml`)
- ⚠️ **ISSUE:** Uses `npm run vercel:pull` which expects `$VERCEL_TOKEN` env var - workflow sets it correctly
- ⚠️ **ISSUE:** Comment step references `.vercel-url.txt` but deploy script writes to `.vercel-url.txt` (root), not `frontend/.vercel-url.txt`

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

**Recommendation:** Keep for quality gates, but ensure it doesn't conflict with `frontend-deploy.yml` preview deployments.

---

## 2. Failure Mode Analysis

### 2.1 Workflow Not Triggering

**Potential Causes:**

1. **Branch Filter Mismatch:**
   - ✅ All workflows use `branches: [main]` - correct
   - ✅ PR workflows use `pull_request` without branch restrictions - correct

2. **Path Filters:**
   - ✅ No `paths` or `paths-ignore` filters found - workflows should always trigger

3. **Workflow Disabled:**
   - ⚠️ Cannot verify from config (requires GitHub UI)
   - **Action:** Document how to check in troubleshooting guide

4. **Concurrency Cancellation:**
   - `frontend-deploy.yml` uses `cancel-in-progress: true` - newer commits cancel older runs
   - ⚠️ **RISK:** If multiple commits push quickly, only latest runs
   - **Impact:** Low - this is expected behavior

**Verdict:** ✅ **LIKELY NOT THE ISSUE** - Triggers look correct

---

### 2.2 Workflow Runs But Deploy Step Skipped

**Potential Causes:**

1. **Job Dependencies:**
   - ✅ `deploy` job has `needs: build-and-test` - correct
   - ⚠️ **RISK:** If `build-and-test` fails, deploy never runs (expected, but should be clear)

2. **Conditional Logic:**
   - ⚠️ **ISSUE:** `frontend-deploy.yml` deploy job has complex `if:` condition
   - ⚠️ **ISSUE:** Deploy steps use `if: steps.env.outputs.is_production == 'false'` - if `env` step fails, deploy steps skip
   - **Fix Needed:** Add error handling for `env` step

3. **Missing Secrets:**
   - ⚠️ **ISSUE:** No validation that secrets exist before deploy
   - **Impact:** Workflow fails silently or with unclear error
   - **Fix Needed:** Add secret validation step

**Verdict:** ⚠️ **LIKELY ISSUE** - Missing validation and error handling

---

### 2.3 Workflow Runs But Fails During Deploy

**Potential Causes:**

1. **Missing Secrets:**
   - ⚠️ **CRITICAL:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` must exist
   - ⚠️ **CRITICAL:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` needed for build
   - **Impact:** Build fails or deploy fails with auth errors
   - **Fix Needed:** Add secret validation and clear error messages

2. **Vercel CLI Issues:**
   - ⚠️ **ISSUE:** `vercel pull` requires correct `--environment` flag
   - ✅ `frontend-deploy.yml` correctly uses `--environment=preview` or `--environment=production`
   - ⚠️ **ISSUE:** `vercel pull` may fail if project not linked or env vars missing in Vercel
   - **Fix Needed:** Add error handling and fallback behavior

3. **Build Failures:**
   - ⚠️ **ISSUE:** Missing env vars during build cause Next.js to fail
   - ✅ Workflows use fallbacks: `${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co' }}`
   - ⚠️ **RISK:** Placeholder values may cause runtime errors
   - **Fix Needed:** Validate required secrets exist before build

4. **Vercel Project Misconfiguration:**
   - ⚠️ **ISSUE:** `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID` may be wrong
   - ⚠️ **ISSUE:** Vercel project may not be linked to correct repo
   - **Fix Needed:** Document how to verify in troubleshooting guide

5. **Vercel Git Integration Conflict:**
   - ⚠️ **CRITICAL RISK:** If Vercel's native Git integration is enabled, it may conflict with GitHub Actions
   - **Impact:** Both try to deploy, causing conflicts or double deployments
   - **Fix Needed:** Document how to disable Vercel Git integration if using GitHub Actions

**Verdict:** ⚠️ **LIKELY ISSUE** - Multiple potential failure points

---

### 2.4 Package Manager & Build Configuration

**Analysis:**

1. **Node Version:**
   - ✅ All workflows use Node 20
   - ✅ `package.json` engines: `">=20 <21"`
   - ✅ Consistent

2. **Package Manager:**
   - ✅ All workflows use `npm ci`
   - ✅ Lockfile: `package-lock.json` (no conflicts)
   - ✅ Consistent

3. **Build Commands:**
   - ✅ `frontend-deploy.yml` uses `cd frontend && npm run build`
   - ✅ `vercel.json` specifies `buildCommand: "cd frontend && npm ci && npm run build"`
   - ⚠️ **POTENTIAL ISSUE:** Vercel CLI `vercel build` may use different command
   - **Impact:** Low - Vercel CLI respects `vercel.json`

**Verdict:** ✅ **NOT LIKELY THE ISSUE** - Configuration looks correct

---

## 3. Immediate "Can't Possibly Deploy" Issues

### 3.1 Missing Secret Validation

**Issue:** No validation that required secrets exist before deploy attempts.

**Impact:** Workflow fails with unclear error messages.

**Fix:** Add secret validation step before deploy.

---

### 3.2 Vercel Git Integration Conflict

**Issue:** If Vercel's native Git integration is enabled, it conflicts with GitHub Actions.

**Impact:** Double deployments, conflicts, or one method overriding the other.

**Fix:** Document how to disable Vercel Git integration.

---

### 3.3 Multiple Deployment Workflows

**Issue:** `deploy-main.yml` and `frontend-deploy.yml` both deploy on push to main.

**Impact:** Race conditions, duplicate deployments, confusion.

**Fix:** Disable `deploy-main.yml` or consolidate.

---

### 3.4 Error Handling in Deploy Steps

**Issue:** If `env` step fails in `frontend-deploy.yml`, deploy steps silently skip.

**Impact:** Deploy never runs, but workflow appears successful.

**Fix:** Add error handling and explicit validation.

---

## 4. Suspected Root Causes (Ranked)

### 🔴 **CRITICAL - High Confidence**

1. **Missing Secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` not set in GitHub Secrets
2. **Vercel Git Integration Enabled:** Conflicts with GitHub Actions deployments
3. **Missing Secret Validation:** Workflows don't validate secrets exist before deploy

### 🟡 **HIGH PRIORITY - Medium Confidence**

4. **Error Handling:** Deploy steps skip silently if `env` step fails
5. **Multiple Deployment Workflows:** `deploy-main.yml` conflicts with `frontend-deploy.yml`
6. **Vercel Project Misconfiguration:** Wrong `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID`

### 🟢 **MEDIUM PRIORITY - Low Confidence**

7. **Build Env Vars:** Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` causes build failures
8. **Vercel CLI Version:** Outdated Vercel CLI may have bugs
9. **Concurrency Issues:** Multiple workflows deploying simultaneously

---

## 5. Next Steps

1. ✅ Create `deploy-strategy.md` - Document canonical deployment paths
2. ✅ Fix `frontend-deploy.yml` - Add secret validation and error handling
3. ✅ Disable or consolidate `deploy-main.yml`
4. ✅ Create `vercel-troubleshooting.md` - Document Vercel configuration checks
5. ✅ Create `deploy-doctor` script - Diagnostic tooling
6. ✅ Create `deploy-reliability-plan.md` - Action plan and verification steps

---

**Last Updated:** 2025-01-XX  
**Status:** Initial Analysis Complete - Proceeding to Fixes
