-- ============================================================================
-- MASTER CONSOLIDATED SCHEMA MIGRATION
-- ============================================================================
-- This is the single canonical migration file that bootstraps a fresh database
-- to the final intended state. All historical migrations have been consolidated
-- into this file.
--
-- Created: 2025-01-15
-- Purpose: Single source of truth for database schema
-- Safe to run: Yes (uses IF NOT EXISTS, idempotent operations)
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Get current role from JWT
CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claim.role', true)::TEXT;
$$ LANGUAGE sql STABLE;

-- Update updatedAt timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if user is admin
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

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is admin of organization
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
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN DEFAULT FALSE NOT NULL,
    "passwordHash" TEXT,
    name TEXT,
    image TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Events table (consolidated schema)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "filePath" TEXT NOT NULL,
    "eventType" TEXT NOT NULL CHECK ("eventType" IN ('created', 'modified', 'accessed', 'deleted')),
    tool TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Patterns table
CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "fileExtension" TEXT NOT NULL,
    count INTEGER DEFAULT 0 NOT NULL CHECK (count >= 0),
    "lastUsed" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    tools TEXT[] DEFAULT '{}'::text[],
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("userId", "fileExtension")
);

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sourceFile" TEXT NOT NULL,
    "targetFile" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    weight DOUBLE PRECISION DEFAULT 1.0 NOT NULL CHECK (weight >= 0),
    "lastSeen" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("userId", "sourceFile", "targetFile")
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "organizationId" UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
    "stripeId" TEXT UNIQUE,
    "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
    "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
    "cancelAtPeriodEnd" BOOLEAN DEFAULT FALSE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- UTM Tracks table
CREATE TABLE IF NOT EXISTS utm_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT,
    medium TEXT,
    campaign TEXT,
    term TEXT,
    content TEXT,
    "firstTouch" BOOLEAN DEFAULT TRUE NOT NULL,
    "lastTouch" BOOLEAN DEFAULT FALSE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "cohortMonth" TEXT NOT NULL CHECK ("cohortMonth" ~* '^\d{4}-\d{2}$'),
    "acquiredAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("userId", "cohortMonth")
);

-- Feature Flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "planType" TEXT NOT NULL CHECK ("planType" IN ('free', 'pro', 'enterprise')),
    discount DOUBLE PRECISION CHECK (discount >= 0 AND discount <= 100),
    "validFrom" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "validTo" TIMESTAMP WITH TIME ZONE,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Audit Logs table (consolidated schema)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT,
    "resourceId" TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    "ipAddress" INET,
    "userAgent" TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Retention Policies table
CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tableName" TEXT UNIQUE NOT NULL,
    "retentionDays" INTEGER NOT NULL CHECK ("retentionDays" > 0),
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    "lastRun" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- PRIVACY TABLES
-- ============================================================================

-- Privacy preferences table
CREATE TABLE IF NOT EXISTS privacy_prefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    "consentGiven" BOOLEAN DEFAULT FALSE NOT NULL,
    "dataRetentionDays" INTEGER DEFAULT 14 NOT NULL CHECK ("dataRetentionDays" > 0),
    "mfaRequired" BOOLEAN DEFAULT TRUE NOT NULL,
    "lastReviewedAt" TIMESTAMP WITH TIME ZONE,
    "monitoringEnabled" BOOLEAN DEFAULT FALSE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- App allowlist table
CREATE TABLE IF NOT EXISTS app_allowlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES privacy_prefs("userId") ON DELETE CASCADE,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE NOT NULL,
    scope TEXT DEFAULT 'metadata_only' NOT NULL CHECK (scope IN ('metadata_only', 'metadata_plus_usage', 'none')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("userId", "appId")
);

