> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Preflight Inventory: CRUX+HARDEN Upgrade

**Generated:** 2025-11-05T04:34:51Z  
**Mode:** Non-Destructive (Merge/Patch Only)  
**Backup Policy:** Enabled (`.bak.<timestamp>`)

## File Inventory

### Existing Files (Will NOT be overwritten)
- ✅ `frontend/next.config.js` - Exists, will be patched with markers
- ✅ `frontend/package.json` - Exists, version: 1.0.0
- ✅ `.github/workflows/deploy-main.yml` - Exists, will be patched with markers
- ✅ `supabase/migrations/20240101000000_initial_schema.sql` - Exists, contains events table

### New Files to Create
- 📝 `config/flags.crux.json` - Feature flags (new directory)
- 📝 `frontend/lib/utils/rate-limit.ts` - Rate limiting utility
- 📝 `frontend/lib/obs/log.ts` - Observability logging
- 📝 `frontend/app/headers.ts` - CSP headers (if not exists)
- 📝 `supabase/migrations/2025-11-05_crux_hardening.sql` - Online-safe indexes
- 📝 `docs/upgrade/README.md` - Upgrade documentation

### Files to Patch (with markers)
- 🔧 `frontend/next.config.js` - Add bundle analyzer support
- 🔧 `.github/workflows/deploy-main.yml` - Add smoke test step

### Files That May Need Patching (if exists)
- ⚠️ `frontend/lib/crux/executor.ts` - Add retry logic (NOT FOUND - will skip)
- ⚠️ `frontend/app/api/ingest/route.ts` - Add guardrails (NOT FOUND - will skip)
- ⚠️ `supabase/functions/ingest/index.ts` - Add validation (NOT FOUND - will skip)

## Database Schema Notes

- Events table exists: `events(userId, timestamp, ...)`
- Signals table: **NOT FOUND** in migrations (may not exist yet)
- Migration naming: Uses format `YYYYMMDDHHMMSS_description.sql`
- Indexes: Will use `CREATE INDEX CONCURRENTLY IF NOT EXISTS` for online safety

## Version Information

- Next.js: ^14.0.4 (from frontend/package.json)
- TypeScript: ^5.3.3
- Node: 20 (from CI workflow)

## Feature Flags Default State

All new features will be **OFF** by default:
- `events_ingest`: true (core functionality)
- `signals_detect`: true (core functionality)
- `workflow_dsl`: true (core functionality)
- `workflow_autogen`: true (core functionality)
- `workflow_execute`: true (core functionality)
- `macro_record`: true (core functionality)
- `bandit_rank`: false (experimental)
- `hardened_mode`: true (security defaults)
- `csp_headers`: false (must be explicitly enabled)
- `rate_limit_api`: true (protection enabled)
- `observability_min`: true (minimal logging enabled)

## Risk Assessment

### Low Risk
- New utility files (`rate-limit.ts`, `log.ts`)
- New migration file (separate, concurrent indexes)
- Feature flags (all OFF by default)

### Medium Risk
- `next.config.js` patch (bundle analyzer - conditional)
- CSP headers (disabled by default)

### Requires Attention
- Database migration: Concurrent indexes may need transaction handling adjustment
- If executor.ts exists elsewhere, retry logic patch will be skipped
