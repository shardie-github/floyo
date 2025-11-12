-- RLS (Row Level Security) Policies for Metrics Tables
-- Description: Baseline RLS policies and templates for finance automation tables
-- Created: 2025-01-15
-- Timezone: America/Toronto

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Service role can do everything (for ETL scripts)
CREATE POLICY "service_role_all_events" ON events
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read processed events
CREATE POLICY "authenticated_read_processed_events" ON events
    FOR SELECT
    USING (
        auth.role() = 'authenticated' 
        AND processed = TRUE
    );

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Service role can do everything (for ETL scripts)
CREATE POLICY "service_role_all_orders" ON orders
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read orders (for dashboards)
CREATE POLICY "authenticated_read_orders" ON orders
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can only see their own orders (if customer_id matches)
-- Note: This requires a user_id mapping table or JWT claims
-- CREATE POLICY "users_own_orders" ON orders
--     FOR SELECT
--     USING (
--         auth.role() = 'authenticated'
--         AND customer_id = (SELECT user_id FROM user_mappings WHERE email = auth.jwt()->>'email')
--     );

-- ============================================================================
-- SPEND TABLE POLICIES
-- ============================================================================

-- Service role can do everything (for ETL scripts)
CREATE POLICY "service_role_all_spend" ON spend
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read spend data (for dashboards)
CREATE POLICY "authenticated_read_spend" ON spend
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- EXPERIMENTS TABLE POLICIES
-- ============================================================================

-- Service role can do everything (for ETL scripts and automation)
CREATE POLICY "service_role_all_experiments" ON experiments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read experiments
CREATE POLICY "authenticated_read_experiments" ON experiments
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Authenticated users can update experiment status (for feature flags)
CREATE POLICY "authenticated_update_experiments" ON experiments
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- METRICS_DAILY TABLE POLICIES
-- ============================================================================

-- Service role can do everything (for ETL scripts)
CREATE POLICY "service_role_all_metrics_daily" ON metrics_daily
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read metrics (for dashboards)
CREATE POLICY "authenticated_read_metrics_daily" ON metrics_daily
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- POLICY TEMPLATES (for future use)
-- ============================================================================

-- Template: Admin-only access
-- CREATE POLICY "admin_only_<table>" ON <table>
--     FOR ALL
--     USING (
--         auth.role() = 'authenticated'
--         AND EXISTS (
--             SELECT 1 FROM user_roles
--             WHERE user_id = auth.uid()
--             AND role = 'admin'
--         )
--     );

-- Template: Time-based access (e.g., only current month)
-- CREATE POLICY "current_month_only_<table>" ON <table>
--     FOR SELECT
--     USING (
--         auth.role() = 'authenticated'
--         AND date >= DATE_TRUNC('month', CURRENT_DATE)
--     );

-- Template: Department-based access
-- CREATE POLICY "department_<dept>_<table>" ON <table>
--     FOR SELECT
--     USING (
--         auth.role() = 'authenticated'
--         AND EXISTS (
--             SELECT 1 FROM user_departments
--             WHERE user_id = auth.uid()
--             AND department = '<dept>'
--         )
--     );

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Service role policies allow ETL scripts to read/write without user context
-- 2. Authenticated policies provide read access for dashboards
-- 3. For production, consider:
--    - Adding admin role checks
--    - Implementing department-based access
--    - Adding audit logging for sensitive operations
--    - Rate limiting on write operations
-- 4. Update policies based on your specific access control requirements