-- Signal toggles table
CREATE TABLE IF NOT EXISTS signal_toggles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES privacy_prefs("userId") ON DELETE CASCADE,
    "signalKey" TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE NOT NULL,
    "samplingRate" DOUBLE PRECISION DEFAULT 1.0 NOT NULL CHECK ("samplingRate" >= 0 AND "samplingRate" <= 1),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("userId", "signalKey")
);

-- Telemetry events table
CREATE TABLE IF NOT EXISTS telemetry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES privacy_prefs("userId") ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "appId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "durationMs" INTEGER,
    "metadataRedactedJson" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Privacy transparency log table
CREATE TABLE IF NOT EXISTS privacy_transparency_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES privacy_prefs("userId") ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource TEXT,
    "resourceId" TEXT,
    "oldValueHash" TEXT,
    "newValueHash" TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- MFA enforced sessions table
CREATE TABLE IF NOT EXISTS mfa_enforced_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ORGANIZATION TABLES
-- ============================================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "organizationId" UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("organizationId", "userId")
);

-- ============================================================================
-- WORKFLOW TABLES
-- ============================================================================

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "organizationId" UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Workflow versions table
CREATE TABLE IF NOT EXISTS workflow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workflowId" UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("workflowId", version)
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workflowId" UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input JSONB,
    output JSONB,
    error TEXT,
    "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "completedAt" TIMESTAMP WITH TIME ZONE
);

-- Workflow runs table (queue shim)
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "workflowId" TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    retries INTEGER DEFAULT 0 NOT NULL CHECK (retries >= 0),
    error TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    result JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

-- User integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "organizationId" UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
    "lastSyncAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Metrics log table
