> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Planned Changes: CRUX+HARDEN Upgrade

## Summary

This upgrade adds non-destructive performance, security, and observability enhancements to the CRUX workflow engine. All changes are:
- Feature-flagged (default OFF)
- Marker-based patches (no overwrites)
- Backed up before modification
- Online-safe (no downtime)

## File Changes

### 1. New Configuration: `config/flags.crux.json`
**Type:** New file  
**Impact:** None (feature flags only)

```json
{
  "events_ingest": true,
  "signals_detect": true,
  "workflow_dsl": true,
  "workflow_autogen": true,
  "workflow_execute": true,
  "macro_record": true,
  "bandit_rank": false,
  "hardened_mode": true,
  "csp_headers": false,
  "rate_limit_api": true,
  "observability_min": true
}
```

### 2. New Utility: `frontend/lib/utils/rate-limit.ts`
**Type:** New file  
**Impact:** None (utility only, must be imported)

Token bucket rate limiter with in-memory fallback.

### 3. New Observability: `frontend/lib/obs/log.ts`
**Type:** New file  
**Impact:** None (structured logging utility)

### 4. New Headers: `frontend/app/headers.ts`
**Type:** New file  
**Impact:** Low (CSP disabled by default)

Adds security headers. CSP only enabled if `flags.crux.csp_headers=true`.

### 5. Patch: `frontend/next.config.js`
**Type:** Patch (marker-based)  
**Impact:** Low (conditional on ANALYZE env var)

Adds bundle analyzer support behind `ANALYZE=true` flag.

**Patch Location:** After `module.exports = withPWA(nextConfig)`

```javascript
// [CRUX+HARDEN:BEGIN:analyzer]
const withBundleAnalyzer = require('@next/bundle-analyzer')({ 
  enabled: process.env.ANALYZE === 'true' 
});
module.exports = withBundleAnalyzer(module.exports || {});
// [CRUX+HARDEN:END:analyzer]
```

### 6. Patch: `.github/workflows/deploy-main.yml`
**Type:** Patch (marker-based)  
**Impact:** Low (adds smoke test step)

Adds smoke test step after migrations.

**Patch Location:** After "Apply Supabase Migrations (Prod)" step

```yaml
# [CRUX+HARDEN:BEGIN:smoke]
- name: CRUX Harden Smoke
  run: |
    test -f frontend/lib/utils/rate-limit.ts
    test -f frontend/lib/obs/log.ts
    echo "Hardened utilities present ✓"
# [CRUX+HARDEN:END:smoke]
```

### 7. New Migration: `supabase/migrations/2025-11-05_crux_hardening.sql`
**Type:** New file  
**Impact:** Medium (creates indexes - online-safe)

Creates concurrent indexes for events and signals tables (if signals exists).

**Note:** Uses `CREATE INDEX CONCURRENTLY IF NOT EXISTS` for zero-downtime.

### 8. Documentation: `docs/upgrade/README.md`
**Type:** New file  
**Impact:** None (documentation only)

Explains non-destructive policy, rollback procedures, and flag toggles.

## Conditional Patches (Skipped if File Missing)

### executor.ts Retry Logic
**Status:** SKIPPED (file not found)  
**Would patch:** Add `withRetry` helper and wrap HTTP requests

### ingest/route.ts Guardrails
**Status:** SKIPPED (file not found)  
**Would patch:** Add input validation and size limits

### supabase/functions/ingest/index.ts
**Status:** SKIPPED (file not found)  
**Would patch:** Add input validation

## Diff Summary

- **New files:** 7
- **Patched files:** 2
- **Deleted files:** 0
- **Renamed files:** 0
- **Backups created:** 2 (for patched files)

## Rollback Strategy

1. Revert PR (if merged)
2. Restore `.bak.<timestamp>` files (if local)
3. Remove new files (if needed)
4. Disable flags in `config/flags.crux.json` (set all to false)
