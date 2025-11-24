-- NPS Submissions Table
-- Stores Net Promoter Score survey responses

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nps_submissions_user_id ON nps_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_submissions_submitted_at ON nps_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_nps_submissions_category ON nps_submissions(category);

-- RLS Policies
ALTER TABLE nps_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own NPS submissions"
  ON nps_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can insert own NPS submissions"
  ON nps_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all NPS submissions"
  ON nps_submissions
  FOR SELECT
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

-- Grant permissions
GRANT SELECT, INSERT ON nps_submissions TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_nps_score TO authenticated;
