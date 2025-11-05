-- [CRUX+HARDEN] Create workflow_runs table for queue shim
-- This table tracks workflow execution status and enables retries

CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  retries INTEGER DEFAULT 0 NOT NULL CHECK (retries >= 0),
  error TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_runs_user_status 
ON workflow_runs(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_runs_status_created 
ON workflow_runs(status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_runs_failed_updated 
ON workflow_runs(status, updated_at) 
WHERE status = 'failed';

-- RLS policies
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflow runs"
  ON workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workflow runs"
  ON workflow_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow runs"
  ON workflow_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_workflow_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_runs_updated_at
  BEFORE UPDATE ON workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_runs_updated_at();
