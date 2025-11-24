-- [CRUX+HARDEN] Online-safe migration for performance indexes
-- This migration creates concurrent indexes for better query performance
-- Uses IF NOT EXISTS and CONCURRENTLY for zero-downtime deployment
-- NOTE: If your migration runner wraps in a transaction, split these into separate files
-- or run via CLI: supabase db execute --file=2025-11-05_crux_hardening.sql

-- Index for events table: user_id + timestamp (common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_user_ts 
ON public.events("userId", timestamp DESC);

-- Index for signals table (if exists): user_id + computed_at
-- This will be skipped if signals table doesn't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signals' AND table_schema = 'public') THEN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signals_user_time 
    ON public.signals("userId", computed_at DESC);
  END IF;
END $$;

-- Analyze tables after index creation for query planner optimization
ANALYZE public.events;
-- Analyze signals if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signals' AND table_schema = 'public') THEN
    ANALYZE public.signals;
  END IF;
END $$;
