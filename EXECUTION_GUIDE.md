# Master One-Shot Execution Guide

**Date:** 2025-01-27  
**Purpose:** Step-by-step guide to execute all priority items

---

## Prerequisites

1. **GitHub Secrets Configured:**
   - `SUPABASE_DB_URL` (required - service-role connection string)
   - `SUPABASE_URL` (optional - for ETL scripts)
   - `SUPABASE_SERVICE_ROLE_KEY` (optional - for ETL scripts)
   - `META_TOKEN` (optional - for Meta ads ETL)
   - `TIKTOK_TOKEN` (optional - for TikTok ads ETL)
   - `SHOPIFY_API_KEY`, `SHOPIFY_PASSWORD`, `SHOPIFY_STORE` (optional - for Shopify ETL)

2. **Dependencies Installed:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   - Copy `/infra/env/.env.example` to `.env.local`
   - Fill in required values

---

## Step 1: Generate Delta Migration

**Purpose:** Create SQL migration file with only missing database objects

```bash
# Set database URL
export SUPABASE_DB_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Generate migration
node scripts/agents/generate_delta_migration.ts
```

**Expected Output:**
- Creates `/supabase/migrations/YYYYMMDDHHMMSS_delta.sql` (if changes needed)
- Or prints "No delta required." (if database already has all objects)

**What It Does:**
- Checks for missing extensions (pgcrypto, pg_trgm)
- Checks for missing tables (events, orders, spend, experiments, etc.)
- Checks for missing columns (gross_margin_cents, traffic in metrics_daily)
- Checks for missing indexes
- Checks for missing RLS policies
- Creates idempotent SQL (IF NOT EXISTS, guarded policy blocks)

---

## Step 2: Apply Migration

### Option A: Via GitHub Actions (Recommended)

1. **Push migration file to repository:**
   ```bash
   git add supabase/migrations/*_delta.sql
   git commit -m "chore: add delta migration"
   git push origin main
   ```

2. **GitHub Action will automatically:**
   - Run `generate_delta_migration.ts` (if script changed)
   - Apply migration via Supabase CLI
   - Fallback to psql if CLI fails
   - Verify database state

### Option B: Manual Application

```bash
# Apply via Supabase CLI
supabase db push --db-url "$SUPABASE_DB_URL" --include-all

# Or apply via psql
psql "$SUPABASE_DB_URL" -f supabase/migrations/YYYYMMDDHHMMSS_delta.sql
```

---

## Step 3: Verify Database State

```bash
# Set database URL
export DATABASE_URL="$SUPABASE_DB_URL"

# Verify
node scripts/agents/verify_db.ts
```

**Expected Output:**
- ✅ DB verified (if all objects exist)
- Or error messages listing missing objects

**What It Checks:**
- All required tables exist
- All required columns exist
- All required indexes exist
- RLS enabled on all tables
- At least one policy exists on each table

---

## Step 4: Test ETL Scripts (Optional)

```bash
# Test Meta ads ETL (dry-run)
node scripts/etl/pull_ads_meta.ts --dry-run

# Test TikTok ads ETL (dry-run)
node scripts/etl/pull_ads_tiktok.ts --dry-run

# Test Shopify orders ETL (dry-run)
node scripts/etl/pull_shopify_orders.ts --dry-run

# Test metrics computation (dry-run)
node scripts/etl/compute_metrics.ts --dry-run
```

---

## Step 5: Enable GitHub Actions

### Nightly ETL (01:10 America/Toronto)

**File:** `/infra/gh-actions/nightly-etl.yml`

**Triggers:** Daily at 01:10 AM ET

