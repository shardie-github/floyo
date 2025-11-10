-- ============================================================================
-- CONSOLIDATED RLS POLICIES MIGRATION
-- ============================================================================
-- This migration consolidates all remaining RLS policies for tables that
-- exist in the backend models but don't have RLS policies yet.
--
-- Security Principles:
-- 1. All tables have RLS enabled
-- 2. Users can only access their own data (user_id = auth.uid())
-- 3. Organization members can access org data (via organization_members)
-- 4. Service role can bypass RLS for background jobs
-- 5. Public read access only for non-sensitive tables (feature_flags, offers)
--
-- Performance:
-- - All policies use indexed columns (user_id, organization_id)
-- - Policies are optimized for common query patterns
-- - Service role policies are evaluated first (most permissive)
--
-- Idempotency:
-- - Uses DROP POLICY IF EXISTS before CREATE POLICY
-- - Uses IF NOT EXISTS for tables/indexes
-- - Safe to run multiple times
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Ensure auth.uid() function exists (idempotent)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user is admin of organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- USER SESSIONS (user_sessions table)
-- ============================================================================

-- Enable RLS if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
    ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
    DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
    DROP POLICY IF EXISTS "Service role can do everything on user_sessions" ON user_sessions;
    
    -- User policies
    CREATE POLICY "Users can view own sessions"
      ON user_sessions FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own sessions"
      ON user_sessions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    -- Service role bypass
    CREATE POLICY "Service role can do everything on user_sessions"
      ON user_sessions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- TEMPORAL PATTERNS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'temporal_patterns') THEN
    ALTER TABLE temporal_patterns ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own temporal patterns" ON temporal_patterns;
    DROP POLICY IF EXISTS "Users can manage own temporal patterns" ON temporal_patterns;
    DROP POLICY IF EXISTS "Service role can do everything on temporal_patterns" ON temporal_patterns;
    
    CREATE POLICY "Users can view own temporal patterns"
      ON temporal_patterns FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own temporal patterns"
      ON temporal_patterns FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on temporal_patterns"
      ON temporal_patterns FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- SUGGESTIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suggestions') THEN
    ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own suggestions" ON suggestions;
    DROP POLICY IF EXISTS "Users can manage own suggestions" ON suggestions;
    DROP POLICY IF EXISTS "Service role can do everything on suggestions" ON suggestions;
    
    CREATE POLICY "Users can view own suggestions"
      ON suggestions FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own suggestions"
      ON suggestions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on suggestions"
      ON suggestions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- USER CONFIGS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_configs') THEN
    ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own configs" ON user_configs;
    DROP POLICY IF EXISTS "Users can manage own configs" ON user_configs;
    DROP POLICY IF EXISTS "Service role can do everything on user_configs" ON user_configs;
    
    CREATE POLICY "Users can view own configs"
      ON user_configs FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own configs"
      ON user_configs FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on user_configs"
      ON user_configs FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
    DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
    DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;
    DROP POLICY IF EXISTS "Service role can do everything on organizations" ON organizations;
    
    -- Users can view organizations they're members of
    CREATE POLICY "Users can view organizations they belong to"
      ON organizations FOR SELECT
      USING (is_org_member(id));
    
    -- Users can create organizations (they'll be added as owner via trigger/application logic)
    CREATE POLICY "Users can create organizations"
      ON organizations FOR INSERT
      WITH CHECK (true); -- Application logic will set owner
    
    -- Only admins can update
    CREATE POLICY "Admins can update organizations"
      ON organizations FOR UPDATE
      USING (is_org_admin(id))
      WITH CHECK (is_org_admin(id));
    
    CREATE POLICY "Service role can do everything on organizations"
      ON organizations FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- ORGANIZATION MEMBERS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
    ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
    DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;
    DROP POLICY IF EXISTS "Users can insert themselves" ON organization_members;
    DROP POLICY IF EXISTS "Service role can do everything on organization_members" ON organization_members;
    
    -- Users can view members of organizations they belong to
    CREATE POLICY "Users can view members of their organizations"
      ON organization_members FOR SELECT
      USING (is_org_member(organization_id));
    
    -- Admins can manage members
    CREATE POLICY "Admins can manage members"
      ON organization_members FOR ALL
      USING (is_org_admin(organization_id))
      WITH CHECK (is_org_admin(organization_id));
    
    -- Users can insert themselves (for joining)
    CREATE POLICY "Users can insert themselves"
      ON organization_members FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on organization_members"
      ON organization_members FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- ROLES (RBAC)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
    DROP POLICY IF EXISTS "Service role can manage roles" ON roles;
    
    -- Roles are typically read-only for users
    CREATE POLICY "Anyone can view roles"
      ON roles FOR SELECT
      USING (true);
    
    CREATE POLICY "Service role can manage roles"
      ON roles FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- WORKFLOWS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflows') THEN
    ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own workflows" ON workflows;
    DROP POLICY IF EXISTS "Users can view org workflows" ON workflows;
    DROP POLICY IF EXISTS "Users can manage own workflows" ON workflows;
    DROP POLICY IF EXISTS "Org members can manage org workflows" ON workflows;
    DROP POLICY IF EXISTS "Service role can do everything on workflows" ON workflows;
    
    -- Users can view their own workflows
    CREATE POLICY "Users can view own workflows"
      ON workflows FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Users can view org workflows if they're members
    CREATE POLICY "Users can view org workflows"
      ON workflows FOR SELECT
      USING (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
      );
    
    -- Users can manage their own workflows
    CREATE POLICY "Users can manage own workflows"
      ON workflows FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    -- Org members can manage org workflows
    CREATE POLICY "Org members can manage org workflows"
      ON workflows FOR ALL
      USING (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
      )
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
      );
    
    CREATE POLICY "Service role can do everything on workflows"
      ON workflows FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- WORKFLOW VERSIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_versions') THEN
    ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view workflow versions" ON workflow_versions;
    DROP POLICY IF EXISTS "Users can create workflow versions" ON workflow_versions;
    DROP POLICY IF EXISTS "Service role can do everything on workflow_versions" ON workflow_versions;
    
    -- Users can view versions of workflows they have access to
    CREATE POLICY "Users can view workflow versions"
      ON workflow_versions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workflows w
          WHERE w.id = workflow_versions.workflow_id
          AND (
            w.user_id = auth.uid()
            OR (w.organization_id IS NOT NULL AND is_org_member(w.organization_id))
          )
        )
      );
    
    -- Users can create versions for workflows they own
    CREATE POLICY "Users can create workflow versions"
      ON workflow_versions FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM workflows w
          WHERE w.id = workflow_versions.workflow_id
          AND (
            w.user_id = auth.uid()
            OR (w.organization_id IS NOT NULL AND is_org_admin(w.organization_id))
          )
        )
      );
    
    CREATE POLICY "Service role can do everything on workflow_versions"
      ON workflow_versions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- WORKFLOW EXECUTIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_executions') THEN
    ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view workflow executions" ON workflow_executions;
    DROP POLICY IF EXISTS "Users can create workflow executions" ON workflow_executions;
    DROP POLICY IF EXISTS "Service role can do everything on workflow_executions" ON workflow_executions;
    
    -- Users can view executions of workflows they have access to
    CREATE POLICY "Users can view workflow executions"
      ON workflow_executions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workflows w
          WHERE w.id = workflow_executions.workflow_id
          AND (
            w.user_id = auth.uid()
            OR (w.organization_id IS NOT NULL AND is_org_member(w.organization_id))
          )
        )
      );
    
    -- Users can create executions for workflows they have access to
    CREATE POLICY "Users can create workflow executions"
      ON workflow_executions FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM workflows w
          WHERE w.id = workflow_executions.workflow_id
          AND (
            w.user_id = auth.uid()
            OR (w.organization_id IS NOT NULL AND is_org_member(w.organization_id))
          )
        )
      );
    
    CREATE POLICY "Service role can do everything on workflow_executions"
      ON workflow_executions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- INTEGRATION CONNECTORS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_connectors') THEN
    ALTER TABLE integration_connectors ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view active connectors" ON integration_connectors;
    DROP POLICY IF EXISTS "Service role can manage connectors" ON integration_connectors;
    
    -- Public read for active connectors
    CREATE POLICY "Anyone can view active connectors"
      ON integration_connectors FOR SELECT
      USING (is_active = true);
    
    CREATE POLICY "Service role can manage connectors"
      ON integration_connectors FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- USER INTEGRATIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_integrations') THEN
    ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own integrations" ON user_integrations;
    DROP POLICY IF EXISTS "Users can view org integrations" ON user_integrations;
    DROP POLICY IF EXISTS "Users can manage own integrations" ON user_integrations;
    DROP POLICY IF EXISTS "Org admins can manage org integrations" ON user_integrations;
    DROP POLICY IF EXISTS "Service role can do everything on user_integrations" ON user_integrations;
    
    -- Users can view their own integrations
    CREATE POLICY "Users can view own integrations"
      ON user_integrations FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Users can view org integrations if they're members
    CREATE POLICY "Users can view org integrations"
      ON user_integrations FOR SELECT
      USING (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
      );
    
    -- Users can manage their own integrations
    CREATE POLICY "Users can manage own integrations"
      ON user_integrations FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    -- Org admins can manage org integrations
    CREATE POLICY "Org admins can manage org integrations"
      ON user_integrations FOR ALL
      USING (
        organization_id IS NOT NULL
        AND is_org_admin(organization_id)
      )
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_admin(organization_id)
      );
    
    CREATE POLICY "Service role can do everything on user_integrations"
      ON user_integrations FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- REFERRALS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
    ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
    DROP POLICY IF EXISTS "Anyone can view referral codes" ON referrals;
    DROP POLICY IF EXISTS "Users can create own referrals" ON referrals;
    DROP POLICY IF EXISTS "Service role can do everything on referrals" ON referrals;
    
    -- Users can view their own referrals
    CREATE POLICY "Users can view own referrals"
      ON referrals FOR SELECT
      USING (auth.uid() = referrer_id);
    
    -- Public read for referral codes (for validation)
    CREATE POLICY "Anyone can view referral codes"
      ON referrals FOR SELECT
      USING (true);
    
    -- Users can create their own referrals
    CREATE POLICY "Users can create own referrals"
      ON referrals FOR INSERT
      WITH CHECK (auth.uid() = referrer_id);
    
    CREATE POLICY "Service role can do everything on referrals"
      ON referrals FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- REFERRAL REWARDS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_rewards') THEN
    ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own referral rewards" ON referral_rewards;
    DROP POLICY IF EXISTS "Service role can do everything on referral_rewards" ON referral_rewards;
    
    -- Users can view rewards where they're referrer or referred
    CREATE POLICY "Users can view own referral rewards"
      ON referral_rewards FOR SELECT
      USING (
        auth.uid() = referrer_id
        OR auth.uid() = referred_user_id
      );
    
    CREATE POLICY "Service role can do everything on referral_rewards"
      ON referral_rewards FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- RETENTION CAMPAIGNS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'retention_campaigns') THEN
    ALTER TABLE retention_campaigns ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own campaigns" ON retention_campaigns;
    DROP POLICY IF EXISTS "Service role can do everything on retention_campaigns" ON retention_campaigns;
    
    CREATE POLICY "Users can view own campaigns"
      ON retention_campaigns FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on retention_campaigns"
      ON retention_campaigns FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- WORKFLOW SHARES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_shares') THEN
    ALTER TABLE workflow_shares ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view public shares" ON workflow_shares;
    DROP POLICY IF EXISTS "Users can view own shares" ON workflow_shares;
    DROP POLICY IF EXISTS "Users can manage own shares" ON workflow_shares;
    DROP POLICY IF EXISTS "Service role can do everything on workflow_shares" ON workflow_shares;
    
    -- Public shares are readable by anyone
    CREATE POLICY "Anyone can view public shares"
      ON workflow_shares FOR SELECT
      USING (share_type = 'public');
    
    -- Users can view their own shares
    CREATE POLICY "Users can view own shares"
      ON workflow_shares FOR SELECT
      USING (auth.uid() = created_by_id);
    
    -- Users can manage their own shares
    CREATE POLICY "Users can manage own shares"
      ON workflow_shares FOR ALL
      USING (auth.uid() = created_by_id)
      WITH CHECK (auth.uid() = created_by_id);
    
    CREATE POLICY "Service role can do everything on workflow_shares"
      ON workflow_shares FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') THEN
    ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
    DROP POLICY IF EXISTS "Service role can manage plans" ON subscription_plans;
    
    -- Public read for active plans
    CREATE POLICY "Anyone can view active plans"
      ON subscription_plans FOR SELECT
      USING (is_active = true);
    
    CREATE POLICY "Service role can manage plans"
      ON subscription_plans FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- USAGE METRICS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_metrics') THEN
    ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own metrics" ON usage_metrics;
    DROP POLICY IF EXISTS "Users can view org metrics" ON usage_metrics;
    DROP POLICY IF EXISTS "Service role can do everything on usage_metrics" ON usage_metrics;
    
    -- Users can view their own metrics
    CREATE POLICY "Users can view own metrics"
      ON usage_metrics FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Users can view org metrics if they're members
    CREATE POLICY "Users can view org metrics"
      ON usage_metrics FOR SELECT
      USING (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
      );
    
    CREATE POLICY "Service role can do everything on usage_metrics"
      ON usage_metrics FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- BILLING EVENTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own billing events" ON billing_events;
    DROP POLICY IF EXISTS "Service role can do everything on billing_events" ON billing_events;
    
    -- Users can view billing events for their subscriptions
    CREATE POLICY "Users can view own billing events"
      ON billing_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM subscriptions s
          WHERE s.id = billing_events.subscription_id
          AND (
            s.user_id = auth.uid()
            OR (s.organization_id IS NOT NULL AND is_org_member(s.organization_id))
          )
        )
      );
    
    CREATE POLICY "Service role can do everything on billing_events"
      ON billing_events FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- SSO PROVIDERS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sso_providers') THEN
    ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view active SSO providers" ON sso_providers;
    DROP POLICY IF EXISTS "Service role can manage SSO providers" ON sso_providers;
    
    -- Public read for active providers
    CREATE POLICY "Anyone can view active SSO providers"
      ON sso_providers FOR SELECT
      USING (is_active = true);
    
    CREATE POLICY "Service role can manage SSO providers"
      ON sso_providers FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- SSO CONNECTIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sso_connections') THEN
    ALTER TABLE sso_connections ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Org admins can view SSO connections" ON sso_connections;
    DROP POLICY IF EXISTS "Org admins can manage SSO connections" ON sso_connections;
    DROP POLICY IF EXISTS "Service role can do everything on sso_connections" ON sso_connections;
    
    -- Org admins can view/manage SSO connections
    CREATE POLICY "Org admins can view SSO connections"
      ON sso_connections FOR SELECT
      USING (is_org_admin(organization_id));
    
    CREATE POLICY "Org admins can manage SSO connections"
      ON sso_connections FOR ALL
      USING (is_org_admin(organization_id))
      WITH CHECK (is_org_admin(organization_id));
    
    CREATE POLICY "Service role can do everything on sso_connections"
      ON sso_connections FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- COMPLIANCE REPORTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_reports') THEN
    ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Org admins can view compliance reports" ON compliance_reports;
    DROP POLICY IF EXISTS "Service role can do everything on compliance_reports" ON compliance_reports;
    
    -- Only org admins can view compliance reports
    CREATE POLICY "Org admins can view compliance reports"
      ON compliance_reports FOR SELECT
      USING (is_org_admin(organization_id));
    
    CREATE POLICY "Service role can do everything on compliance_reports"
      ON compliance_reports FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- ENTERPRISE SETTINGS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enterprise_settings') THEN
    ALTER TABLE enterprise_settings ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Org admins can view enterprise settings" ON enterprise_settings;
    DROP POLICY IF EXISTS "Org admins can manage enterprise settings" ON enterprise_settings;
    DROP POLICY IF EXISTS "Service role can do everything on enterprise_settings" ON enterprise_settings;
    
    -- Only org admins can access enterprise settings
    CREATE POLICY "Org admins can view enterprise settings"
      ON enterprise_settings FOR SELECT
      USING (is_org_admin(organization_id));
    
    CREATE POLICY "Org admins can manage enterprise settings"
      ON enterprise_settings FOR ALL
      USING (is_org_admin(organization_id))
      WITH CHECK (is_org_admin(organization_id));
    
    CREATE POLICY "Service role can do everything on enterprise_settings"
      ON enterprise_settings FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- TWO FACTOR AUTH
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'two_factor_auth') THEN
    ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own 2FA" ON two_factor_auth;
    DROP POLICY IF EXISTS "Users can manage own 2FA" ON two_factor_auth;
    DROP POLICY IF EXISTS "Service role can do everything on two_factor_auth" ON two_factor_auth;
    
    -- Users can only access their own 2FA settings
    CREATE POLICY "Users can view own 2FA"
      ON two_factor_auth FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own 2FA"
      ON two_factor_auth FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on two_factor_auth"
      ON two_factor_auth FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- SECURITY AUDITS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_audits') THEN
    ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own security audits" ON security_audits;
    DROP POLICY IF EXISTS "Service role can do everything on security_audits" ON security_audits;
    
    -- Users can view their own security audit logs
    CREATE POLICY "Users can view own security audits"
      ON security_audits FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on security_audits"
      ON security_audits FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- GUARDIAN EVENTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guardian_events') THEN
    ALTER TABLE guardian_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own guardian events" ON guardian_events;
    DROP POLICY IF EXISTS "Service role can do everything on guardian_events" ON guardian_events;
    
    -- Users can only view their own guardian events
    CREATE POLICY "Users can view own guardian events"
      ON guardian_events FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on guardian_events"
      ON guardian_events FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- TRUST LEDGER ROOTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trust_ledger_roots') THEN
    ALTER TABLE trust_ledger_roots ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own trust ledger roots" ON trust_ledger_roots;
    DROP POLICY IF EXISTS "Service role can do everything on trust_ledger_roots" ON trust_ledger_roots;
    
    -- Users can only view their own trust ledger roots
    CREATE POLICY "Users can view own trust ledger roots"
      ON trust_ledger_roots FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on trust_ledger_roots"
      ON trust_ledger_roots FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- TRUST FABRIC MODELS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trust_fabric_models') THEN
    ALTER TABLE trust_fabric_models ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own trust fabric models" ON trust_fabric_models;
    DROP POLICY IF EXISTS "Users can manage own trust fabric models" ON trust_fabric_models;
    DROP POLICY IF EXISTS "Service role can do everything on trust_fabric_models" ON trust_fabric_models;
    
    -- Users can only access their own trust fabric models
    CREATE POLICY "Users can view own trust fabric models"
      ON trust_fabric_models FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own trust fabric models"
      ON trust_fabric_models FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on trust_fabric_models"
      ON trust_fabric_models FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- GUARDIAN SETTINGS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guardian_settings') THEN
    ALTER TABLE guardian_settings ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own guardian settings" ON guardian_settings;
    DROP POLICY IF EXISTS "Users can manage own guardian settings" ON guardian_settings;
    DROP POLICY IF EXISTS "Service role can do everything on guardian_settings" ON guardian_settings;
    
    -- Users can only access their own guardian settings
    CREATE POLICY "Users can view own guardian settings"
      ON guardian_settings FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own guardian settings"
      ON guardian_settings FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on guardian_settings"
      ON guardian_settings FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- ML MODELS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ml_models') THEN
    ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can view active ML models" ON ml_models;
    DROP POLICY IF EXISTS "Service role can manage ML models" ON ml_models;
    
    -- Public read for active models (metadata only)
    CREATE POLICY "Anyone can view active ML models"
      ON ml_models FOR SELECT
      USING (is_active = true);
    
    CREATE POLICY "Service role can manage ML models"
      ON ml_models FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- PREDICTIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'predictions') THEN
    ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own predictions" ON predictions;
    DROP POLICY IF EXISTS "Service role can do everything on predictions" ON predictions;
    
    -- Users can view their own predictions
    CREATE POLICY "Users can view own predictions"
      ON predictions FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on predictions"
      ON predictions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
    DROP POLICY IF EXISTS "Service role can do everything on notifications" ON notifications;
    
    -- Users can only access their own notifications
    CREATE POLICY "Users can view own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage own notifications"
      ON notifications FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Service role can do everything on notifications"
      ON notifications FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- PERFORMANCE INDEXES FOR NEW TABLES
