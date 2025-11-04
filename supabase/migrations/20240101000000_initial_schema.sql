-- Supabase Migration: Create all tables for floyo project
-- This migration creates all tables, indexes, and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS on all tables by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================================================
-- TABLES
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

-- Events table
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

-- Audit Logs table
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
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt");

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions("expiresAt");

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id_timestamp ON events("userId", timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_file_path ON events("filePath");
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events("eventType");
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);

-- Patterns indexes
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns("userId");
CREATE INDEX IF NOT EXISTS idx_patterns_file_extension ON patterns("fileExtension");
CREATE INDEX IF NOT EXISTS idx_patterns_last_used ON patterns("lastUsed" DESC);

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships("userId");
CREATE INDEX IF NOT EXISTS idx_relationships_source_file ON relationships("sourceFile");
CREATE INDEX IF NOT EXISTS idx_relationships_target_file ON relationships("targetFile");

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions("stripeId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

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

-- Retention Policies indexes
CREATE INDEX IF NOT EXISTS idx_retention_policies_table_name ON retention_policies("tableName");
CREATE INDEX IF NOT EXISTS idx_retention_policies_enabled ON retention_policies(enabled);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE sql STABLE;

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

-- Sessions RLS Policies
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own sessions"
    ON sessions FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

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

-- Patterns RLS Policies
CREATE POLICY "Users can view own patterns"
    ON patterns FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own patterns"
    ON patterns FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Relationships RLS Policies
CREATE POLICY "Users can view own relationships"
    ON relationships FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own relationships"
    ON relationships FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Subscriptions RLS Policies
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own subscription"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = "userId");

-- UTM Tracks RLS Policies
CREATE POLICY "Users can view own utm tracks"
    ON utm_tracks FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own utm tracks"
    ON utm_tracks FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Cohorts RLS Policies
CREATE POLICY "Users can view own cohorts"
    ON cohorts FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own cohorts"
    ON cohorts FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Feature Flags RLS Policies (Public read, admin write)
CREATE POLICY "Anyone can view feature flags"
    ON feature_flags FOR SELECT
    USING (true);

-- Offers RLS Policies (Public read, admin write)
CREATE POLICY "Anyone can view enabled offers"
    ON offers FOR SELECT
    USING (enabled = true);

-- Audit Logs RLS Policies (Users can only view own logs)
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = "userId");

-- Retention Policies RLS Policies (Admin only - no public access)
CREATE POLICY "No public access to retention policies"
    ON retention_policies FOR ALL
    USING (false);

-- ============================================================================
-- FUNCTIONS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Analyze tables for query planner
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

-- ============================================================================
-- INITIAL DATA
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
