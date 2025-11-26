# GitHub Actions Metrics Auto-Update ✅

**Status:** ✅ Ready - No CLI Required!

---

## 🎉 What's New

GitHub Actions workflows automatically fetch metrics from Supabase and update all documentation on PR commits.

**No CLI required!** Everything runs in GitHub Actions.

---

## How It Works

### On PR Commit

1. **Workflow triggers** automatically
2. **Fetches metrics** from Supabase
3. **Updates documentation** files:
   - `/yc/YC_PRODUCT_OVERVIEW.md`
   - `/yc/YC_INTERVIEW_CHEATSHEET.md`
   - `/yc/YC_METRICS_CHECKLIST.md`
   - `/dataroom/03_METRICS_OVERVIEW.md`
   - `/dataroom/04_CUSTOMER_PROOF.md`
4. **Commits changes** back to PR branch
5. **Comments on PR** with summary

### Daily Updates

- Runs daily at 2 AM UTC
- Updates metrics in main branch
- Keeps documentation fresh

---

## Setup (One-Time)

### Required GitHub Secrets

Set these in GitHub → Settings → Secrets and variables → Actions:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`

**How to Get:**
- See `docs/GITHUB_SECRETS_CHECKLIST.md`

---

## Usage

### Option 1: Create PR (Recommended)

1. Create a new branch
2. Make a small change
3. Create PR to `main`
4. **Workflow runs automatically!**

### Option 2: Manual Trigger

1. Go to GitHub → Actions
2. Select "Auto-Update Metrics & Docs"
3. Click "Run workflow"

---

## Workflows

- **`.github/workflows/metrics-auto-update.yml`** - PR commits + daily
- **`.github/workflows/metrics-daily-update.yml`** - Daily updates to main

---

## Documentation

- **Setup Guide:** `docs/GITHUB_ACTIONS_METRICS_SETUP.md`
- **Secrets Checklist:** `docs/GITHUB_SECRETS_CHECKLIST.md`
- **Quick Start:** `docs/GITHUB_ACTIONS_SETUP_COMPLETE.md`

---

**Status:** ✅ Ready - Create PR to test!