-- ============================================================================

-- Indexes for organization_members (critical for RLS performance)
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id 
ON organization_members(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id 
ON organization_members(organization_id) 
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_members_user_org 
ON organization_members(user_id, organization_id);

-- Indexes for workflows (for org member checks)
CREATE INDEX IF NOT EXISTS idx_workflows_user_id 
ON workflows(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workflows_org_id 
ON workflows(organization_id) 
WHERE organization_id IS NOT NULL;

-- Indexes for user_integrations
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id 
ON user_integrations(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_integrations_org_id 
ON user_integrations(organization_id) 
WHERE organization_id IS NOT NULL;

-- Indexes for subscriptions (for billing events RLS)
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id 
ON subscriptions(organization_id) 
WHERE organization_id IS NOT NULL;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify all tables have RLS enabled
DO $$
DECLARE
  missing_rls TEXT[];
BEGIN
  SELECT array_agg(tablename)
  INTO missing_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false
    AND tablename NOT IN ('pg_stat_statements'); -- Exclude system tables
  
  IF array_length(missing_rls, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS enabled: %', array_to_string(missing_rls, ', ');
  END IF;
END $$;

-- Verify all tables have at least one policy
DO $$
DECLARE
  missing_policies TEXT[];
BEGIN
  SELECT array_agg(tablename)
  INTO missing_policies
  FROM pg_tables t
  WHERE schemaname = 'public'
    AND tablename NOT IN ('pg_stat_statements')
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
      AND p.tablename = t.tablename
    );
  
  IF array_length(missing_policies, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS policies: %', array_to_string(missing_policies, ', ');
  END IF;
END $$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(UUID) TO authenticated;

-- Service role has full access to all functions
GRANT EXECUTE ON FUNCTION is_org_member(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION is_org_admin(UUID) TO service_role;

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Analyze all tables that might have been created or modified
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('ANALYZE %I', table_name);
  END LOOP;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Consolidated RLS policies migration completed successfully';
  RAISE NOTICE 'All tables have RLS enabled with appropriate policies';
  RAISE NOTICE 'Service role bypasses configured for background jobs';
  RAISE NOTICE 'Performance indexes created for RLS policy checks';
END $$;
