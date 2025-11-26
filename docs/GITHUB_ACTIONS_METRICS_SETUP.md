# GitHub Actions Metrics Auto-Update Setup

**Last Updated:** 2025-01-20  
**Purpose:** Automatically fetch metrics from Supabase and update documentation on PR commits

---

## Overview

Two GitHub Actions workflows have been created to automatically fetch metrics from Supabase and update documentation:

1. **`metrics-auto-update.yml`** - Runs on PR commits and manual triggers
2. **`metrics-daily-update.yml`** - Runs daily at 2 AM UTC

---

## Workflow 1: Auto-Update on PR Commits

**File:** `.github/workflows/metrics-auto-update.yml`

### Triggers

- **Pull Requests** to `main` branch
- **Manual trigger** via `workflow_dispatch`
- **Daily schedule** at 2 AM UTC

### What It Does

1. Checks out repository
2. Sets up Node.js 20
3. Installs dependencies
4. Fetches metrics from Supabase
5. Updates documentation files automatically
6. Commits changes back to PR branch
7. Comments on PR with update summary

### Required GitHub Secrets

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`

### Files Updated

- `/yc/YC_PRODUCT_OVERVIEW.md`
- `/yc/YC_INTERVIEW_CHEATSHEET.md`
- `/yc/YC_METRICS_CHECKLIST.md`
- `/dataroom/03_METRICS_OVERVIEW.md`
- `/dataroom/04_CUSTOMER_PROOF.md`

---

## Workflow 2: Daily Metrics Update

**File:** `.github/workflows/metrics-daily-update.yml`

### Triggers

- **Daily schedule** at 2 AM UTC
- **Manual trigger** via `workflow_dispatch`

### What It Does

1. Fetches latest metrics from Supabase
2. Updates documentation files
3. Commits and pushes to `main` branch

---

## Setup Instructions

### Step 1: Verify GitHub Secrets

Ensure these secrets are set in GitHub → Settings → Secrets:

- ✅ `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

**How to Get:**

**SUPABASE_URL:**
1. Go to Supabase Dashboard → Settings → API
2. Copy "Project URL"
3. Add to GitHub Secrets as `SUPABASE_URL`

**SUPABASE_SERVICE_ROLE_KEY:**
1. Go to Supabase Dashboard → Settings → API
2. Copy "service_role" key (NOT anon key)
3. Add to GitHub Secrets as `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Test Workflow

**Option A: Create Test PR**
1. Create a new branch
2. Make a small change (e.g., update a doc file)
3. Create PR to `main`
4. Workflow will automatically run
5. Check GitHub Actions → Workflows → "Auto-Update Metrics & Docs"

**Option B: Manual Trigger**
1. Go to GitHub → Actions
2. Select "Auto-Update Metrics & Docs" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Step 3: Verify Results

After workflow runs:
1. Check PR for comment: "✅ Metrics Auto-Updated"
2. Review updated files in PR
3. Verify metrics are correct

---

## How It Works

### Metrics Fetch Process

1. **Workflow triggers** on PR commit
2. **Checks out code** from PR branch
3. **Sets up environment** (Node.js, dependencies)
4. **Runs script:** `npm run metrics:fetch`
5. **Script fetches** metrics from Supabase:
   - Total users
   - New users (7d, 30d)
   - Active users (30d)
   - Paid users
   - MRR, ARR
   - DAU, WAU, MAU
   - Activation rate
6. **Updates documentation** files automatically
7. **Commits changes** back to PR branch
8. **Comments on PR** with summary

### Error Handling

- If Supabase secrets not set: Workflow skips gracefully (doesn't fail)
- If database empty: Workflow continues (expected for pre-launch)
- If metrics fetch fails: Workflow continues (doesn't block PR)

---

## Benefits

### ✅ No CLI Required

- No need to run scripts locally
- No need to install Supabase CLI
- Everything runs in GitHub Actions

### ✅ Automatic Updates

- Metrics update automatically on PR commits
- Daily updates keep metrics fresh
- Documentation always reflects current state

### ✅ CI/CD Integration

- Runs as part of PR process
- Updates docs before merge
- Comments on PR with summary

---

## Troubleshooting

### Workflow Doesn't Run

**Check:**
1. GitHub Secrets are set correctly
2. Workflow file is in `.github/workflows/` directory
3. PR is targeting `main` branch
4. Files changed match workflow paths

### Metrics Fetch Fails

**Check:**
1. `SUPABASE_URL` secret is correct
2. `SUPABASE_SERVICE_ROLE_KEY` secret is correct (service_role, not anon)
3. Supabase database is accessible
4. Tables exist (users, subscriptions, events)

### Changes Not Committed

**Check:**
1. Git config is set correctly (workflow handles this)
2. Branch is not protected (protected branches may block commits)
3. GITHUB_TOKEN has write permissions (default token should work)

---

## Manual Override

If you need to run manually:

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run script
npm run metrics:fetch
```

---

## Workflow Status

**Status:** ✅ Ready to use

**Next Steps:**
1. Verify GitHub Secrets are set
2. Create test PR to trigger workflow
3. Verify metrics are updated automatically

---

**Note:** Workflow will skip gracefully if Supabase secrets are not set (doesn't fail the workflow).
