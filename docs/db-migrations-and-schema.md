# Database Migrations & Schema Orchestration

**Generated:** 2025-01-XX  
**Purpose:** Document migration strategy and schema reconciliation

## Migration Systems Overview

### Current State

This project uses **two migration systems**:

1. **Supabase Migrations**
   - Location: `supabase/migrations/`
   - Master schema: `99999999999999_master_consolidated_schema.sql`
   - Applied via: `supabase-migrate.yml` CI workflow
   - CLI: `supabase migration up`

2. **Prisma Schema**
   - Location: `prisma/schema.prisma`
   - Purpose: ORM type definitions
   - Generation: `prisma generate`
   - Migration: `prisma migrate` (may be separate)

### ⚠️ Risk: Schema Drift

**Problem:** Two migration systems can drift apart, causing:
- Type mismatches between Prisma and database
- Runtime errors from missing columns/tables
- Deployment failures

**Solution:** Implement validation and sync strategy (see below)

---

## Migration Strategy

### Supabase Migrations (Primary)

**Master Migration Approach:**
- Single consolidated migration file
- Idempotent operations (`IF NOT EXISTS`)
- Safe to run multiple times
- Historical migrations archived

**Applying Migrations:**

```bash
# Local development
supabase start
supabase migration up

# Production (via CI)
# Automatically applied by supabase-migrate.yml workflow
```

**Creating New Migrations:**

1. **Schema Changes:** Update master migration directly
2. **Data Migrations:** Create incremental migration

```bash
supabase migration new descriptive_name
# Edit: supabase/migrations/TIMESTAMP_descriptive_name.sql
```

### Prisma Schema (Secondary)

**Current Usage:**
- Type definitions for TypeScript/JavaScript
- Client generation: `prisma generate`
- May be used in Python via bridge (not confirmed)

**Sync Strategy:**

**Option 1: Prisma → Supabase (Recommended)**
```bash
# Generate Supabase migration from Prisma changes
prisma migrate dev --create-only
# Convert Prisma migration to Supabase format
# Apply via Supabase CLI
```

**Option 2: Supabase → Prisma**
```bash
# Pull schema from Supabase
supabase db pull
# Generate Prisma schema from Supabase
# (Requires custom tooling)
```

**Option 3: Manual Sync (Current)**
- Maintain both manually
- Use validation script to detect drift
- ⚠️ Requires discipline

---

## Schema Validation

### Validation Script

**Location:** `scripts/db-validate-schema.ts`

**Purpose:**
- Validates core tables exist
- Checks required columns
- Detects schema drift

**Usage:**
```bash
tsx scripts/db-validate-schema.ts
```

**CI Integration:**
- Runs after migrations in `supabase-migrate.yml`
- Non-blocking (can be made blocking)

### Core Tables (Required)

The following tables **must exist**:

1. `users` - User accounts
2. `sessions` - Auth sessions
3. `events` - File system events
4. `patterns` - Detected usage patterns
5. `relationships` - File relationships
6. `subscriptions` - Billing
7. `privacy_prefs` - Privacy settings
8. `organizations` - Multi-tenant support
9. `workflows` - Workflow definitions

**See:** `scripts/db-validate-schema.ts` for full list

---

## CI/CD Migration Workflow

### Current Workflow

**File:** `.github/workflows/supabase-migrate.yml`

**Steps:**
1. Checkout repository
2. Setup Node.js
3. Login to Supabase
4. Link Supabase project
5. Apply migrations (`supabase migration up`)
6. Validate schema (`scripts/db-validate-schema.ts`)

**Triggers:**
- Push to `main` branch
- Manual (`workflow_dispatch`)

**Concurrency:**
- Single migration at a time (no cancellation)

### Recommendations

1. ✅ **Current workflow is good**
2. ⚠️ **Consider:** Pre-migration backup
3. ⚠️ **Consider:** Rollback strategy
4. ⚠️ **Consider:** Migration testing in staging

---

## Schema Reconciliation Plan

### Step 1: Audit Current State

```bash
# Check Prisma schema
cat prisma/schema.prisma

# Check Supabase migrations
cat supabase/migrations/99999999999999_master_consolidated_schema.sql

# Validate against database
tsx scripts/db-validate-schema.ts
```

