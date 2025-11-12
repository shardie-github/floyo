# Agent Scripts

**Purpose:** Automation scripts for database migrations, verification, and system health

---

## Scripts

### `generate_delta_migration.ts`

**Purpose:** Generate idempotent SQL migration with only missing database objects

**Usage:**
```bash
export SUPABASE_DB_URL="postgresql://..."
node scripts/agents/generate_delta_migration.ts
```

**What It Does:**
- Checks for missing extensions (pgcrypto, pg_trgm)
- Checks for missing tables (events, orders, spend, experiments, etc.)
- Checks for missing columns (gross_margin_cents, traffic)
- Checks for missing indexes
- Checks for missing RLS policies
- Creates idempotent SQL (IF NOT EXISTS, guarded policy blocks)
- Outputs to `/supabase/migrations/YYYYMMDDHHMMSS_delta.sql`

**Features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ No destructive DDL (only additive)
- ✅ No duplication (checks before creating)
- ✅ Timezone-aware (America/Toronto)

---

### `verify_db.ts`

**Purpose:** Verify database state (tables, columns, indexes, RLS)

**Usage:**
```bash
export DATABASE_URL="postgresql://..."
node scripts/agents/verify_db.ts
```

**What It Checks:**
- All required tables exist
- All required columns exist
- All required indexes exist
- RLS enabled on all tables
- At least one policy exists on each table

**Output:**
- ✅ DB verified (if all checks pass)
- Error messages (if checks fail)

---

### `system_health.ts`

**Purpose:** Generate system health report files

**Usage:**
```bash
node scripts/agents/system_health.ts
```

**What It Does:**
- Creates system health report files in `/reports/system/`
- Creates solution files in `/solutions/system/`
- Creates master report in `/reports/system_health_YYYY-MM-DD.md`

**Note:** This is a stub generator. Full reports are created manually in Phase C.

---

## Dependencies

- `pg` - PostgreSQL client
- `@types/pg` - TypeScript types for pg

**Install:**
```bash
npm install pg @types/pg
```

---

## Environment Variables

**Required:**
- `SUPABASE_DB_URL` or `DATABASE_URL` - PostgreSQL connection string

**Format:**
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

---

## Error Handling

**Connection Errors:**
- Check database URL is correct
- Check network access
- Check firewall rules

**Migration Errors:**
- Check SQL syntax (if manual edits)
- Check permissions (service-role key required)
- Check database state (run verification script)

---

## Integration

**GitHub Actions:**
- `/infra/gh-actions/supabase_delta_apply.yml` - Runs migration + verification
- `/infra/gh-actions/system_health.yml` - Runs system health generator

**Cron:**
- `/infra/cron/etl.cron` - ETL schedule (not used directly, but referenced)

---

## Examples

**Generate Migration:**
```bash
export SUPABASE_DB_URL="postgresql://postgres:password@db.abc123.supabase.co:5432/postgres"
node scripts/agents/generate_delta_migration.ts
# Output: ✅ wrote supabase/migrations/20250127120000_delta.sql
```

**Verify Database:**
```bash
export DATABASE_URL="$SUPABASE_DB_URL"
node scripts/agents/verify_db.ts
# Output: ✅ DB verified
```

**Generate System Health:**
```bash
node scripts/agents/system_health.ts
# Output: ✅ System Health files written.
```

---

## Notes

- All scripts use idempotent SQL (IF NOT EXISTS)
- No destructive DDL (only additive)
- Re-runs are safe (no duplication)
- Timezone: America/Toronto
