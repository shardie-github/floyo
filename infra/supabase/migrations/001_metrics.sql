-- Migration: 001_metrics.sql
-- Description: Core metrics tables for finance automation and growth tracking
-- Created: 2025-01-15
-- Timezone: America/Toronto

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table: Raw event tracking from various sources
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'meta', 'tiktok', 'shopify', 'internal'
    external_id VARCHAR(255),
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_occurred_at ON events(occurred_at);
CREATE INDEX idx_events_processed ON events(processed);
CREATE INDEX idx_events_external_id ON events(external_id);

-- Orders table: Consolidated order data from Shopify and other sources
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_order_id VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'shopify',
    customer_id VARCHAR(255),
    customer_email VARCHAR(255),
    order_date TIMESTAMPTZ NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2),
    shipping_amount DECIMAL(12, 2),
    discount_amount DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'pending', 'paid', 'fulfilled', 'refunded', 'cancelled'
    refund_amount DECIMAL(12, 2) DEFAULT 0,
    refund_date TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_external_id ON orders(external_order_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_source ON orders(source);

-- Spend table: Marketing spend tracking from Meta, TikTok, and other channels
CREATE TABLE IF NOT EXISTS spend (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL, -- 'meta', 'tiktok', 'google', 'other'
    campaign_id VARCHAR(255),
    campaign_name VARCHAR(500),
    ad_set_id VARCHAR(255),
    ad_set_name VARCHAR(500),
    ad_id VARCHAR(255),
    ad_name VARCHAR(500),
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    impressions INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    metadata JSONB,
    external_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source, external_id, date)
);

CREATE INDEX idx_spend_source ON spend(source);
CREATE INDEX idx_spend_date ON spend(date);
CREATE INDEX idx_spend_campaign_id ON spend(campaign_id);
CREATE INDEX idx_spend_external_id ON spend(external_id);

-- Experiments table: Growth experiment tracking
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'cancelled'
    start_date DATE,
    end_date DATE,
    sample_size_target INTEGER,
    sample_size_actual INTEGER DEFAULT 0,
    success_threshold JSONB, -- {"metric": "conversion_rate", "value": 0.15, "operator": ">="}
    metrics JSONB, -- Array of metrics to track
    rollout_plan JSONB,
    rollback_plan JSONB,
    results JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_experiments_slug ON experiments(slug);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_start_date ON experiments(start_date);

-- Metrics daily: Aggregated daily metrics for finance and growth analysis
CREATE TABLE IF NOT EXISTS metrics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- Revenue metrics
    revenue DECIMAL(12, 2) DEFAULT 0,
    net_revenue DECIMAL(12, 2) DEFAULT 0, -- After refunds
    refund_amount DECIMAL(12, 2) DEFAULT 0,
    refund_count INTEGER DEFAULT 0,
    refund_rate DECIMAL(5, 4) DEFAULT 0, -- Percentage
    
    -- Order metrics
    order_count INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    average_order_value DECIMAL(12, 2) DEFAULT 0,
    
    -- Marketing metrics
    spend_total DECIMAL(12, 2) DEFAULT 0,
    spend_meta DECIMAL(12, 2) DEFAULT 0,
    spend_tiktok DECIMAL(12, 2) DEFAULT 0,
    spend_other DECIMAL(12, 2) DEFAULT 0,
    impressions_total INTEGER DEFAULT 0,
    clicks_total INTEGER DEFAULT 0,
    conversions_total INTEGER DEFAULT 0,
    
    -- Unit economics
    cac DECIMAL(10, 2), -- Customer Acquisition Cost
    cac_meta DECIMAL(10, 2),
    cac_tiktok DECIMAL(10, 2),
    cac_other DECIMAL(10, 2),
    ltv DECIMAL(10, 2), -- Lifetime Value (rolling 90-day)
    ltv_cac_ratio DECIMAL(5, 2),
    
    -- Financial metrics
    cogs DECIMAL(12, 2) DEFAULT 0,
    cogs_percentage DECIMAL(5, 4) DEFAULT 0,
    gross_margin DECIMAL(12, 2) DEFAULT 0,
    gross_margin_percentage DECIMAL(5, 4) DEFAULT 0,
    
    -- Operating expenses (from finance model assumptions)
    sales_marketing_expense DECIMAL(12, 2) DEFAULT 0,
    product_dev_expense DECIMAL(12, 2) DEFAULT 0,
    general_admin_expense DECIMAL(12, 2) DEFAULT 0,
    operating_expenses_total DECIMAL(12, 2) DEFAULT 0,
    ebitda DECIMAL(12, 2) DEFAULT 0,
    ebitda_margin DECIMAL(5, 4) DEFAULT 0,
    
    -- Cash metrics
    cash_balance DECIMAL(12, 2),
    cash_runway_months DECIMAL(5, 2),
    
    -- Growth metrics
    mrr DECIMAL(12, 2) DEFAULT 0,
    arr DECIMAL(12, 2) DEFAULT 0,
    mrr_growth_rate DECIMAL(5, 4) DEFAULT 0,
    
    -- Experiment metrics (JSONB for flexibility)
    experiment_metrics JSONB,
    
    -- Metadata
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(date)
);

CREATE INDEX idx_metrics_daily_date ON metrics_daily(date);
CREATE INDEX idx_metrics_daily_revenue ON metrics_daily(revenue);
CREATE INDEX idx_metrics_daily_cac ON metrics_daily(cac);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spend_updated_at BEFORE UPDATE ON spend
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_daily_updated_at BEFORE UPDATE ON metrics_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE events IS 'Raw events from all sources (Meta, TikTok, Shopify, internal)';
COMMENT ON TABLE orders IS 'Consolidated order data from Shopify and other e-commerce platforms';
COMMENT ON TABLE spend IS 'Marketing spend tracking from Meta Ads, TikTok Ads, and other channels';
COMMENT ON TABLE experiments IS 'Growth experiment definitions and status tracking';
COMMENT ON TABLE metrics_daily IS 'Daily aggregated metrics for finance and growth analysis';

COMMENT ON COLUMN metrics_daily.cac IS 'Customer Acquisition Cost = Total Spend / New Customers';
COMMENT ON COLUMN metrics_daily.ltv IS 'Lifetime Value = Average Revenue per Customer × Average Customer Lifetime (90-day rolling)';
COMMENT ON COLUMN metrics_daily.refund_rate IS 'Refund Rate = Refund Amount / Revenue';
COMMENT ON COLUMN metrics_daily.cogs_percentage IS 'COGS Percentage = COGS / Revenue';
COMMENT ON COLUMN metrics_daily.ebitda_margin IS 'EBITDA Margin = EBITDA / Revenue';
