# PR: harden(crux): non-destructive performance/security upgrade

## Summary

This PR adds non-destructive performance, security, and observability enhancements to the CRUX workflow engine. All changes are feature-flagged, marker-based patches, and include rollback instructions.

## What Changed

### ✅ New Files (13)
- `config/flags.crux.json` - Feature flags configuration
- `frontend/lib/utils/rate-limit.ts` - Rate limiting utility
- `frontend/lib/utils/retry.ts` - Retry logic with exponential backoff
- `frontend/lib/obs/log.ts` - Structured logging utility  
- `frontend/app/headers.ts` - Security headers (CSP disabled by default)
- `supabase/migrations/20251105_crux_hardening.sql` - Online-safe indexes
- `supabase/functions/_shared/guardrails.ts` - Edge function guardrails
- `scripts/verify-rls.ts` - RLS verification script
- `scripts/audit-secrets.ts` - Secrets audit script
- `docs/upgrade/README.md` - Upgrade guide
- `docs/upgrade/UPGRADE_SUMMARY.md` - Summary document
- `docs/upgrade/NEXT_STEPS.md` - Next steps roadmap
- `docs/upgrade/QUICK_REFERENCE.md` - Quick reference guide

### 🔧 Patched Files (2) - Marker-Based
- `frontend/next.config.js` - Bundle analyzer support (conditional)
- `.github/workflows/deploy-main.yml` - Smoke test step

### 💾 Backups Created
- `frontend/next.config.js.bak.20251105_043451`
- `.github/workflows/deploy-main.yml.bak.20251105_043451`

## Key Features

### Security
- ✅ CSP headers available (disabled by default to prevent embed breakage)
- ✅ Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- ✅ Rate limiting utility for API endpoints

### Performance
- ✅ Optional bundle analyzer (requires `ANALYZE=true` and package install)
- ✅ Online-safe concurrent database indexes
- ✅ Zero-downtime migration support

### Observability
- ✅ Structured logging utility
- ✅ CI smoke tests for hardened utilities

### Reliability
- ✅ Structured logging utility
- ✅ Retry logic with exponential backoff and jitter
- ✅ Edge function timeout guards and input validation
- ✅ CI smoke tests for hardened utilities

### Security Tools
- ✅ RLS verification script (test user isolation)
- ✅ Secrets audit script (scan for exposed secrets)

## Feature Flags

All new features are controlled via `config/flags.crux.json`:

```json
{
  "csp_headers": false,        // OFF by default (enable after testing)
  "rate_limit_api": true,       // Protection enabled
  "observability_min": true,    // Minimal logging enabled
  // ... other flags
}
```

## Migration

The database migration (`20251105_crux_hardening.sql`):
- Uses `CREATE INDEX CONCURRENTLY IF NOT EXISTS` for zero-downtime
- Safely handles missing `signals` table
- Idempotent (can run multiple times)

**Note:** If your migration runner wraps in a transaction, you may need to split indexes into separate files.

## Testing

- [x] Plan files created
- [x] All files created/patched
- [x] Backups created
- [x] Documentation complete
- [ ] Type check (will run in CI)
- [ ] Build (will run in CI)
- [ ] Smoke tests (will run in CI)
- [ ] Migration test (apply on staging first)

## Rollback

If needed:
1. **Revert PR** (recommended)
2. **Restore backups**: Use `.bak.20251105_043451` files
3. **Disable flags**: Set all flags to `false` in `config/flags.crux.json`
4. **Drop indexes**: `DROP INDEX CONCURRENTLY IF EXISTS ...`

See `docs/upgrade/README.md` for detailed rollback instructions.

## Documentation

- 📖 **Upgrade Guide**: `docs/upgrade/README.md`
- 📋 **Preflight Plans**: `docs/upgrade/00_inventory.plan.md`, `01_diffs.plan.md`, `02_risks.plan.md`
- 📝 **Summary**: `docs/upgrade/UPGRADE_SUMMARY.md`
- 📄 **CHANGELOG**: See `CHANGELOG.md`

## Next Steps

1. Review this PR
2. Test locally (type-check, build)
3. Test migration on staging
4. Merge when ready
5. Enable features via flags as needed

**See `docs/upgrade/NEXT_STEPS.md` for future enhancements roadmap:**
- Edge function hardening (guardrails created)
- Workflow executor with retries (utility ready)
- Queue shim for workflow runs
- Enhanced observability (Sentry integration)
- Bundle analyzer integration
- CSP policy customization

## Post-Merge

After merge, enable features:
- **CSP Headers**: Set `flags.crux.csp_headers=true` (after confirming embed whitelists)
- **Bundle Analyzer**: `ANALYZE=true npm run build` (requires `@next/bundle-analyzer`)

---

**All changes are non-destructive and ready for review!** ✅
