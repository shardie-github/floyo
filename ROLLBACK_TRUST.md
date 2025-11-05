# Trust Layer Rollback Notes

**Date:** 2025-11-05  
**Purpose:** Instructions for rolling back the STAKE+TRUST trust layer additions

## Rollback Procedures

### 1. Disable Feature Flags

Set all flags in `config/flags.trust.json` to `false`:

```json
{
  "privacy_center": false,
  "status_page": false,
  "audit_log": false,
  "admin_controls": false,
  "export_portability": false,
  "help_center": false,
  "a11y_checks": true,
  "slo_sla_docs": false,
  "incident_comms": false,
  "api_portal": false,
  "rate_limit_disclosure": false,
  "data_retention_disclosure": false
}
```

### 2. Revert Database Migration

If needed, drop the `audit_log` table:

```sql
-- Drop RLS policies first
DROP POLICY IF EXISTS "audit_owner" ON public.audit_log;

-- Drop indexes
DROP INDEX IF EXISTS idx_audit_log_user_id;
DROP INDEX IF EXISTS idx_audit_log_ts;

-- Drop table
DROP TABLE IF EXISTS public.audit_log CASCADE;
```

**Note:** This will delete all audit log data. Only do this if absolutely necessary.

### 3. Remove UI Pages (Optional)

If you need to remove the pages entirely:

```bash
rm frontend/app/trust/page.tsx
rm frontend/app/status/page.tsx
rm frontend/app/help/page.tsx
rm frontend/app/account/audit-log/page.tsx
rm frontend/app/account/export/page.tsx
```

### 4. Remove API Endpoints (Optional)

If you need to remove the API endpoints:

```bash
rm frontend/app/api/audit/me/route.ts
rm frontend/app/api/feedback/route.ts
```

### 5. Revert Layout Changes

Remove the marker blocks from `frontend/app/layout.tsx`:

- Remove `[STAKE+TRUST:BEGIN:i18n_attributes]` block (lines 64-71)
- Remove `[STAKE+TRUST:BEGIN:footer_links]` block (lines 110-140)

Restore original footer:

```tsx
<footer className="border-t border-border py-10 text-sm text-muted-foreground mt-auto">
  <div className="container">
    © {new Date().getFullYear()} Hardonia
  </div>
</footer>
```

And restore original html tag:

```tsx
<html lang="en" suppressHydrationWarning>
```

### 6. Remove CI Checks (Optional)

Remove the Trust Smoke step from `.github/workflows/deploy-main.yml`:

- Remove lines between `# [STAKE+TRUST:BEGIN:checks]` and `# [STAKE+TRUST:END:checks]`

### 7. Remove Documentation (Optional)

If you want to remove all trust documentation:

```bash
rm -rf docs/trust/
rm config/flags.trust.json
```

### 8. Revert CHANGELOG

Remove the STAKE+TRUST section from `CHANGELOG.md` (lines 5-14).

## Partial Rollback

### Keep Documentation, Remove Features

1. Keep all documentation files
2. Disable all feature flags
3. Pages will be inaccessible but code remains

### Keep Database, Remove UI

1. Keep `audit_log` table and migration
2. Remove UI pages
3. Keep API endpoints (they can still be used programmatically)

## Testing After Rollback

1. Verify pages are inaccessible (if removed) or hidden (if flags disabled)
2. Verify API endpoints return appropriate errors (if removed)
3. Verify database migration can be reverted (if needed)
4. Verify CI checks pass without Trust Smoke step

## Notes

- All changes are non-destructive (marker-based patches)
- Feature flags default to OFF, so disabling flags is sufficient for most rollbacks
- Database migration is online-safe (can be reverted without downtime)
- Documentation files are additive and can remain even if features are disabled

## Emergency Rollback

If immediate rollback is needed:

1. **Disable flags** (fastest): Set all flags in `config/flags.trust.json` to `false`
2. **Revert deployment**: Roll back to previous deployment version
3. **Database**: Leave table in place (doesn't affect functionality if unused)

## Questions?

If you need help with rollback, contact:
- Engineering: engineering@example.com
- Support: support@example.com
