-- Migration: Add indexes for activation analytics queries
-- Created: 2025-01-15
-- Purpose: Optimize activation funnel and analytics queries

-- Index for activation event queries (already exists via action index, but adding composite)
CREATE INDEX IF NOT EXISTS idx_audit_logs_activation_events 
ON audit_logs(user_id, action, created_at) 
WHERE action LIKE 'activation_event:%';

-- Index for time-based activation queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_activation_time 
ON audit_logs(created_at, action) 
WHERE action LIKE 'activation_event:%';

-- Add comment
COMMENT ON INDEX idx_audit_logs_activation_events IS 'Optimizes activation funnel queries by user and event type';
COMMENT ON INDEX idx_audit_logs_activation_time IS 'Optimizes time-based activation analytics queries';
