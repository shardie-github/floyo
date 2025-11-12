# CRUX+HARDEN Upgrade Guide

## Non-Destructive Policy

This upgrade follows a **strict non-destructive policy**:

- ✅ **No file overwrites** - All changes use marker-based patches
- ✅ **Backups created** - Every edited file has `.bak.<timestamp>` backup
- ✅ **Feature flags** - All new functionality is OFF by default
- ✅ **Online-safe** - Migrations use `CONCURRENTLY` and `IF NOT EXISTS`
- ✅ **Merge-safe** - Changes are additive and compatible with existing code

## What Was Changed

### New Files Created
1. `config/flags.crux.json` - Feature flags configuration
2. `frontend/lib/utils/rate-limit.ts` - Rate limiting utility
3. `frontend/lib/obs/log.ts` - Structured logging utility
4. `frontend/app/headers.ts` - Security headers (CSP disabled by default)
5. `supabase/migrations/20251105_crux_hardening.sql` - Performance indexes

### Files Patched (with markers)
1. `frontend/next.config.js` - Bundle analyzer support (conditional)
2. `.github/workflows/deploy-main.yml` - Smoke test step

### Backup Files Created
- `frontend/next.config.js.bak.20251105_043451`
- `.github/workflows/deploy-main.yml.bak.20251105_043451`

## Feature Flags

All features are controlled via `config/flags.crux.json`:

```json
{
  "events_ingest": true,        // Core: event ingestion
  "signals_detect": true,       // Core: signal detection
  "workflow_dsl": true,         // Core: workflow DSL
  "workflow_autogen": true,     // Core: workflow auto-generation
  "workflow_execute": true,     // Core: workflow execution
  "macro_record": true,         // Core: macro recording
  "bandit_rank": false,         // Experimental: bandit ranking
  "hardened_mode": true,        // Security: hardened defaults
  "csp_headers": false,         // Security: CSP headers (OFF by default)
  "rate_limit_api": true,       // Security: API rate limiting
  "observability_min": true     // Observability: minimal logging
}
```

**Important:** `csp_headers` is **OFF by default** to prevent breaking third-party embeds. Enable only after confirming embed whitelists.

## Rollback Instructions

### Option 1: Revert PR (Recommended)
If this PR hasn't been merged yet, simply close it. If merged, revert the merge commit.

### Option 2: Restore from Backups
```bash
# Restore patched files
cp frontend/next.config.js.bak.20251105_043451 frontend/next.config.js
cp .github/workflows/deploy-main.yml.bak.20251105_043451 .github/workflows/deploy-main.yml

# Remove new files (optional)
rm -rf config/flags.crux.json
rm -rf frontend/lib/utils/rate-limit.ts
rm -rf frontend/lib/obs/log.ts
rm -rf frontend/app/headers.ts
rm -rf supabase/migrations/20251105_crux_hardening.sql
```

### Option 3: Disable Features
Edit `config/flags.crux.json` and set all flags to `false`:

```json
{
  "events_ingest": false,
  "signals_detect": false,
  "workflow_dsl": false,
  "workflow_autogen": false,
  "workflow_execute": false,
  "macro_record": false,
  "bandit_rank": false,
  "hardened_mode": false,
  "csp_headers": false,
  "rate_limit_api": false,
  "observability_min": false
}
```

### Option 4: Rollback Migration
If the migration was applied, you can drop the indexes:

```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_events_user_ts;
DROP INDEX CONCURRENTLY IF EXISTS idx_signals_user_time;
```

## Enabling Features

### Enable CSP Headers
1. Edit `config/flags.crux.json`
2. Set `"csp_headers": true`
3. Test thoroughly (may break third-party embeds)
4. Customize CSP policy in `frontend/app/headers.ts` if needed

### Enable Bundle Analyzer
```bash
# Install dependency
npm install --save-dev @next/bundle-analyzer

# Run build with analyzer
ANALYZE=true npm run build
```

### Use Rate Limiting
Import and use in API routes:

```typescript
import { rateLimit } from '@/lib/utils/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(ip, 30, 10)) {
    return new Response('Too Many Requests', { status: 429 });
  }
  // ... your handler
}
```

### Use Observability Logging
Import and use anywhere:

```typescript
import { log } from '@/lib/obs/log';

log.info('Event processed', { eventId: '123' });
log.warn('Rate limit approaching', { usage: 80 });
log.error('Processing failed', { error: err });
```

## Database Migration Notes

The migration uses `CREATE INDEX CONCURRENTLY` for zero-downtime index creation. However:

- **If your migration runner wraps in a transaction:** Split the migration into separate files or run via CLI
- **If signals table doesn't exist:** The migration safely skips the signals index
- **Migration is idempotent:** Can be run multiple times safely (uses `IF NOT EXISTS`)

## Testing Checklist

Before enabling features in production:

- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Smoke tests pass (CI)
- [ ] Migration applies cleanly (test on staging)
- [ ] CSP headers don't break UI (if enabled)
- [ ] Rate limiter works as expected
- [ ] Logging utilities function correctly

## Troubleshooting

### Build Fails After Patch
- Check `next.config.js` syntax
- Verify bundle analyzer dependency if `ANALYZE=true`
- Restore from backup if needed

### Migration Fails
- Check if migration runner wraps in transaction
- Split `CONCURRENTLY` indexes into separate migration files
- Run indexes manually via CLI if needed

### CSP Breaks UI
- Set `"csp_headers": false` in flags
- Review CSP policy in `frontend/app/headers.ts`
- Add necessary domains to whitelist

### Rate Limiter Not Working
- Verify import path is correct
- Check that rate limiter is called before processing
- Ensure key is consistent (e.g., use IP address)

## Support

For issues or questions:
1. Check plan files: `docs/upgrade/00_inventory.plan.md`, `01_diffs.plan.md`, `02_risks.plan.md`
2. Review this README
3. Check backup files for original state
4. Revert PR if critical issues arise
