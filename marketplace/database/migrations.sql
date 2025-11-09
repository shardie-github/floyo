-- Marketplace Database Migrations
-- Run these migrations to set up the marketplace tables

-- Moderation Reviews Table
CREATE TABLE IF NOT EXISTS moderation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  scores JSONB NOT NULL,
  flags JSONB DEFAULT '[]'::jsonb,
  action VARCHAR(20) NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moderation_reviews_status ON moderation_reviews(status);
CREATE INDEX idx_moderation_reviews_content_id ON moderation_reviews(content_id);
CREATE INDEX idx_moderation_reviews_created_at ON moderation_reviews(created_at);

-- Cost Tracking Table
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  resource VARCHAR(100),
  cost DECIMAL(10, 4) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_tracking_service ON cost_tracking(service);
CREATE INDEX idx_cost_tracking_period ON cost_tracking(period_start, period_end);
CREATE INDEX idx_cost_tracking_created_at ON cost_tracking(created_at);

-- Revenue Tracking Table
CREATE TABLE IF NOT EXISTS revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_tracking_source ON revenue_tracking(source);
CREATE INDEX idx_revenue_tracking_period ON revenue_tracking(period_start, period_end);
CREATE INDEX idx_revenue_tracking_created_at ON revenue_tracking(created_at);

-- Operating Expenses Table
CREATE TABLE IF NOT EXISTS operating_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_operating_expenses_category ON operating_expenses(category);
CREATE INDEX idx_operating_expenses_period ON operating_expenses(period_start, period_end);
CREATE INDEX idx_operating_expenses_created_at ON operating_expenses(created_at);

-- Financial Alerts Table
CREATE TABLE IF NOT EXISTS financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_financial_alerts_type ON financial_alerts(type);
CREATE INDEX idx_financial_alerts_severity ON financial_alerts(severity);
CREATE INDEX idx_financial_alerts_acknowledged ON financial_alerts(acknowledged);
CREATE INDEX idx_financial_alerts_created_at ON financial_alerts(created_at);

-- SDK Instances Table
CREATE TABLE IF NOT EXISTS sdk_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_hash VARCHAR(255) NOT NULL,
  version VARCHAR(20) NOT NULL,
  environment VARCHAR(20) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sdk_instances_api_key_hash ON sdk_instances(api_key_hash);
CREATE INDEX idx_sdk_instances_environment ON sdk_instances(environment);
CREATE INDEX idx_sdk_instances_platform ON sdk_instances(platform);

-- SDK Events Table
CREATE TABLE IF NOT EXISTS sdk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES sdk_instances(id),
  event_name VARCHAR(100) NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  platform VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sdk_events_instance_id ON sdk_events(instance_id);
CREATE INDEX idx_sdk_events_event_name ON sdk_events(event_name);
CREATE INDEX idx_sdk_events_user_id ON sdk_events(user_id);
CREATE INDEX idx_sdk_events_timestamp ON sdk_events(timestamp);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_moderation_reviews_updated_at BEFORE UPDATE ON moderation_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Profitability Summary View
CREATE OR REPLACE VIEW profitability_summary AS
SELECT
  DATE_TRUNC('month', period_start) as month,
  SUM(CASE WHEN source IS NOT NULL THEN amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN service IS NOT NULL THEN cost ELSE 0 END) as total_costs,
  SUM(CASE WHEN category IS NOT NULL THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN source IS NOT NULL THEN amount ELSE 0 END) - 
  SUM(CASE WHEN service IS NOT NULL THEN cost ELSE 0 END) as gross_profit,
  SUM(CASE WHEN source IS NOT NULL THEN amount ELSE 0 END) - 
  SUM(CASE WHEN service IS NOT NULL THEN cost ELSE 0 END) - 
  SUM(CASE WHEN category IS NOT NULL THEN amount ELSE 0 END) as net_profit
FROM (
  SELECT period_start, amount as revenue, NULL::DECIMAL as cost, NULL::DECIMAL as expense, source, NULL::VARCHAR as service, NULL::VARCHAR as category
  FROM revenue_tracking
  UNION ALL
  SELECT period_start, NULL::DECIMAL as revenue, cost, NULL::DECIMAL as expense, NULL::VARCHAR as source, service, NULL::VARCHAR as category
  FROM cost_tracking
  UNION ALL
  SELECT period_start, NULL::DECIMAL as revenue, NULL::DECIMAL as cost, amount as expense, NULL::VARCHAR as source, NULL::VARCHAR as service, category
  FROM operating_expenses
) combined
GROUP BY DATE_TRUNC('month', period_start)
ORDER BY month DESC;

-- Cost Observability View
CREATE OR REPLACE VIEW cost_observability AS
SELECT
  DATE_TRUNC('day', period_start) as date,
  service,
  SUM(cost) as daily_cost,
  COUNT(*) as entries
FROM cost_tracking
GROUP BY DATE_TRUNC('day', period_start), service
ORDER BY date DESC, service;
