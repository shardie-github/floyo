# Supabase Migrations

This directory contains the canonical database migration files for the Supabase project.

## Migration Strategy

This project uses a **single canonical master migration** approach:

- **Master Migration**: `99999999999999_master_consolidated_schema.sql`
  - This is the single source of truth for the database schema
  - Can bootstrap a fresh database to the final intended state
  - Safe to run multiple times (uses `IF NOT EXISTS`, idempotent operations)

- **Legacy Migrations**: Archived in `../migrations_archive/`
  - Historical migration files are preserved for reference
  - Not executed automatically - kept for historical record

## Applying Migrations

### Using Supabase CLI (Recommended)

```bash
# Ensure you're linked to your project
supabase link --project-ref <PROJECT_REF>

# Apply migrations
supabase migration up
```

Or use the helper script:

```bash
./scripts/supa-migrate-all.sh
```

### Manual Application

If you need to apply migrations manually:

1. Link to your Supabase project:
   ```bash
   supabase link --project-ref <PROJECT_REF>
   ```

2. Apply migrations:
   ```bash
   supabase migration up
   ```

## Creating New Migrations

For new structural changes, you have two options:

### Option 1: Update Master Migration (Recommended for Schema Changes)

If the change is a structural schema modification (new tables, columns, indexes, etc.), update the master migration file directly:

```bash
# Edit the master migration
vim supabase/migrations/99999999999999_master_consolidated_schema.sql

# Apply changes
supabase migration up
```

### Option 2: Create Incremental Migration (For Data Migrations)

If you need to migrate existing data or make changes that can't be idempotent, create a new incremental migration:

```bash
# Create new migration
supabase migration new <descriptive_name>

# Edit the new migration file
vim supabase/migrations/<timestamp>_<descriptive_name>.sql

# Apply migrations
supabase migration up
```

**Note**: Incremental migrations should be:
- Named with timestamp prefix: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Idempotent where possible (use `IF NOT EXISTS`, `ON CONFLICT`, etc.)
- Documented with comments explaining the change

## Migration Best Practices

1. **Always use `IF NOT EXISTS`** for tables, indexes, functions, etc.
2. **Make operations idempotent** - safe to run multiple times
3. **Test on local Supabase instance first**:
   ```bash
   supabase start
   supabase migration up
   ```
4. **Document breaking changes** in migration comments
5. **Use transactions** for related changes (Supabase CLI handles this)

## Troubleshooting

### Migration Fails

1. Check Supabase logs:
   ```bash
   supabase logs
   ```

2. Verify your project is linked:
   ```bash
   supabase projects list
   ```

3. Check migration status:
   ```bash
   supabase migration list
   ```

### Schema Drift

If your local schema differs from production:

1. Pull current schema:
   ```bash
   supabase db pull
   ```

2. Compare with migrations:
   ```bash
   supabase migration list
   ```

3. Create migration to sync:
   ```bash
   supabase migration new sync_schema
   ```

## Related Documentation

- [Database Overview](../../docs/db-overview.md) - Complete schema documentation
- [Database Gaps](../../docs/db-gaps.md) - Known issues and inconsistencies
- [Environment Setup](../../docs/env-setup.md) - Environment variable configuration
