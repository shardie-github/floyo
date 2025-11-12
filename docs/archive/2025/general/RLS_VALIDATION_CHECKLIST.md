> Archived on 2025-11-12. Superseded by: (see docs/final index)

# RLS Policies Validation Checklist

## Pre-Deployment Checklist

### 1. Migration File Review
- [x] Migration file created: `20250110000000_consolidated_rls_policies.sql`
- [x] All tables from `database/models.py` covered
- [x] Idempotent (uses IF EXISTS, DROP IF EXISTS)
- [x] No syntax errors
- [x] Helper functions defined
- [x] Performance indexes included

### 2. Security Review
- [x] All user-scoped tables: `user_id = auth.uid()`
- [x] All org-scoped tables: `is_org_member()` / `is_org_admin()`
- [x] Service role bypasses for background jobs
- [x] Public read only for non-sensitive tables
- [x] No public write access

### 3. Performance Review
- [x] Indexes on `user_id` columns
- [x] Indexes on `organization_id` columns
- [x] Composite indexes for common queries
- [x] ANALYZE statements included

## Post-Deployment Validation

### 1. Database Checks

Run these queries in Supabase SQL Editor:

```sql
-- Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
    AND c.relkind = 'r'
ORDER BY tablename;

-- Expected: All tables should have rls_enabled = true
```

```sql
-- Check all tables have at least one policy
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected: Each table should have at least 1 policy
```

```sql
-- List all policies created by this migration
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND policyname LIKE '%consolidated%'
    OR policyname IN (
        'Users can view own sessions',
        'Users can view own temporal patterns',
        'Users can view own suggestions',
        'Users can view own configs',
        'Users can view organizations they belong to',
        'Users can view members of their organizations',
        'Users can view own workflows',
        'Users can view own integrations',
        'Users can view own referrals',
        'Users can view own referral rewards',
        'Users can view own campaigns',
        'Users can view own 2FA',
        'Users can view own security audits',
        'Users can view own guardian events',
        'Users can view own trust ledger roots',
        'Users can view own trust fabric models',
        'Users can view own guardian settings',
        'Users can view own predictions',
        'Users can view own notifications'
    )
ORDER BY tablename, policyname;
```

### 2. Function Checks

```sql
-- Verify helper functions exist
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('is_org_member', 'is_org_admin')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Expected: Both functions should exist
```

```sql
-- Check function permissions
SELECT 
    p.proname,
    r.rolname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl a ON a.oid = p.oid
LEFT JOIN pg_roles r ON r.oid = a.aclrole
WHERE n.nspname = 'public'
    AND p.proname IN ('is_org_member', 'is_org_admin');

-- Expected: authenticated and service_role should have EXECUTE
```

### 3. Index Checks

```sql
-- Verify performance indexes exist
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname IN (
        'idx_organization_members_user_id',
        'idx_organization_members_org_id',
        'idx_organization_members_user_org',
        'idx_workflows_user_id',
        'idx_workflows_org_id',
        'idx_user_integrations_user_id',
        'idx_user_integrations_org_id',
        'idx_subscriptions_org_id'
    )
ORDER BY tablename, indexname;

-- Expected: All indexes should exist
```

### 4. Security Testing

#### Test User Isolation
```sql
-- As User A, try to access User B's data (should fail)
SET request.jwt.claim.sub = 'user-a-uuid';
SELECT * FROM user_configs WHERE user_id = 'user-b-uuid';
-- Expected: 0 rows (RLS blocks access)
```

#### Test Organization Access
```sql
-- As Org Member, access org workflows (should succeed)
SET request.jwt.claim.sub = 'member-uuid';
SELECT * FROM workflows WHERE organization_id = 'org-uuid';
-- Expected: Rows if user is org member

-- As Non-Member, access org workflows (should fail)
SET request.jwt.claim.sub = 'non-member-uuid';
SELECT * FROM workflows WHERE organization_id = 'org-uuid';
-- Expected: 0 rows (RLS blocks access)
```

