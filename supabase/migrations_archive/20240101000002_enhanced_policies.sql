-- Additional RLS Policies for Enhanced Security
-- Run this after the initial migration if you need more granular control

-- ============================================================================
-- ENHANCED RLS POLICIES
-- ============================================================================

-- Admin role check function (if you have admin users)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND id IN (
      SELECT "userId" FROM subscriptions
      WHERE plan = 'enterprise'
      AND status = 'active'
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Service role bypass (for background jobs)
CREATE POLICY "Service role can do everything on users"
    ON users FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on events"
    ON events FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on patterns"
    ON patterns FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on relationships"
    ON relationships FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on utm_tracks"
    ON utm_tracks FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on cohorts"
    ON cohorts FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on audit_logs"
    ON audit_logs FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to check table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    size_pretty TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname||'.'||tablename AS table_name,
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size_pretty
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check index usage
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname||'.'||indexrelname AS index_name,
        schemaname||'.'||relname AS table_name,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA RETENTION FUNCTION
-- ============================================================================

-- Function to clean up old data based on retention policies
CREATE OR REPLACE FUNCTION cleanup_retention_data()
RETURNS TABLE (
    table_name TEXT,
    rows_deleted BIGINT
) AS $$
DECLARE
    policy_record RECORD;
    deleted_count BIGINT;
BEGIN
    FOR policy_record IN
        SELECT "tableName", "retentionDays"
        FROM retention_policies
        WHERE enabled = true
    LOOP
        EXECUTE format(
            'DELETE FROM %I WHERE timestamp < NOW() - INTERVAL ''%s days''',
            policy_record."tableName",
            policy_record."retentionDays"
        );
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Update last run
        UPDATE retention_policies
        SET "lastRun" = NOW()
        WHERE "tableName" = policy_record."tableName";
        
        table_name := policy_record."tableName";
        rows_deleted := deleted_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECURITY AUDIT FUNCTION
-- ============================================================================

-- Function to audit RLS policy violations (log suspicious access attempts)
CREATE OR REPLACE FUNCTION audit_rls_violation(
    table_name TEXT,
    attempted_user_id UUID,
    operation TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        "userId",
        action,
        resource,
        metadata
    ) VALUES (
        attempted_user_id,
        'rls_violation',
        table_name,
        jsonb_build_object(
            'operation', operation,
            'table', table_name,
            'timestamp', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage() TO authenticated;

-- Service role has full access
GRANT EXECUTE ON FUNCTION cleanup_retention_data() TO service_role;
GRANT EXECUTE ON FUNCTION audit_rls_violation(TEXT, UUID, TEXT) TO service_role;
