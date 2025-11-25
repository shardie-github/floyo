# Database Migrations & Schema Documentation

**Generated:** 2025-01-20  
**Agent:** Unified Background Agent v3.0  
**Status:** Complete

## Migration Strategy Overview

This project uses a **hybrid migration approach**:
- **Master Migration:** Single consolidated schema file (`99999999999999_master_consolidated_schema.sql`)
- **Incremental Migrations:** Data migrations and schema updates (`YYYYMMDDHHMMSS_description.sql`)
- **Prisma Schema:** Type-safe schema definition (`prisma/schema.prisma`)

## Current Migration State

### Active Migrations

1. **`99999999999999_master_consolidated_schema.sql`**
   - **Purpose:** Bootstrap fresh database to final state
   - **Size:** 1,400+ lines
   - **Status:** ✅ Active
   - **Idempotent:** Yes (uses `IF NOT EXISTS`)
   - **Safe to run:** Yes (multiple times)

2. **`20250120000000_nps_submissions.sql`**
   - **Purpose:** Add NPS submissions table
   - **Status:** ✅ Active
   - **Idempotent:** Yes

### Archived Migrations

**Location:** `supabase/migrations_archive/`

Historical migrations preserved for reference:
- `000000000800_upsert_functions.sql`
- `20240101000000_initial_schema.sql`
- `20240101000001_validation_queries.sql`
- `20240101000002_enhanced_policies.sql`
- `20240101000003_privacy_monitoring.sql`
- `2025-11-05_telemetry.sql`
- `2025-11-05_trust_audit.sql`
- `20250101000000_performance_indexes.sql`
- `20250106000000_metrics_log.sql`
- `20250110000000_consolidated_rls_policies.sql`
- `20250115000000_activation_analytics_indexes.sql`
- `20251105_crux_hardening.sql`
- `20251105_workflow_runs.sql`

**Note:** These are archived and not executed automatically.

## Schema Reconciliation

### Prisma Schema vs Supabase Migrations

**Prisma Schema:** `prisma/schema.prisma`
- **Models:** 20+ models defined
- **Relationships:** Comprehensive foreign keys
- **Indexes:** Defined in `@@index` directives
- **Purpose:** Type-safe TypeScript client generation

**Supabase Migrations:** `supabase/migrations/*.sql`
- **Tables:** Created via SQL DDL
- **RLS Policies:** Defined in migrations
- **Functions:** PostgreSQL functions defined
- **Purpose:** Database schema definition

### Alignment Status

✅ **Aligned:**
- Core tables (User, Session, Event, Pattern, etc.)
- Relationships and foreign keys
- Indexes (most indexes match)

⚠️ **Potential Drift:**
- RLS policies (defined in Supabase, not in Prisma)
- Database functions (defined in Supabase, not in Prisma)
- Constraints (some constraints may differ)

### Validation Scripts

**Existing Scripts:**
1. `scripts/validate-schema-alignment.ts` - Validates Prisma vs Supabase
2. `scripts/db-validate-schema.ts` - Validates database schema
3. `scripts/align-migrations.ts` - Aligns migrations

**Usage:**
```bash
npm run schema:validate
npm run migrations:align
```

## Schema Structure

### Core Tables

**Users & Authentication:**
- `users` - User accounts
- `sessions` - Authentication sessions
- `mfa_enforced_sessions` - MFA sessions

**File Tracking:**
- `events` - File system events
- `patterns` - Detected file usage patterns
- `relationships` - File-to-file relationships

**Multi-tenant:**
- `organizations` - Organizations
- `organization_members` - Organization membership
- `workflows` - Workflow definitions
- `workflow_versions` - Workflow version history
- `workflow_executions` - Workflow execution logs

**Privacy & Compliance:**
- `privacy_prefs` - User privacy preferences
- `app_allowlist` - App-level permissions
- `signal_toggles` - Granular signal controls
- `telemetry_events` - Privacy-first telemetry
- `privacy_transparency_log` - Privacy audit trail
- `audit_logs` - General audit logging
- `retention_policies` - Data retention policies

**Billing & Subscriptions:**
- `subscriptions` - User subscriptions
- `offers` - Pricing offers
- `feature_flags` - Feature flags

**Analytics:**
- `utm_tracks` - UTM tracking
- `cohorts` - Cohort analysis
- `metrics_log` - System metrics
- `nps_submissions` - NPS survey responses

**Integrations:**
- `user_integrations` - Third-party integrations