#### Test Service Role Bypass
```sql
-- As service_role, access any data (should succeed)
SET ROLE service_role;
SELECT COUNT(*) FROM user_configs;
-- Expected: All rows (service role bypasses RLS)
RESET ROLE;
```

### 5. Performance Testing

```sql
-- Test RLS policy performance
EXPLAIN ANALYZE
SELECT * FROM workflows 
WHERE user_id = auth.uid();

-- Expected: Uses index idx_workflows_user_id
-- Expected: Query time < 10ms for typical dataset
```

```sql
-- Test org member check performance
EXPLAIN ANALYZE
SELECT * FROM workflows w
WHERE w.organization_id IS NOT NULL
AND is_org_member(w.organization_id);

-- Expected: Uses index idx_organization_members_user_org
-- Expected: Query time < 50ms for typical dataset
```

## Common Issues & Solutions

### Issue: "Policy already exists"
**Solution:** Migration uses `DROP POLICY IF EXISTS`, so this shouldn't happen. If it does, manually drop the policy first.

### Issue: "Function already exists"
**Solution:** Migration uses `CREATE OR REPLACE`, so this is expected and safe.

### Issue: "Table does not exist"
**Solution:** This is expected - migration checks `IF EXISTS` before creating policies. Tables will be created by other migrations.

### Issue: "RLS violation" errors
**Solution:** 
1. Check user is authenticated (`auth.uid()` is not null)
2. Verify user has access to the resource
3. Check service role is used for background jobs
4. Review policy conditions

### Issue: Slow queries after RLS
**Solution:**
1. Verify indexes exist and are being used (`EXPLAIN ANALYZE`)
2. Check `is_org_member()` function performance
3. Consider adding additional indexes
4. Review policy complexity

## Rollback Plan

If rollback is needed:

```sql
-- 1. Drop all policies created by this migration
-- (List policies and drop individually)

-- 2. Drop helper functions (if not used elsewhere)
DROP FUNCTION IF EXISTS is_org_member(UUID);
DROP FUNCTION IF EXISTS is_org_admin(UUID);

-- 3. Drop indexes (optional, for performance)
DROP INDEX IF EXISTS idx_organization_members_user_id;
DROP INDEX IF EXISTS idx_organization_members_org_id;
DROP INDEX IF EXISTS idx_organization_members_user_org;
-- ... (drop other indexes)

-- NOTE: Do NOT disable RLS on tables - this would be a security risk
```

## Monitoring

After deployment, monitor:

1. **RLS Violations**
   ```sql
   SELECT * FROM audit_logs 
   WHERE action = 'rls_violation'
   ORDER BY timestamp DESC
   LIMIT 100;
   ```

2. **Slow Queries**
   ```sql
   -- If pg_stat_statements is enabled
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   WHERE query LIKE '%is_org_member%'
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

3. **Policy Usage**
   ```sql
   -- Check which policies are being used
   SELECT 
       schemaname,
       tablename,
       policyname,
       COUNT(*) as usage_count
   FROM pg_stat_user_tables t
   JOIN pg_policies p ON p.tablename = t.relname
   GROUP BY schemaname, tablename, policyname
   ORDER BY usage_count DESC;
   ```

## Success Criteria

Migration is successful if:

- [x] All tables have RLS enabled
- [x] All tables have at least one policy
- [x] Helper functions exist and are accessible
- [x] Performance indexes exist
- [x] User isolation works (users can't access other users' data)
- [x] Organization access works (members can access org data)
- [x] Service role bypass works (background jobs can access all data)
- [x] No RLS violation errors in production
- [x] Query performance is acceptable (< 100ms for typical queries)

## Support

If issues arise:
1. Check Supabase logs for detailed error messages
2. Review policy conditions using `pg_policies` view
3. Test policies individually using `EXPLAIN ANALYZE`
4. Consult Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
