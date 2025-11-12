# Master One-Shot Run Summary

**Generated:** 2025-11-12T04:26:04.189Z  
**Status:** ❌ FAIL

## Phase Results

### 1. Preflight Checks
- **Status:** ❌ FAIL
- **Errors:** Missing environment variables: SUPABASE_DB_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, Database connection failed

### 2. Guardrails Pack
- **Status:** ✅ PASS
- **Files Created:** 19

### 3. System Health Reports
- **Status:** ✅ PASS
- **Reports:** 6

### 4. Delta Migration
- **Status:** ❌ FAIL
- **No migration needed**

### 5. Database Verification
- **Status:** ❌ FAIL
- **Errors:** Missing SUPABASE_DB_URL or DATABASE_URL

### 6. ETL Smoke Test
- **Status:** ❌ FAIL
- **Errors:** scripts/etl/pull_events.ts: Command failed: tsx scripts/etl/pull_events.ts --dry-run, scripts/etl/pull_ads_source_a.ts: Command failed: tsx scripts/etl/pull_ads_source_a.ts --dry-run, scripts/etl/pull_ads_source_b.ts: Command failed: tsx scripts/etl/pull_ads_source_b.ts --dry-run

### 7. Metrics Computation
- **Status:** ✅ PASS
- **Days Processed:** 0

### 8. Data Quality Checks
- **Status:** ✅ PASS


### 9. System Doctor
- **Status:** ❌ FAIL
- **Tickets Created:** READY_system_fix_delta_migration, READY_system_fix_database

## Created Files

- supabase/migrations/000000000800_upsert_functions.sql
- scripts/lib/db.ts
- scripts/lib/retry.ts
- scripts/lib/logger.ts
- scripts/etl/pull_events.ts
- scripts/etl/pull_ads_source_a.ts
- scripts/etl/pull_ads_source_b.ts
- scripts/etl/compute_metrics.ts
- scripts/agents/preflight.ts
- scripts/agents/verify_db.ts
- scripts/agents/run_data_quality.ts
- scripts/agents/notify.ts
- scripts/agents/system_doctor.ts
- tests/data_quality.sql
- tests/fixtures/events_sample.json
- tests/fixtures/source_a_ads_sample.json
- tests/fixtures/source_b_ads_sample.json
- infra/gh-actions/preflight.yml
- infra/gh-actions/data_quality.yml
- reports/system/loops.md
- reports/system/second_order.md
- reports/system/socio_tech_alignment.md
- reports/system/constraints_report.md
- reports/system/resilience_index.md
- reports/system/multi_agent_sync.md

## Next Actions

- Fix environment variables and database connection
- Review and apply delta migration manually
- Review 2 system fix tickets

## Notes

This run executed all phases of the Master One-Shot process. Review any failures above and address them before the next run.
