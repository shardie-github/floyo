# Database Schema Gaps & Inconsistencies

This document identifies gaps, inconsistencies, and issues between migrations, Prisma schema, and actual code usage.

**Generated:** 2025-01-15

---

## ⚠️ Missing in Migrations (Exists in Prisma/Code but Not in Migrations)

### Tables
1. **organizations** - Defined in Prisma but only RLS policies exist in migrations (no CREATE TABLE)
2. **organization_members** - Defined in Prisma but only RLS policies exist in migrations
3. **workflow_versions** - Defined in Prisma but not created in migrations
4. **workflow_executions** - Defined in Prisma but not created in migrations
5. **user_integrations** - Defined in Prisma but only RLS policies exist in migrations

### Columns
- **subscriptions.organizationId** - Referenced in RLS policies but not in table definition
- **workflows.organizationId** - Referenced in RLS policies but not in table definition

---

## ⚠️ Obsolete in Migrations (Defined in Migrations but Not Used)

### Tables
1. **spend** - Created in `000000000800_upsert_functions.sql` but not referenced in Prisma or main codebase
2. **metrics_daily** - Created in `000000000800_upsert_functions.sql` but not referenced in Prisma
3. **events** (alternative schema) - Created in `000000000800_upsert_functions.sql` with different schema than main `events` table

### Functions
1. `upsert_events(_rows jsonb)` - Created but may not be used
2. `upsert_spend(_rows jsonb)` - Created but may not be used
3. `recompute_metrics_daily(_start date, _end date)` - Created but may not be used
4. `system_healthcheck()` - Created but may not be used

---

## ⚠️ Inconsistent Definitions

### Table Name Conflicts
1. **telemetry_events** vs **events**
   - `2025-11-05_telemetry.sql` creates `telemetry_events` with schema: `(id bigserial, user_id uuid, app text, type text, path text, meta jsonb, ts timestamptz)`
   - `20240101000000_initial_schema.sql` creates `events` with schema: `(id uuid, userId uuid, filePath text, eventType text, tool text, timestamp timestamptz, metadata jsonb)`
   - **Resolution:** Need to decide which schema to use or merge them

2. **audit_logs** vs **audit_log**
   - `20240101000000_initial_schema.sql` creates `audit_logs` with schema: `(id uuid, userId uuid, action text, resource text, resourceId text, metadata jsonb, ipAddress inet, userAgent text, timestamp timestamptz)`
   - `2025-11-05_trust_audit.sql` creates `audit_log` with schema: `(id bigserial, user_id uuid, action text, meta jsonb, ts timestamptz)`
   - **Resolution:** Consolidate to single table with comprehensive schema

### Column Naming Inconsistencies
1. **camelCase vs snake_case**
   - Main schema uses camelCase: `userId`, `filePath`, `eventType`, `createdAt`
   - Alternative schemas use snake_case: `user_id`, `file_path`, `event_type`, `created_at`
   - **Resolution:** Standardize on camelCase (matches Prisma convention)

2. **ID Type Inconsistencies**
   - Most tables use `UUID` with `uuid_generate_v4()`
   - Some tables use `bigserial` (telemetry_events, audit_log, metrics_log)
   - **Resolution:** Standardize on UUID for consistency

### Foreign Key References
1. **users.id** - Some tables reference `users(id)`, others reference `auth.users(id)`
   - `telemetry_events` references `auth.users(id)` 
   - `audit_log` references `auth.users(id)`
   - Most other tables reference `users(id)` (public schema)
   - **Resolution:** Use `users(id)` consistently (Supabase auth.users is separate)

---

## ⚠️ Missing Constraints

### Foreign Keys
1. **workflow_runs.workflow_id** - References `workflows(id)` but workflow_id is TEXT, not UUID
2. **user_integrations** - Missing foreign key to `users(id)` if userId is set
3. **organizations** - Missing foreign key relationships

### Unique Constraints
1. **workflow_runs** - No unique constraint on (user_id, workflow_id, status) for pending runs
2. **telemetry_events** - No unique constraint to prevent duplicates

### Check Constraints
1. **workflow_runs.status** - Has CHECK constraint but should validate against enum
2. **subscriptions.plan** - Has CHECK constraint but should match Prisma enum

---

## ⚠️ Missing Indexes

### Critical Missing Indexes
1. **workflow_runs** - Missing index on `(user_id, workflow_id)` for common lookups
2. **user_integrations** - Missing index on `(provider, isActive)` for provider filtering
3. **organizations** - Missing index on `(slug)` for lookups (Prisma has it)
4. **organization_members** - Missing composite index on `(organization_id, user_id)` for membership checks

---

## ⚠️ RLS Policy Gaps

### Missing Policies
1. **organizations** - Policies exist but table may not exist
2. **organization_members** - Policies exist but table may not exist
3. **workflow_versions** - No RLS policies defined
4. **workflow_executions** - No RLS policies defined
5. **user_integrations** - Policies exist but table may not exist

### Inconsistent Policy Patterns
1. Some tables allow service_role bypass, others don't (privacy tables)
2. Some tables have separate SELECT/INSERT/UPDATE policies, others use ALL
3. **Resolution:** Standardize on consistent policy patterns per table type

---

## ⚠️ Function Dependencies

### Missing Helper Functions
1. `auth.role()` - Used in RLS policies but may not be defined
2. `is_admin()` - Defined but may not be used correctly

### Function Permissions
1. Some functions need `SECURITY DEFINER` but may not have it
2. Some functions need grants to `authenticated` role but may be missing

---

## ⚠️ Trigger Issues

### Missing Triggers
1. **organizations** - Missing `updatedAt` trigger
2. **organization_members** - Missing `updatedAt` trigger
3. **workflows** - Missing `updatedAt` trigger
4. **workflow_versions** - Missing triggers
5. **workflow_executions** - Missing triggers
6. **user_integrations** - Missing `updatedAt` trigger

---

## Recommendations

### High Priority
1. **Resolve table conflicts** - Decide on single schema for `events`/`telemetry_events` and `audit_logs`/`audit_log`
2. **Create missing tables** - Add CREATE TABLE statements for organizations, workflow_versions, workflow_executions, user_integrations
3. **Standardize naming** - Choose camelCase or snake_case consistently
4. **Add missing indexes** - Add critical indexes for performance

### Medium Priority
1. **Consolidate RLS policies** - Ensure all tables have consistent, complete policies
2. **Add missing triggers** - Add updatedAt triggers to all tables that need them
3. **Fix foreign keys** - Ensure all foreign keys are properly defined

### Low Priority
1. **Clean up obsolete tables** - Remove or document `spend`, `metrics_daily` if not used
2. **Document function usage** - Verify which functions are actually used
3. **Standardize ID types** - Consider migrating bigserial to UUID for consistency

---

## Action Items for Master Migration

1. ✅ Create single `events` table with comprehensive schema
2. ✅ Create single `audit_logs` table with comprehensive schema  
3. ✅ Add CREATE TABLE for organizations, organization_members, workflow_versions, workflow_executions, user_integrations
4. ✅ Standardize on camelCase naming convention
5. ✅ Use UUID for all primary keys consistently
6. ✅ Add all missing indexes
7. ✅ Add all missing RLS policies
8. ✅ Add all missing triggers
9. ✅ Fix foreign key references to use `users(id)` consistently
10. ✅ Add missing unique constraints