### Indexes

**User-related:**
- `users.email` (unique)
- `sessions.token` (unique)
- `sessions.userId` (indexed)

**Event-related:**
- `events.userId, events.timestamp` (composite)
- `events.filePath` (indexed)

**Pattern-related:**
- `patterns.userId, patterns.fileExtension` (unique composite)
- `patterns.userId` (indexed)

**Workflow-related:**
- `workflows.userId` (indexed)
- `workflows.organizationId` (indexed)
- `workflows.isActive` (indexed)
- `workflow_executions.workflowId` (indexed)
- `workflow_executions.status` (indexed)
- `workflow_executions.startedAt` (indexed)

**Privacy-related:**
- `telemetry_events.userId, telemetry_events.timestamp` (composite)
- `telemetry_events.appId` (indexed)
- `telemetry_events.timestamp` (indexed)

### Row Level Security (RLS)

**RLS Policies:** Defined in Supabase migrations

**Key Policies:**
- Users can only access their own data
- Organization members can access org data
- Admins have elevated permissions
- Public read access for certain tables (feature flags, offers)

**Validation Script:** `scripts/verify-rls.ts`

## Migration Workflow

### Creating New Migrations

**For Schema Changes:**
1. Update `prisma/schema.prisma`
2. Generate Prisma client: `npm run prisma:generate`
3. Create Supabase migration: `supabase migration new <description>`
4. Write SQL in migration file
5. Test locally: `supabase start && supabase migration up`
6. Validate alignment: `npm run schema:validate`

**For Data Migrations:**
1. Create incremental migration: `supabase migration new <description>`
2. Write idempotent SQL
3. Test locally
4. Apply to production: `supabase migration up`

### Applying Migrations

**Local Development:**
```bash
supabase start
supabase migration up
```

**Production:**
```bash
supabase link --project-ref <PROJECT_REF>
supabase migration up
```

**Via CI/CD:**
- Automated via `supabase-migrate.yml` workflow
- Runs on push to main
- Validates before applying

## Migration Best Practices

### ✅ Do's

1. **Use `IF NOT EXISTS`** for idempotent operations
2. **Test locally first** before applying to production
3. **Document breaking changes** in migration comments
4. **Keep migrations small** and focused
5. **Use transactions** for related changes
6. **Validate schema alignment** after migrations

### ❌ Don'ts

1. **Don't modify existing migrations** (create new ones instead)
2. **Don't delete data** without backup
3. **Don't run migrations without testing**
4. **Don't ignore schema drift** warnings
5. **Don't mix schema and data migrations** unnecessarily

## Troubleshooting

### Migration Fails

**Symptoms:** Migration fails with error

**Solutions:**
1. Check Supabase logs: `supabase logs`
2. Verify project link: `supabase projects list`
3. Check migration status: `supabase migration list`
4. Rollback if needed: `supabase migration down`

### Schema Drift

**Symptoms:** Prisma schema doesn't match database

**Solutions:**
1. Pull current schema: `supabase db pull`
2. Compare with Prisma: `npm run schema:validate`
3. Create alignment migration: `npm run migrations:align`
4. Apply migration: `supabase migration up`

### Missing Tables/Columns

**Symptoms:** Application errors about missing tables

**Solutions:**
1. Check migration status: `supabase migration list`
2. Apply pending migrations: `supabase migration up`
3. Verify schema: `npm run schema:validate`

## Migration Scripts Reference

### Available Scripts

**Validation:**
- `npm run schema:validate` - Validate schema alignment
- `npm run migrations:align` - Align migrations
- `npm run verify:rls` - Verify RLS policies

**Migration:**
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma migrations (dev)
- `npm run prisma:deploy` - Deploy Prisma migrations (prod)
- `npm run supa:migrate:apply` - Apply Supabase migrations

**Database:**
- `npm run prisma:studio` - Open Prisma Studio
- `tsx scripts/db-validate-schema.ts` - Validate database schema

## Future Improvements

### Recommended Enhancements

1. **Automated Schema Validation**
   - Add CI check for schema alignment
   - Block PRs with schema drift

2. **Migration Testing**
   - Add migration tests in CI
   - Test rollback procedures

3. **Schema Documentation**
   - Auto-generate ER diagrams
   - Document RLS policies

4. **Migration Monitoring**
   - Track migration execution time
   - Alert on migration failures

---

**Generated by Unified Background Agent v3.0**  
**Last Updated:** 2025-01-20
