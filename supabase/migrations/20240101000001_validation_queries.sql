-- Validation Queries for Supabase Setup
-- Run these queries to verify everything is configured correctly

-- ============================================================================
-- CHECK RLS STATUS
-- ============================================================================

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All tables should have rls_enabled = true

-- ============================================================================
-- CHECK RLS POLICIES
-- ============================================================================

-- Count policies per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected: Each table should have at least 1 policy

-- ============================================================================
-- CHECK INDEXES
-- ============================================================================

-- List all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check for missing indexes on foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = tc.table_name
        AND indexdef LIKE '%' || kcu.column_name || '%'
    );

-- Expected: Should return minimal results (some FKs may not need indexes)

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- List all check constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- ============================================================================
-- CHECK TRIGGERS
-- ============================================================================

-- List all triggers
SELECT
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: Should see update_updated_at triggers on all tables with updatedAt columns

-- ============================================================================
-- CHECK TABLE SIZES
-- ============================================================================

-- Get table sizes (run get_table_sizes function)
SELECT * FROM get_table_sizes();

-- ============================================================================
-- CHECK INDEX USAGE
-- ============================================================================

-- Get index usage statistics
SELECT * FROM get_index_usage()
WHERE idx_scan = 0
ORDER BY table_name;

-- Expected: New indexes may show 0 scans initially, but should increase with usage

-- ============================================================================
-- SECURITY AUDIT QUERIES
-- ============================================================================

-- Check for any RLS violations in audit logs
SELECT *
FROM audit_logs
WHERE action = 'rls_violation'
ORDER BY timestamp DESC
LIMIT 10;

-- Check for suspicious patterns
SELECT
    "userId",
    action,
    COUNT(*) as count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY "userId", action
HAVING COUNT(*) > 100
ORDER BY count DESC;

-- ============================================================================
-- PERFORMANCE QUERIES
-- ============================================================================

-- Check for slow queries (requires pg_stat_statements extension)
-- SELECT 
--     query,
--     calls,
--     total_time,
--     mean_time,
--     max_time
-- FROM pg_stat_statements
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for orphaned records
SELECT 'sessions' as table_name, COUNT(*) as orphaned_count
FROM sessions s
LEFT JOIN users u ON s."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'events', COUNT(*)
FROM events e
LEFT JOIN users u ON e."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'patterns', COUNT(*)
FROM patterns p
LEFT JOIN users u ON p."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'relationships', COUNT(*)
FROM relationships r
LEFT JOIN users u ON r."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'subscriptions', COUNT(*)
FROM subscriptions s
LEFT JOIN users u ON s."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'utm_tracks', COUNT(*)
FROM utm_tracks ut
LEFT JOIN users u ON ut."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'cohorts', COUNT(*)
FROM cohorts c
LEFT JOIN users u ON c."userId" = u.id
WHERE u.id IS NULL;

-- Expected: All should return 0 orphaned records

-- ============================================================================
-- VALIDATION SUMMARY
-- ============================================================================

-- Run this to get a summary of your setup
SELECT
    'Tables' as category,
    COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT
    'RLS Enabled Tables',
    COUNT(*)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true

UNION ALL

SELECT
    'RLS Policies',
    COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Indexes',
    COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Triggers',
    COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT
    'Functions',
    COUNT(*)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';
