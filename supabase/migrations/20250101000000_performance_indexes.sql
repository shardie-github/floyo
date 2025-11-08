-- Performance Optimization Migration
-- Creates additional indexes for query performance
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Events table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_user_id_event_type 
ON events("userId", "eventType") 
WHERE "userId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp_desc 
ON events(timestamp DESC) 
WHERE timestamp IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_file_path_pattern 
ON events("filePath" text_pattern_ops) 
WHERE "filePath" IS NOT NULL;

-- Patterns table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patterns_user_extension 
ON patterns("userId", "fileExtension") 
WHERE "userId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patterns_last_used_desc 
ON patterns("lastUsed" DESC) 
WHERE "lastUsed" IS NOT NULL;

-- Relationships table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_user_weight 
ON relationships("userId", weight DESC) 
WHERE "userId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_source_target 
ON relationships("sourceFile", "targetFile") 
WHERE "sourceFile" IS NOT NULL AND "targetFile" IS NOT NULL;

-- User sessions performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_expires 
ON sessions("userId", "expiresAt") 
WHERE "userId" IS NOT NULL AND "expiresAt" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at 
ON sessions("expiresAt") 
WHERE "expiresAt" < NOW();

-- Subscriptions performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions("userId", status) 
WHERE "userId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_plan_status 
ON subscriptions(plan, status) 
WHERE plan IS NOT NULL AND status IS NOT NULL;

-- Audit logs performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
ON audit_logs("userId", timestamp DESC) 
WHERE "userId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC) 
WHERE action IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource 
ON audit_logs(resource, "resourceId") 
WHERE resource IS NOT NULL;

-- Telemetry events performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_user_type 
ON telemetry_events(user_id, type) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_ts_desc 
ON telemetry_events(ts DESC) 
WHERE ts IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_app_type 
ON telemetry_events(app, type) 
WHERE app IS NOT NULL AND type IS NOT NULL;

-- Workflow runs performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_runs_user_status_created 
ON workflow_runs(user_id, status, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_runs_status_updated 
ON workflow_runs(status, updated_at DESC) 
WHERE status = 'failed';

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Active sessions only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active 
ON sessions("userId", "expiresAt") 
WHERE "expiresAt" > NOW();

-- Active subscriptions only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active 
ON subscriptions("userId", "currentPeriodEnd") 
WHERE status = 'active' AND "currentPeriodEnd" > NOW();

-- Recent events (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_recent 
ON events("userId", timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '30 days';

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE events;
ANALYZE patterns;
ANALYZE relationships;
ANALYZE sessions;
ANALYZE subscriptions;
ANALYZE audit_logs;
ANALYZE telemetry_events;
ANALYZE workflow_runs;

-- ============================================================================
-- VACUUM AND REINDEX (for maintenance)
-- ============================================================================

-- Note: VACUUM and REINDEX should be run during maintenance windows
-- These are commented out as they can lock tables
-- Uncomment and run during low-traffic periods

-- VACUUM ANALYZE events;
-- VACUUM ANALYZE patterns;
-- VACUUM ANALYZE relationships;
-- VACUUM ANALYZE sessions;
-- VACUUM ANALYZE subscriptions;
-- VACUUM ANALYZE audit_logs;
-- VACUUM ANALYZE telemetry_events;
-- VACUUM ANALYZE workflow_runs;