### Step 2: Identify Drift

**Compare:**
- Prisma schema vs Supabase migrations
- Supabase migrations vs actual database
- Prisma schema vs actual database

**Tools:**
- `scripts/db-validate-schema.ts` (already exists)
- `scripts/validate-schema-alignment.ts` (if exists)
- Manual comparison

### Step 3: Reconcile

**If Prisma is ahead:**
1. Generate Supabase migration from Prisma changes
2. Apply migration
3. Verify schema

**If Supabase is ahead:**
1. Update Prisma schema to match Supabase
2. Regenerate Prisma client
3. Verify types

**If both are out of sync:**
1. Choose source of truth (recommend Supabase)
2. Update other to match
3. Document decision

### Step 4: Prevent Future Drift

**Automation:**
- CI check: Compare Prisma schema hash with Supabase migration hash
- Pre-commit hook: Validate schema consistency
- Documentation: Clear process for schema changes

---

## Migration Best Practices

### 1. Idempotency

**Always use:**
```sql
CREATE TABLE IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...
CREATE FUNCTION IF NOT EXISTS ...
```

**Avoid:**
```sql
CREATE TABLE ...  -- Will fail if exists
DROP TABLE ...    -- Destructive
```

### 2. Transactions

**Use transactions for related changes:**
```sql
BEGIN;
  -- Multiple related changes
COMMIT;
```

**Note:** Supabase CLI handles transactions automatically

### 3. Testing

**Test locally first:**
```bash
supabase start
supabase migration up
# Test application
supabase stop
```

### 4. Documentation

**Document breaking changes:**
```sql
-- BREAKING: Removes column 'old_field'
-- Migration required: Update application code before applying
ALTER TABLE users DROP COLUMN old_field;
```

### 5. Rollback Strategy

**Create rollback migrations:**
```sql
-- Migration: add_column.sql
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Rollback: remove_column.sql
ALTER TABLE users DROP COLUMN new_field;
```

**Note:** Supabase doesn't support automatic rollback - create manual rollback migrations

---

## Troubleshooting

### Migration Fails

**Symptoms:**
- CI workflow fails
- Schema validation fails
- Application errors

**Steps:**
1. Check Supabase logs: `supabase logs`
2. Verify project link: `supabase projects list`
3. Check migration status: `supabase migration list`
4. Review migration file for syntax errors
5. Test locally: `supabase start && supabase migration up`

### Schema Drift Detected

**Symptoms:**
- Validation script reports missing tables/columns
- Prisma client errors
- Runtime database errors

**Steps:**
1. Identify drift: `tsx scripts/db-validate-schema.ts`
2. Compare Prisma schema with Supabase migrations
3. Create reconciliation migration
4. Apply migration
5. Verify: Re-run validation script

### Migration Conflicts

**Symptoms:**
- Multiple developers create migrations
- Migration order conflicts
- Duplicate migrations

**Steps:**
1. Review all pending migrations
2. Resolve conflicts manually
3. Consolidate if needed
4. Test locally
5. Apply in order

---

## Action Items

### Immediate
1. ✅ Run schema validation: `tsx scripts/db-validate-schema.ts`
2. ✅ Compare Prisma schema with Supabase migrations
3. ✅ Document any drift found

### Short-term (This Week)
1. Create reconciliation migration if drift exists
2. Update CI to fail on schema validation errors (optional)
3. Document schema change process

### Long-term (30 days)
1. Implement automated schema sync (Prisma ↔ Supabase)
2. Add pre-commit hook for schema validation
3. Create migration testing strategy

---

## Related Documentation

- [Stack Discovery](./stack-discovery.md) - Overall architecture
- [Backend Strategy](./backend-strategy.md) - Backend recommendations
- [API Documentation](./api.md) - API endpoints
- [Environment Setup](./env-and-secrets.md) - Environment variables

---

## Conclusion

The current migration strategy (Supabase master migration) is **sound**, but requires:

1. **Validation:** Ensure Prisma schema stays in sync
2. **Documentation:** Clear process for schema changes
3. **Automation:** Prevent drift via CI checks

**No major changes recommended** - focus on validation and sync.
