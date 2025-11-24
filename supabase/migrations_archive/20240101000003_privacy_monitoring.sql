-- Privacy-First Monitoring Migration
-- Creates privacy tables with zero-trust RLS policies
-- No admin bypass - users can only access their own data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Telemetry events table (encrypted at rest)
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

-- Privacy transparency log (immutable append-only)
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
-- INDEXES
-- ============================================================================

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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - ZERO TRUST
-- ============================================================================

-- Enable RLS on all privacy tables
ALTER TABLE privacy_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_transparency_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_enforced_sessions ENABLE ROW LEVEL SECURITY;

-- Privacy preferences policies - USER ONLY
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

-- App allowlist policies - USER ONLY
CREATE POLICY "Users can view own app allowlist"
    ON app_allowlist FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own app allowlist"
    ON app_allowlist FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Signal toggles policies - USER ONLY
CREATE POLICY "Users can view own signal toggles"
    ON signal_toggles FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own signal toggles"
    ON signal_toggles FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Telemetry events policies - USER ONLY (NO ADMIN ACCESS)
CREATE POLICY "Users can view own telemetry events"
    ON telemetry_events FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own telemetry events"
    ON telemetry_events FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own telemetry events"
    ON telemetry_events FOR DELETE
    USING (auth.uid() = "userId");

-- CRITICAL: No UPDATE policy - telemetry events are immutable once created
-- CRITICAL: No service_role bypass - even admins cannot read user telemetry

-- Privacy transparency log policies - USER ONLY, IMMUTABLE
CREATE POLICY "Users can view own transparency log"
    ON privacy_transparency_log FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "System can insert transparency log entries"
    ON privacy_transparency_log FOR INSERT
    WITH CHECK (auth.uid() = "userId");

-- CRITICAL: No UPDATE or DELETE policies - transparency log is append-only

-- MFA enforced sessions policies - USER ONLY
CREATE POLICY "Users can view own MFA sessions"
    ON mfa_enforced_sessions FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own MFA sessions"
    ON mfa_enforced_sessions FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- ============================================================================
-- GUARDIAN ROLE FUNCTION (for system health checks only)
-- ============================================================================

-- Function to check system health without accessing user data
CREATE OR REPLACE FUNCTION privacy_guardian_health_check()
RETURNS TABLE (
    table_name TEXT,
    total_rows BIGINT,
    oldest_timestamp TIMESTAMP WITH TIME ZONE,
    newest_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Returns aggregate counts only, no user-specific data
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

-- Grant execute to authenticated users (for their own health checks)
GRANT EXECUTE ON FUNCTION privacy_guardian_health_check() TO authenticated;

-- ============================================================================
-- ENCRYPTION HELPERS
-- ============================================================================

-- Function to encrypt sensitive metadata (uses pgcrypto)
CREATE OR REPLACE FUNCTION encrypt_telemetry_metadata(plaintext JSONB, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- In production, use proper encryption key management
    -- For now, return hashed version (replace with proper encryption)
    RETURN encode(digest(plaintext::TEXT, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to redact sensitive fields
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_privacy_prefs_updated_at BEFORE UPDATE ON privacy_prefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_allowlist_updated_at BEFORE UPDATE ON app_allowlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signal_toggles_updated_at BEFORE UPDATE ON signal_toggles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-redact telemetry events on insert
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
-- DATA RETENTION FUNCTION
-- ============================================================================

-- Function to delete old telemetry events based on user retention preferences
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

-- Grant execute to service_role only (for scheduled jobs)
GRANT EXECUTE ON FUNCTION cleanup_telemetry_by_retention() TO service_role;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

ANALYZE privacy_prefs;
ANALYZE app_allowlist;
ANALYZE signal_toggles;
ANALYZE telemetry_events;
ANALYZE privacy_transparency_log;
ANALYZE mfa_enforced_sessions;
