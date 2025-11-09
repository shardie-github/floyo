-- Finance Automation & Growth Metrics Schema
-- Migration: 001_metrics.sql
-- Description: Core tables for events, orders, spend, experiments, and daily metrics aggregation
-- Timezone: America/Toronto

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search/pattern matching

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Tracks user events and actions for analytics
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view', 'click', 'conversion', 'signup', 'purchase', 
        'refund', 'churn', 'upgrade', 'downgrade', 'trial_start', 'trial_end'
    )),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    session_id TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_user_id ON events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_events_properties_gin ON events USING GIN(properties);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
-- Tracks customer orders and transactions
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL, -- External order ID (e.g., Shopify order number)
    user_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'paid', 'fulfilled', 'refunded', 'cancelled', 'failed'
    )),
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) DEFAULT 0,
    shipping DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    refund_amount DECIMAL(12, 2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    payment_provider TEXT,
    source TEXT, -- 'shopify', 'stripe', 'manual', etc.
    source_data JSONB DEFAULT '{}'::jsonb, -- Raw data from source system
    items JSONB DEFAULT '[]'::jsonb, -- Array of order items
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_source ON orders(source);

-- ============================================================================
-- SPEND TABLE
-- ============================================================================
-- Tracks marketing and operational spend by channel
CREATE TABLE IF NOT EXISTS spend (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN (
        'meta_ads', 'tiktok_ads', 'google_ads', 'organic', 'email', 
        'affiliate', 'content', 'events', 'other'
    )),
    campaign_id TEXT,
    campaign_name TEXT,
    ad_set_id TEXT,
    ad_set_name TEXT,
    ad_id TEXT,
    ad_name TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    amount DECIMAL(12, 2) NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_value DECIMAL(12, 2) DEFAULT 0,
    source TEXT NOT NULL, -- 'meta_api', 'tiktok_api', 'manual', 'shopify', etc.
    source_data JSONB DEFAULT '{}'::jsonb, -- Raw API response data
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(date, channel, campaign_id, ad_set_id, ad_id)
);

CREATE INDEX idx_spend_date ON spend(date DESC);
CREATE INDEX idx_spend_channel ON spend(channel);
CREATE INDEX idx_spend_campaign_id ON spend(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_spend_date_channel ON spend(date DESC, channel);

-- ============================================================================
-- EXPERIMENTS TABLE
-- ============================================================================
-- Tracks growth experiments and A/B tests
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'running', 'paused', 'completed', 'cancelled'
    )),
    start_date DATE,
    end_date DATE,
    sample_size_target INTEGER,
    sample_size_actual INTEGER DEFAULT 0,
    variants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of variant configs
    metrics JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of metric names to track
    success_threshold JSONB DEFAULT '{}'::jsonb, -- Criteria for success
    rollout_percent INTEGER DEFAULT 0 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
    owner TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_experiments_slug ON experiments(slug);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_start_date ON experiments(start_date) WHERE start_date IS NOT NULL;

-- ============================================================================
-- METRICS_DAILY TABLE
-- ============================================================================
-- Aggregated daily metrics for reporting and analysis
CREATE TABLE IF NOT EXISTS metrics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    -- Revenue metrics
    revenue DECIMAL(12, 2) DEFAULT 0,
    net_revenue DECIMAL(12, 2) DEFAULT 0, -- After refunds
    refunds DECIMAL(12, 2) DEFAULT 0,
    refund_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    average_order_value DECIMAL(12, 2) DEFAULT 0,
    
    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    active_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    
    -- Marketing metrics
    spend_total DECIMAL(12, 2) DEFAULT 0,
    spend_meta DECIMAL(12, 2) DEFAULT 0,
    spend_tiktok DECIMAL(12, 2) DEFAULT 0,
    spend_other DECIMAL(12, 2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Calculated metrics
    cac DECIMAL(12, 2) DEFAULT 0, -- Customer Acquisition Cost
    ltv DECIMAL(12, 2) DEFAULT 0, -- Lifetime Value (from cohort analysis)
    ltv_cac_ratio DECIMAL(10, 4) DEFAULT 0,
    cogs DECIMAL(12, 2) DEFAULT 0,
    cogs_percent DECIMAL(5, 4) DEFAULT 0,
    gross_margin DECIMAL(12, 2) DEFAULT 0,
    gross_margin_percent DECIMAL(5, 4) DEFAULT 0,
    
    -- Operating expenses (from manual entry or allocation)
    operating_expenses DECIMAL(12, 2) DEFAULT 0,
    sales_marketing DECIMAL(12, 2) DEFAULT 0,
    product_dev DECIMAL(12, 2) DEFAULT 0,
    general_admin DECIMAL(12, 2) DEFAULT 0,
    
    -- Profitability
    ebitda DECIMAL(12, 2) DEFAULT 0,
    ebitda_margin DECIMAL(5, 4) DEFAULT 0,
    
    -- Cash flow
    cash_balance DECIMAL(12, 2),
    cash_burn_rate DECIMAL(12, 2) DEFAULT 0,
    runway_months DECIMAL(10, 2),
    
    -- Experiment metrics (JSONB for flexibility)
    experiment_results JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_quality_score DECIMAL(3, 2) DEFAULT 1.0, -- 0.0 to 1.0
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_metrics_daily_date ON metrics_daily(date DESC);
CREATE INDEX idx_metrics_daily_revenue ON metrics_daily(revenue DESC);
CREATE INDEX idx_metrics_daily_cac ON metrics_daily(cac) WHERE cac > 0;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spend_updated_at BEFORE UPDATE ON spend
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_daily_updated_at BEFORE UPDATE ON metrics_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE events IS 'User events and actions for analytics tracking';
COMMENT ON TABLE orders IS 'Customer orders and transactions from all sources';
COMMENT ON TABLE spend IS 'Marketing and operational spend by channel and campaign';
COMMENT ON TABLE experiments IS 'Growth experiments and A/B tests';
COMMENT ON TABLE metrics_daily IS 'Aggregated daily metrics for finance and growth reporting';

COMMENT ON COLUMN metrics_daily.cac IS 'Customer Acquisition Cost = Total Spend / New Customers';
COMMENT ON COLUMN metrics_daily.ltv IS 'Lifetime Value calculated from cohort analysis';
COMMENT ON COLUMN metrics_daily.ltv_cac_ratio IS 'LTV:CAC ratio (target > 3.0)';
COMMENT ON COLUMN metrics_daily.runway_months IS 'Cash runway in months = Cash Balance / Monthly Cash Burn';
