# Quick Start Guide

**Purpose:** Get up and running in 5 minutes

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Set Up Environment

```bash
# Copy environment template
cp infra/env/.env.example .env.local

# Edit .env.local and add your values
# Required: SUPABASE_DB_URL
# Optional: META_TOKEN, TIKTOK_TOKEN, SHOPIFY_* (for ETL)
```

---

## 3. Generate & Apply Migration

```bash
# Generate delta migration (only creates missing objects)
export SUPABASE_DB_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
node scripts/agents/generate_delta_migration.ts

# Apply migration (if file was created)
supabase db push --db-url "$SUPABASE_DB_URL" --include-all

# Or via psql
psql "$SUPABASE_DB_URL" -f supabase/migrations/*_delta.sql

# Verify database state
export DATABASE_URL="$SUPABASE_DB_URL"
node scripts/agents/verify_db.ts
```

---

## 4. Set Up GitHub Actions (Optional)

1. **Add GitHub Secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Add `SUPABASE_DB_URL` (required)
   - Add other secrets as needed (META_TOKEN, TIKTOK_TOKEN, etc.)

2. **Actions will run automatically:**
   - **Nightly ETL:** Daily at 01:10 AM ET (computes metrics)
   - **System Health:** Weekly on Monday at 07:30 AM ET (generates reports)
   - **Migration:** On push to main (if migration files change)

---

## 5. Review Priority Items

**Top 3 Priority Items (Week 1):**

1. **Analytics Infrastructure** (P0)
   - See: `/backlog/READY_analytics_infrastructure.md`
   - Owner: Engineering Lead
   - KPI: Events >100/day

2. **Activation Funnel** (P0)
   - See: `/backlog/READY_activation_funnel.md`
   - Owner: Product Lead
   - KPI: Activation >40%

3. **Stripe Integration** (P0)
   - See: `/backlog/READY_stripe_integration.md`
   - Owner: Engineering Lead
   - KPI: Webhook success >99%

---

## 6. Test ETL Scripts (Optional)

```bash
# Dry-run tests (no data written)
node scripts/etl/pull_ads_meta.ts --dry-run
node scripts/etl/pull_ads_tiktok.ts --dry-run
node scripts/etl/pull_shopify_orders.ts --dry-run
node scripts/etl/compute_metrics.ts --dry-run
```

---

## What's Next?

1. **Read:** `/MASTER_ONE_SHOT_COMPLETE.md` (full summary)
2. **Review:** `/reports/exec/unaligned_audit.md` (business intelligence audit)
3. **Plan:** `/reports/system_health_2025-01-27.md` (system health report)
4. **Execute:** Start with Week 1 priority items

---

## Troubleshooting

**Migration fails?**
- Check `SUPABASE_DB_URL` is set correctly
- Check database is accessible
- Check migration file was created

**Verification fails?**
- Run migration first
- Check error messages for missing objects

**ETL scripts fail?**
- Check environment variables are set
- Check API tokens are valid
- Use `--dry-run` flag to test

---

## Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (`.env.local`)
- [ ] Migration generated (`generate_delta_migration.ts`)
- [ ] Migration applied (Supabase CLI or psql)
- [ ] Database verified (`verify_db.ts`)
- [ ] GitHub Secrets configured (for automation)
- [ ] Priority items reviewed (backlog tickets)

---

**Status:** ✅ Ready to execute

**Next Action:** Run migration generation script
