# YC Readiness Automation Scripts

**Purpose:** Automate all next steps for YC readiness

---

## Quick Start

Run all automation scripts:
```bash
npm run yc:run-all
```

Or run individually:
```bash
npm run yc:fetch-metrics      # Fetch real metrics from database
npm run yc:generate-team      # Generate team template from git
npm run yc:calculate-financials  # Calculate financial model
npm run yc:test-features       # Test all features
npm run yc:deploy-referral     # Deploy referral system
npm run yc:weekly-report       # Generate weekly report
```

---

## Scripts

### 1. `fetch_real_metrics.ts`
**Purpose:** Fetch real metrics from database and update YC docs

**Usage:**
```bash
tsx yc/scripts/fetch_real_metrics.ts
```

**What it does:**
- Connects to Supabase database
- Fetches user, revenue, engagement metrics
- Updates `YC_INTERVIEW_CHEATSHEET.md` with real numbers
- Generates `METRICS_REPORT.md`

**Requirements:**
- `SUPABASE_URL` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` environment variable

---

### 2. `generate_team_template.ts`
**Purpose:** Auto-detect team information from git history

**Usage:**
```bash
tsx yc/scripts/generate_team_template.ts
```

**What it does:**
- Analyzes git commit history
- Identifies top contributors
- Adds detected info to `YC_TEAM_NOTES.md`

**Requirements:**
- Git repository
- Git history available

---

### 3. `calculate_financials.ts`
**Purpose:** Calculate financial model with projections

**Usage:**
```bash
tsx yc/scripts/calculate_financials.ts \
  --current-cash 50000 \
  --monthly-burn 5000 \
  --current-mrr 0 \
  --monthly-growth-rate 0.25 \
  --conversion-rate 0.1 \
  --arpu 29 \
  --cac 45
```

**What it does:**
- Calculates runway
- Generates 12-month projections
- Calculates unit economics
- Creates `FINANCIAL_MODEL.md`

---

### 4. `test_all_features.sh`
**Purpose:** Test all YC readiness features

**Usage:**
```bash
bash yc/scripts/test_all_features.sh
```

**What it does:**
- Checks if all files exist
- Verifies TypeScript compilation
- Verifies Python syntax
- Reports pass/fail status

---

### 5. `deploy_referral_system.sh`
**Purpose:** Deploy referral system migration

**Usage:**
```bash
bash yc/scripts/deploy_referral_system.sh
```

**What it does:**
- Applies referral system migration
- Verifies migration success
- Provides next steps

**Requirements:**
- Supabase CLI installed
- `SUPABASE_PROJECT_REF` environment variable
- `SUPABASE_ACCESS_TOKEN` environment variable

---

### 6. `generate_weekly_report.ts`
**Purpose:** Generate weekly metrics report

**Usage:**
```bash
tsx yc/scripts/generate_weekly_report.ts
```

**What it does:**
- Fetches weekly metrics
- Generates `WEEKLY_REPORT.md`
- Calculates growth rates

---

### 7. `run_all_next_steps.sh`
**Purpose:** Run all automation scripts in sequence

**Usage:**
```bash
bash yc/scripts/run_all_next_steps.sh
```

**What it does:**
- Runs all scripts in order
- Provides summary of what was done
- Lists next actions

---

### 8. `setup_complete.sh`
**Purpose:** Complete setup for YC readiness

**Usage:**
```bash
bash yc/scripts/setup_complete.sh
```

**What it does:**
- Makes all scripts executable
- Runs all automation
- Provides final summary

---

## Environment Variables Needed

```bash
# Database
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export DATABASE_URL="your-database-url"

# Supabase CLI
export SUPABASE_PROJECT_REF="your-project-ref"
export SUPABASE_ACCESS_TOKEN="your-access-token"

# Marketing APIs (optional, for CAC)
export GOOGLE_ADS_API_KEY="your-google-ads-key"
export GOOGLE_ADS_CUSTOMER_ID="your-customer-id"
export META_ADS_ACCESS_TOKEN="your-meta-token"
export META_ADS_ACCOUNT_ID="your-account-id"
```

---

## Troubleshooting

### Scripts fail with "command not found"
- Install dependencies: `npm install`
- Install tsx: `npm install -g tsx`

### Database connection fails
- Check environment variables
- Verify Supabase credentials
- Test connection manually

### Git history not found
- Ensure you're in a git repository
- Check git log works: `git log`

---

## Next Steps After Running Scripts

1. **Review generated files:**
   - `/yc/METRICS_REPORT.md`
   - `/yc/FINANCIAL_MODEL.md`
   - `/yc/YC_TEAM_NOTES.md` (updated)

2. **Fill in missing information:**
   - Team backgrounds
   - Real financial numbers
   - User testimonials

3. **Test features:**
   - Metrics dashboard
   - Referral system
   - SEO pages

4. **Deploy:**
   - Run migrations
   - Deploy to production
   - Test end-to-end

---

**Status:** ✅ All scripts ready to use