**What It Does:**
- Runs `compute_metrics.ts --cron` (computes yesterday's metrics)

**To Enable:**
1. Ensure GitHub Secrets are set
2. Action will run automatically on schedule

### Weekly System Health (Monday 07:30)

**File:** `/infra/gh-actions/system_health.yml`

**Triggers:** Every Monday at 07:30 AM ET

**What It Does:**
- Runs `system_health.ts` (generates system health reports)

**To Enable:**
1. Action will run automatically on schedule

### Supabase Delta Migration

**File:** `/infra/gh-actions/supabase_delta_apply.yml`

**Triggers:**
- Manual (workflow_dispatch)
- Push to main (if migration files changed)

**What It Does:**
- Generates delta migration
- Applies via Supabase CLI
- Falls back to psql if CLI fails
- Verifies database state

**To Enable:**
1. Ensure `SUPABASE_DB_URL` secret is set
2. Push migration files or trigger manually

---

## Priority Items Execution Order

### Week 1: Foundation (P0)

1. **Analytics Infrastructure** (7 days)
   - Set up PostHog/Mixpanel account
   - Integrate with frontend
   - Build analytics dashboard
   - **KPI:** Events >100/day

2. **Activation Funnel** (3 days)
   - Design onboarding flow
   - Implement onboarding UI
   - Add email triggers
   - **KPI:** Activation >40%

3. **Stripe Integration** (5 days)
   - Complete webhook handler
   - Store billing events
   - Build upgrade flow
   - **KPI:** Webhook success >99%

### Week 2-3: Growth (P1)

4. **Retention Emails** (2 days)
   - Design email templates
   - Implement email triggers
   - **KPI:** D7 retention >25%

5. **Referral Program** (5 days)
   - Design referral flow
   - Implement referral tracking
   - Build referral dashboard
   - **KPI:** Referral rate >10%

### Week 3-4: Optimization (P2)

6. **ML Feedback Loop** (5 days)
   - Add feedback mechanism
   - Track suggestion adoption
   - **KPI:** Adoption >30%

7. **Error Tracking** (2 days)
   - Set up Sentry
   - Integrate with frontend
   - **KPI:** Error rate <1%

8. **ETL Automation** (2 days)
   - Already automated via GitHub Actions
   - **KPI:** ETL success >95%

---

## Troubleshooting

### Migration Fails

**Error:** "Missing SUPABASE_DB_URL or DATABASE_URL"
**Fix:** Set environment variable:
```bash
export SUPABASE_DB_URL="postgresql://..."
```

**Error:** "Connection refused"
**Fix:** Check database URL, network access, firewall rules

**Error:** "Table already exists"
**Fix:** This is expected - script uses IF NOT EXISTS, safe to ignore

### Verification Fails

**Error:** "Missing table: events"
**Fix:** Run migration script to create missing tables

**Error:** "RLS not enabled"
**Fix:** Migration script should enable RLS, check migration output

### ETL Scripts Fail

**Error:** "Missing SUPABASE_URL"
**Fix:** Set environment variable or add to `.env.local`

**Error:** "API rate limit exceeded"
**Fix:** Add retry logic (already implemented) or reduce frequency

---

## Success Criteria

**30 Days:**
- ✅ Analytics events tracked >100/day
- ✅ Activation rate >40%
- ✅ Stripe webhook success >99%
- ✅ D7 retention >25%
- ✅ Referral rate >10%

**60 Days:**
- ✅ Activation rate >50%
- ✅ D7 retention >30%
- ✅ Referral rate >15%
- ✅ LTV:CAC >8:1

**90 Days:**
- ✅ MRR >$15K
- ✅ CAC <$30
- ✅ LTV:CAC >10:1
- ✅ Cash runway >3 months

---

## Next Steps

1. **Review all deliverables** in `/reports/exec/` and `/reports/system/`
2. **Prioritize backlog tickets** in `/backlog/READY_*.md`
3. **Set up GitHub Secrets** (required for automation)
4. **Run migration** (generate + apply)
5. **Verify database** (ensure all objects exist)
6. **Start Week 1 priorities** (Analytics, Activation, Stripe)

---

## Support

- **Migration Issues:** Check `/scripts/agents/generate_delta_migration.ts`
- **ETL Issues:** Check `/scripts/etl/*.ts`
- **System Health:** Check `/reports/system_health_2025-01-27.md`
- **Business Intelligence:** Check `/reports/exec/unaligned_audit.md`