CREATE TABLE IF NOT EXISTS metrics_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    source TEXT NOT NULL,
    metric JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt");

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions("expiresAt");
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions("userId", "expiresAt") WHERE "userId" IS NOT NULL AND "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions("userId", "expiresAt") WHERE "expiresAt" > NOW();

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id_timestamp ON events("userId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_file_path ON events("filePath");
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events("eventType");
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON events("userId", timestamp DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_user_id_event_type ON events("userId", "eventType") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_timestamp_desc ON events(timestamp DESC) WHERE timestamp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_file_path_pattern ON events("filePath" text_pattern_ops) WHERE "filePath" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_recent ON events("userId", timestamp DESC) WHERE timestamp > NOW() - INTERVAL '30 days';

-- Patterns indexes
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns("userId");
CREATE INDEX IF NOT EXISTS idx_patterns_file_extension ON patterns("fileExtension");
CREATE INDEX IF NOT EXISTS idx_patterns_last_used ON patterns("lastUsed" DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_user_updated ON patterns("userId", "updatedAt" DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patterns_user_extension ON patterns("userId", "fileExtension") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patterns_last_used_desc ON patterns("lastUsed" DESC) WHERE "lastUsed" IS NOT NULL;

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships("userId");
CREATE INDEX IF NOT EXISTS idx_relationships_source_file ON relationships("sourceFile");
CREATE INDEX IF NOT EXISTS idx_relationships_target_file ON relationships("targetFile");
CREATE INDEX IF NOT EXISTS idx_relationships_user_lastseen ON relationships("userId", "lastSeen" DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_relationships_user_weight ON relationships("userId", weight DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_relationships_source_target ON relationships("sourceFile", "targetFile") WHERE "sourceFile" IS NOT NULL AND "targetFile" IS NOT NULL;

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions("stripeId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions("userId", status) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON subscriptions(plan, status) WHERE plan IS NOT NULL AND status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions("userId", "currentPeriodEnd") WHERE status = 'active' AND "currentPeriodEnd" > NOW();
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions("organizationId") WHERE "organizationId" IS NOT NULL;

-- UTM Tracks indexes
CREATE INDEX IF NOT EXISTS idx_utm_tracks_user_id_timestamp ON utm_tracks("userId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_utm_tracks_campaign ON utm_tracks(campaign);
CREATE INDEX IF NOT EXISTS idx_utm_tracks_timestamp ON utm_tracks(timestamp DESC);

-- Cohorts indexes
CREATE INDEX IF NOT EXISTS idx_cohorts_user_id ON cohorts("userId");
CREATE INDEX IF NOT EXISTS idx_cohorts_cohort_month ON cohorts("cohortMonth");
CREATE INDEX IF NOT EXISTS idx_cohorts_acquired_at ON cohorts("acquiredAt" DESC);

-- Feature Flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Offers indexes
CREATE INDEX IF NOT EXISTS idx_offers_key ON offers(key);
CREATE INDEX IF NOT EXISTS idx_offers_enabled ON offers(enabled);
CREATE INDEX IF NOT EXISTS idx_offers_plan_type ON offers("planType");
CREATE INDEX IF NOT EXISTS idx_offers_valid_from_to ON offers("validFrom", "validTo");

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_timestamp ON audit_logs("userId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, "resourceId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs("userId", timestamp DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC) WHERE action IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_activation_events ON audit_logs("userId", action, timestamp) WHERE action LIKE 'activation_event:%';
CREATE INDEX IF NOT EXISTS idx_audit_logs_activation_time ON audit_logs(timestamp, action) WHERE action LIKE 'activation_event:%';

-- Retention Policies indexes
CREATE INDEX IF NOT EXISTS idx_retention_policies_table_name ON retention_policies("tableName");
CREATE INDEX IF NOT EXISTS idx_retention_policies_enabled ON retention_policies(enabled);

-- Privacy indexes
CREATE INDEX IF NOT EXISTS idx_privacy_prefs_user_id ON privacy_prefs("userId");
CREATE INDEX IF NOT EXISTS idx_app_allowlist_user_id ON app_allowlist("userId");
CREATE INDEX IF NOT EXISTS idx_app_allowlist_app_id ON app_allowlist("appId");
CREATE INDEX IF NOT EXISTS idx_signal_toggles_user_id ON signal_toggles("userId");
CREATE INDEX IF NOT EXISTS idx_signal_toggles_signal_key ON signal_toggles("signalKey");
CREATE INDEX IF NOT EXISTS idx_telemetry_events_user_timestamp ON telemetry_events("userId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_app_id ON telemetry_events("appId");
CREATE INDEX IF NOT EXISTS idx_telemetry_events_timestamp ON telemetry_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_transparency_log_user_timestamp ON privacy_transparency_log("userId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_transparency_log_action ON privacy_transparency_log(action);
CREATE INDEX IF NOT EXISTS idx_privacy_transparency_log_timestamp ON privacy_transparency_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_enforced_sessions_user_id ON mfa_enforced_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_mfa_enforced_sessions_token ON mfa_enforced_sessions("sessionToken");
CREATE INDEX IF NOT EXISTS idx_mfa_enforced_sessions_expires ON mfa_enforced_sessions("expiresAt");

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members("organizationId") WHERE "organizationId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org ON organization_members("userId", "organizationId");

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_org_id ON workflows("organizationId") WHERE "organizationId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows("isActive");
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON workflow_versions("workflowId");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions("workflowId");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions("startedAt");
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_status ON workflow_runs("userId", status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status_created ON workflow_runs(status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_workflow_runs_failed_updated ON workflow_runs(status, "updatedAt") WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_status_created ON workflow_runs("userId", status, "createdAt" DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status_updated ON workflow_runs(status, "updatedAt" DESC) WHERE status = 'failed';

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_integrations_org_id ON user_integrations("organizationId") WHERE "organizationId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_user_integrations_is_active ON user_integrations("isActive");

-- Metrics log indexes
CREATE INDEX IF NOT EXISTS idx_metrics_log_ts ON metrics_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_log_source ON metrics_log(source);
CREATE INDEX IF NOT EXISTS idx_metrics_log_metric_gin ON metrics_log USING gin(metric);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_transparency_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_enforced_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Users RLS Policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can do everything on users"
    ON users FOR ALL
    USING (auth.role() = 'service_role');

-- Sessions RLS Policies
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own sessions"
    ON sessions FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on sessions"
    ON sessions FOR ALL
    USING (auth.role() = 'service_role');

-- Events RLS Policies
CREATE POLICY "Users can view own events"
    ON events FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can create own events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own events"
    ON events FOR UPDATE
    USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own events"
    ON events FOR DELETE
    USING (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on events"
    ON events FOR ALL
    USING (auth.role() = 'service_role');

-- Patterns RLS Policies
CREATE POLICY "Users can view own patterns"
    ON patterns FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own patterns"
    ON patterns FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on patterns"
    ON patterns FOR ALL
    USING (auth.role() = 'service_role');

-- Relationships RLS Policies
CREATE POLICY "Users can view own relationships"
    ON relationships FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own relationships"
    ON relationships FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on relationships"
    ON relationships FOR ALL
    USING (auth.role() = 'service_role');

-- Subscriptions RLS Policies
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = "userId" OR is_org_member("organizationId"));

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = "userId" OR is_org_admin("organizationId"));

CREATE POLICY "Users can insert own subscription"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- UTM Tracks RLS Policies
CREATE POLICY "Users can view own utm tracks"
    ON utm_tracks FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own utm tracks"
    ON utm_tracks FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on utm_tracks"
    ON utm_tracks FOR ALL
    USING (auth.role() = 'service_role');

-- Cohorts RLS Policies
CREATE POLICY "Users can view own cohorts"
    ON cohorts FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own cohorts"
    ON cohorts FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on cohorts"
    ON cohorts FOR ALL
    USING (auth.role() = 'service_role');

-- Feature Flags RLS Policies (Public read)
CREATE POLICY "Anyone can view feature flags"
    ON feature_flags FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage feature flags"
    ON feature_flags FOR ALL
    USING (auth.role() = 'service_role');

-- Offers RLS Policies (Public read enabled offers)
CREATE POLICY "Anyone can view enabled offers"
    ON offers FOR SELECT
    USING (enabled = true);

CREATE POLICY "Service role can manage offers"
    ON offers FOR ALL
    USING (auth.role() = 'service_role');

-- Audit Logs RLS Policies
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on audit_logs"
    ON audit_logs FOR ALL
    USING (auth.role() = 'service_role');

-- Retention Policies RLS Policies (Admin only)
CREATE POLICY "No public access to retention policies"
    ON retention_policies FOR ALL
    USING (false);

CREATE POLICY "Service role can manage retention policies"
    ON retention_policies FOR ALL
    USING (auth.role() = 'service_role');

-- Privacy Preferences RLS Policies
CREATE POLICY "Users can view own privacy prefs"
    ON privacy_prefs FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can update own privacy prefs"
    ON privacy_prefs FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can insert own privacy prefs"
    ON privacy_prefs FOR INSERT
    WITH CHECK (auth.uid() = "userId");

-- App Allowlist RLS Policies
CREATE POLICY "Users can view own app allowlist"
    ON app_allowlist FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own app allowlist"
    ON app_allowlist FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Signal Toggles RLS Policies
CREATE POLICY "Users can view own signal toggles"
    ON signal_toggles FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own signal toggles"
    ON signal_toggles FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Telemetry Events RLS Policies (Zero Trust - NO service role bypass)
CREATE POLICY "Users can view own telemetry events"
    ON telemetry_events FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own telemetry events"
    ON telemetry_events FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own telemetry events"
    ON telemetry_events FOR DELETE
    USING (auth.uid() = "userId");

-- Privacy Transparency Log RLS Policies (Immutable)
CREATE POLICY "Users can view own transparency log"
    ON privacy_transparency_log FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "System can insert transparency log entries"
    ON privacy_transparency_log FOR INSERT
    WITH CHECK (auth.uid() = "userId");

-- MFA Enforced Sessions RLS Policies
CREATE POLICY "Users can view own MFA sessions"
    ON mfa_enforced_sessions FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own MFA sessions"
    ON mfa_enforced_sessions FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Organizations RLS Policies
CREATE POLICY "Users can view organizations they belong to"
    ON organizations FOR SELECT
    USING (is_org_member(id));

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update organizations"
    ON organizations FOR UPDATE
    USING (is_org_admin(id))
    WITH CHECK (is_org_admin(id));

CREATE POLICY "Service role can do everything on organizations"
    ON organizations FOR ALL
    USING (auth.role() = 'service_role');

-- Organization Members RLS Policies
CREATE POLICY "Users can view members of their organizations"
    ON organization_members FOR SELECT
    USING (is_org_member("organizationId"));

CREATE POLICY "Admins can manage members"
    ON organization_members FOR ALL
    USING (is_org_admin("organizationId"))
    WITH CHECK (is_org_admin("organizationId"));

CREATE POLICY "Users can insert themselves"
    ON organization_members FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on organization_members"
    ON organization_members FOR ALL
    USING (auth.role() = 'service_role');

-- Workflows RLS Policies
CREATE POLICY "Users can view own workflows"
    ON workflows FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can view org workflows"
    ON workflows FOR SELECT
    USING (
        "organizationId" IS NOT NULL
        AND is_org_member("organizationId")
    );

CREATE POLICY "Users can manage own workflows"
    ON workflows FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Org members can manage org workflows"
    ON workflows FOR ALL
    USING (
        "organizationId" IS NOT NULL
        AND is_org_member("organizationId")
    )
    WITH CHECK (
        "organizationId" IS NOT NULL
        AND is_org_member("organizationId")
    );

CREATE POLICY "Service role can do everything on workflows"
    ON workflows FOR ALL
    USING (auth.role() = 'service_role');

-- Workflow Versions RLS Policies
CREATE POLICY "Users can view workflow versions"
    ON workflow_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workflows w
            WHERE w.id = workflow_versions."workflowId"
            AND (
                w."userId" = auth.uid()
                OR (w."organizationId" IS NOT NULL AND is_org_member(w."organizationId"))
            )
        )
    );

CREATE POLICY "Users can create workflow versions"
    ON workflow_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workflows w
            WHERE w.id = workflow_versions."workflowId"
            AND (
                w."userId" = auth.uid()
                OR (w."organizationId" IS NOT NULL AND is_org_admin(w."organizationId"))
            )
        )
    );

CREATE POLICY "Service role can do everything on workflow_versions"
    ON workflow_versions FOR ALL
    USING (auth.role() = 'service_role');

-- Workflow Executions RLS Policies
CREATE POLICY "Users can view workflow executions"
    ON workflow_executions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workflows w
            WHERE w.id = workflow_executions."workflowId"
            AND (
                w."userId" = auth.uid()
                OR (w."organizationId" IS NOT NULL AND is_org_member(w."organizationId"))
            )
        )
    );

CREATE POLICY "Users can create workflow executions"
    ON workflow_executions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workflows w
            WHERE w.id = workflow_executions."workflowId"
            AND (
                w."userId" = auth.uid()
                OR (w."organizationId" IS NOT NULL AND is_org_member(w."organizationId"))
            )
        )
    );

CREATE POLICY "Service role can do everything on workflow_executions"
    ON workflow_executions FOR ALL
    USING (auth.role() = 'service_role');

-- Workflow Runs RLS Policies
CREATE POLICY "Users can view own workflow runs"
    ON workflow_runs FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can create own workflow runs"
    ON workflow_runs FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own workflow runs"
    ON workflow_runs FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Service role can do everything on workflow_runs"
    ON workflow_runs FOR ALL
    USING (auth.role() = 'service_role');

-- User Integrations RLS Policies
CREATE POLICY "Users can view own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can view org integrations"
    ON user_integrations FOR SELECT
    USING (
        "organizationId" IS NOT NULL
        AND is_org_member("organizationId")
    );

CREATE POLICY "Users can manage own integrations"
    ON user_integrations FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Org admins can manage org integrations"
    ON user_integrations FOR ALL
    USING (
        "organizationId" IS NOT NULL
        AND is_org_admin("organizationId")
    )
    WITH CHECK (
        "organizationId" IS NOT NULL
        AND is_org_admin("organizationId")
    );

CREATE POLICY "Service role can do everything on user_integrations"
    ON user_integrations FOR ALL
    USING (auth.role() = 'service_role');

-- Metrics Log RLS Policies
CREATE POLICY "metrics_log_service_insert"
    ON metrics_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "metrics_log_read_own"
    ON metrics_log FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        (metric->>'user_id')::uuid = auth.uid() OR
        metric->>'user_id' IS NULL
    );

CREATE POLICY "metrics_log_admin_read"
    ON metrics_log FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND id IN (
                SELECT "userId" FROM subscriptions
                WHERE plan = 'enterprise'
                AND status = 'active'
            )
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- UpdatedAt triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at BEFORE UPDATE ON retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_prefs_updated_at BEFORE UPDATE ON privacy_prefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_allowlist_updated_at BEFORE UPDATE ON app_allowlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signal_toggles_updated_at BEFORE UPDATE ON signal_toggles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_runs_updated_at BEFORE UPDATE ON workflow_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON user_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Privacy trigger functions
CREATE OR REPLACE FUNCTION redact_telemetry_metadata(raw_metadata JSONB)
RETURNS JSONB AS $$
DECLARE
    redacted JSONB;
BEGIN
    redacted := raw_metadata;
    
    -- Remove sensitive keys
    redacted := redacted - 'password';
    redacted := redacted - 'token';
    redacted := redacted - 'secret';
    redacted := redacted - 'api_key';
    redacted := redacted - 'credit_card';
    redacted := redacted - 'ssn';
    
    -- Hash window titles if they contain sensitive patterns
    IF redacted ? 'window_title' THEN
        IF redacted->>'window_title' ~* '(password|secret|token|key|credit|ssn)' THEN
            redacted := jsonb_set(redacted, '{window_title}', to_jsonb('[REDACTED]'::TEXT));
        END IF;
    END IF;
    
    RETURN redacted;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_redact_telemetry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."metadataRedactedJson" IS NOT NULL THEN
        NEW."metadataRedactedJson" := redact_telemetry_metadata(NEW."metadataRedactedJson");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_redact_telemetry_before_insert
    BEFORE INSERT ON telemetry_events
    FOR EACH ROW EXECUTE FUNCTION auto_redact_telemetry();

-- ============================================================================
-- MONITORING FUNCTIONS
-- ============================================================================

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

CREATE OR REPLACE FUNCTION privacy_guardian_health_check()
RETURNS TABLE (
    table_name TEXT,
    total_rows BIGINT,
    oldest_timestamp TIMESTAMP WITH TIME ZONE,
    newest_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'telemetry_events'::TEXT,
        COUNT(*)::BIGINT,
        MIN(timestamp),
        MAX(timestamp)
    FROM telemetry_events
    UNION ALL
    SELECT
        'privacy_prefs'::TEXT,
        COUNT(*)::BIGINT,
        MIN("createdAt"),
        MAX("createdAt")
    FROM privacy_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION cleanup_telemetry_by_retention()
RETURNS TABLE (
    user_id UUID,
    deleted_count BIGINT
) AS $$
DECLARE
    pref_record RECORD;
    deleted_count BIGINT;
BEGIN
    FOR pref_record IN
        SELECT "userId", "dataRetentionDays"
        FROM privacy_prefs
        WHERE "monitoringEnabled" = TRUE
    LOOP
        DELETE FROM telemetry_events
        WHERE "userId" = pref_record."userId"
        AND timestamp < NOW() - (pref_record."dataRetentionDays" || ' days')::INTERVAL;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        user_id := pref_record."userId";
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NPS SUBMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nps_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    feedback TEXT,
    category TEXT NOT NULL CHECK (category IN ('promoter', 'passive', 'detractor')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT nps_score_check CHECK (score >= 0 AND score <= 10),
    CONSTRAINT nps_category_check CHECK (category IN ('promoter', 'passive', 'detractor'))
);

CREATE INDEX IF NOT EXISTS idx_nps_submissions_user_id ON nps_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_submissions_submitted_at ON nps_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_nps_submissions_category ON nps_submissions(category);

-- RLS Policies for NPS
ALTER TABLE nps_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own NPS submissions"
    ON nps_submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own NPS submissions"
    ON nps_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all NPS submissions"
    ON nps_submissions FOR SELECT
    USING (is_admin());

-- Function to calculate NPS score
CREATE OR REPLACE FUNCTION calculate_nps_score(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    score NUMERIC,
    total_responses BIGINT,
    promoters BIGINT,
    passives BIGINT,
    detractors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(
            (
                (COUNT(*) FILTER (WHERE category = 'promoter')::NUMERIC -
                 COUNT(*) FILTER (WHERE category = 'detractor')::NUMERIC) /
                NULLIF(COUNT(*), 0)
            ) * 100,
            1
        ) AS score,
        COUNT(*) AS total_responses,
        COUNT(*) FILTER (WHERE category = 'promoter') AS promoters,
        COUNT(*) FILTER (WHERE category = 'passive') AS passives,
        COUNT(*) FILTER (WHERE category = 'detractor') AS detractors
    FROM nps_submissions
    WHERE submitted_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT, INSERT ON nps_submissions TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_nps_score TO authenticated;

-- ============================================================================
-- HELPER FUNCTIONS (continued)
-- ============================================================================

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

GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION privacy_guardian_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION cleanup_retention_data() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_telemetry_by_retention() TO service_role;
GRANT EXECUTE ON FUNCTION audit_rls_violation(TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION is_org_member(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION is_org_admin(UUID) TO service_role;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default feature flags
INSERT INTO feature_flags (key, enabled, description) VALUES
    ('billing_enabled', false, 'Enable billing features'),
    ('quiet_mode', false, 'Enable quiet mode for incident response'),
    ('analytics_enabled', true, 'Enable analytics tracking')
ON CONFLICT (key) DO NOTHING;

-- Insert default retention policies
INSERT INTO retention_policies ("tableName", "retentionDays", enabled) VALUES
    ('users', 365, true),
    ('events', 90, true),
    ('utm_tracks', 730, true),
    ('audit_logs', 2555, true)
ON CONFLICT ("tableName") DO NOTHING;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

ANALYZE users;
ANALYZE sessions;
ANALYZE events;
ANALYZE patterns;
ANALYZE relationships;
ANALYZE subscriptions;
ANALYZE utm_tracks;
ANALYZE cohorts;
ANALYZE feature_flags;
ANALYZE offers;
ANALYZE audit_logs;
ANALYZE retention_policies;
ANALYZE privacy_prefs;
ANALYZE app_allowlist;
ANALYZE signal_toggles;
ANALYZE telemetry_events;
ANALYZE privacy_transparency_log;
ANALYZE mfa_enforced_sessions;
ANALYZE organizations;
ANALYZE organization_members;
ANALYZE workflows;
ANALYZE workflow_versions;
ANALYZE workflow_executions;
ANALYZE workflow_runs;
ANALYZE user_integrations;
ANALYZE metrics_log;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Master consolidated schema migration completed successfully';
    RAISE NOTICE 'All tables, indexes, RLS policies, triggers, and functions created';
END $$;
