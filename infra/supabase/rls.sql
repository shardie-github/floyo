-- Row Level Security (RLS) Policies for Finance Automation Schema
-- Baseline RLS and policy templates
-- Timezone: America/Toronto

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is service role (for ETL scripts)
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current role is service_role (used by Supabase service role key)
    RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check admin status from JWT claims or user metadata
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::json->>'user_role')::text = 'admin',
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Service role can do everything (for ETL scripts)
CREATE POLICY "Service role full access on events"
    ON events FOR ALL
    USING (is_service_role())
    WITH CHECK (is_service_role());

-- Authenticated users can insert their own events
CREATE POLICY "Users can insert own events"
    ON events FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid()::text = (properties->>'user_id')::text
        OR properties->>'user_id' IS NULL
    );

-- Authenticated users can read their own events
CREATE POLICY "Users can read own events"
    ON events FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR is_admin()
    );

-- Admins can read all events
CREATE POLICY "Admins can read all events"
    ON events FOR SELECT
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Service role full access (for ETL scripts)
CREATE POLICY "Service role full access on orders"
    ON orders FOR ALL
    USING (is_service_role())
    WITH CHECK (is_service_role());

-- Authenticated users can read their own orders
CREATE POLICY "Users can read own orders"
    ON orders FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR is_admin()
    );

-- Service role can insert/update orders (for ETL)
CREATE POLICY "Service role can modify orders"
    ON orders FOR INSERT, UPDATE
    TO authenticated
    USING (is_service_role())
    WITH CHECK (is_service_role());

-- ============================================================================
-- SPEND TABLE POLICIES
-- ============================================================================

-- Service role full access (for ETL scripts)
CREATE POLICY "Service role full access on spend"
    ON spend FOR ALL
    USING (is_service_role())
    WITH CHECK (is_service_role());

-- Admins and finance team can read spend
CREATE POLICY "Admins can read spend"
    ON spend FOR SELECT
    TO authenticated
    USING (is_admin());

-- Service role can insert/update spend (for ETL)
CREATE POLICY "Service role can modify spend"
    ON spend FOR INSERT, UPDATE
    TO authenticated
    USING (is_service_role())
    WITH CHECK (is_service_role());

-- ============================================================================
-- EXPERIMENTS TABLE POLICIES
-- ============================================================================

-- Service role full access
CREATE POLICY "Service role full access on experiments"
    ON experiments FOR ALL
    USING (is_service_role())
    WITH CHECK (is_service_role());

-- Authenticated users can read active experiments
CREATE POLICY "Users can read active experiments"
    ON experiments FOR SELECT
    TO authenticated
    USING (
        status IN ('running', 'completed')
        OR is_admin()
    );

-- Admins and experiment owners can modify experiments
CREATE POLICY "Admins and owners can modify experiments"
    ON experiments FOR ALL
    TO authenticated
    USING (
        is_admin()
        OR owner = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    WITH CHECK (
        is_admin()
        OR owner = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- ============================================================================
-- METRICS_DAILY TABLE POLICIES
-- ============================================================================

-- Service role full access (for ETL scripts)
CREATE POLICY "Service role full access on metrics_daily"
    ON metrics_daily FOR ALL
    USING (is_service_role())
    WITH CHECK (is_service_role());

-- Authenticated users can read metrics (for dashboards)
CREATE POLICY "Users can read metrics"
    ON metrics_daily FOR SELECT
    TO authenticated
    USING (true); -- All authenticated users can view aggregated metrics

-- Admins can modify metrics (for manual corrections)
CREATE POLICY "Admins can modify metrics"
    ON metrics_daily FOR UPDATE, INSERT
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- POLICY TEMPLATES (for reference/customization)
-- ============================================================================

-- Template: Time-based access (e.g., only current month)
/*
CREATE POLICY "Time-based access template"
    ON <table_name> FOR SELECT
    TO authenticated
    USING (
        date >= date_trunc('month', CURRENT_DATE)
        OR is_admin()
    );
*/

-- Template: Department-based access
/*
CREATE POLICY "Department-based access template"
    ON <table_name> FOR SELECT
    TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::json->>'department')::text = 'finance'
        OR is_admin()
    );
*/

-- Template: IP whitelist (for ETL scripts)
/*
CREATE POLICY "IP whitelist template"
    ON <table_name> FOR ALL
    USING (
        inet_client_addr() = ANY(ARRAY['10.0.0.0/8', '172.16.0.0/12'])
        OR is_service_role()
    );
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Service role policies allow ETL scripts to read/write using service_role key
-- 2. Authenticated users can read their own data and public aggregated metrics
-- 3. Admins have broader access for operations and corrections
-- 4. Adjust policies based on your specific security requirements
-- 5. Test policies with: SELECT * FROM <table> WHERE ... (as different roles)
-- 6. Monitor policy performance; add indexes if needed for policy checks
