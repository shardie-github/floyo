-- Self-Healing SQL Pack: Upsert Functions & Core Infrastructure
-- Idempotent: Safe to re-run, only creates missing objects
-- Timezone: America/Toronto

SET statement_timeout = 0;
SET timezone = 'America/Toronto';

-- ============================================================================
-- EXTENSIONS (IF NOT EXISTS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TABLES (IF NOT EXISTS)
-- ============================================================================

-- Events table (generic event tracking)
CREATE TABLE IF NOT EXISTS public.events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    user_id uuid,
    props jsonb NOT NULL DEFAULT '{}'::jsonb,
    source text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Spend table (advertising spend tracking)
CREATE TABLE IF NOT EXISTS public.spend (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    platform text NOT NULL,
    campaign_id text,
    adset_id text,
    date date NOT NULL,
    spend_cents integer NOT NULL DEFAULT 0,
    clicks integer NOT NULL DEFAULT 0,
    impressions integer NOT NULL DEFAULT 0,
    conversions integer NOT NULL DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(platform, campaign_id, adset_id, date)
);

-- Metrics daily table (aggregated daily metrics)
CREATE TABLE IF NOT EXISTS public.metrics_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day date NOT NULL UNIQUE,
    sessions integer NOT NULL DEFAULT 0,
    add_to_carts integer NOT NULL DEFAULT 0,
    orders integer NOT NULL DEFAULT 0,
    revenue_cents integer NOT NULL DEFAULT 0,
    refunds_cents integer NOT NULL DEFAULT 0,
    aov_cents integer NOT NULL DEFAULT 0,
    cac_cents integer NOT NULL DEFAULT 0,
    conversion_rate numeric NOT NULL DEFAULT 0,
    gross_margin_cents integer NOT NULL DEFAULT 0,
    traffic integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES (IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_events_name_time ON public.events(name, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON public.events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_spend_platform_dt ON public.spend(platform, date DESC);
CREATE INDEX IF NOT EXISTS idx_spend_date ON public.spend(date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_day ON public.metrics_daily(day DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Enable + Guarded Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;

-- Guarded SELECT policies (service role can read all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND policyname = 'events_select_all_srv'
    ) THEN
        CREATE POLICY events_select_all_srv ON public.events
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'spend' 
        AND policyname = 'spend_select_all_srv'
    ) THEN
        CREATE POLICY spend_select_all_srv ON public.spend
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'metrics_daily' 
        AND policyname = 'metrics_daily_select_all_srv'
    ) THEN
        CREATE POLICY metrics_daily_select_all_srv ON public.metrics_daily
            FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================================================
-- UPSERT FUNCTIONS
-- ============================================================================

-- Upsert events function
CREATE OR REPLACE FUNCTION public.upsert_events(event_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    event_id uuid;
    event_name text;
    event_occurred_at timestamptz;
    event_user_id uuid;
    event_props jsonb;
    event_source text;
BEGIN
    event_name := event_data->>'name';
    event_occurred_at := COALESCE((event_data->>'occurred_at')::timestamptz, now());
    event_user_id := (event_data->>'user_id')::uuid;
    event_props := COALESCE(event_data->'props', '{}'::jsonb);
    event_source := event_data->>'source';

    INSERT INTO public.events (name, occurred_at, user_id, props, source)
    VALUES (event_name, event_occurred_at, event_user_id, event_props, event_source)
    RETURNING id INTO event_id;

    RETURN event_id;
EXCEPTION
    WHEN unique_violation THEN
        -- If duplicate, return existing ID (idempotent)
        SELECT id INTO event_id FROM public.events
        WHERE name = event_name
        AND occurred_at = event_occurred_at
        AND (user_id = event_user_id OR (user_id IS NULL AND event_user_id IS NULL))
        LIMIT 1;
        RETURN event_id;
END;
$$;

-- Upsert spend function
CREATE OR REPLACE FUNCTION public.upsert_spend(spend_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    spend_id uuid;
    spend_platform text;
    spend_campaign_id text;
    spend_adset_id text;
    spend_date date;
    spend_cents_val integer;
    spend_clicks integer;
    spend_impressions integer;
    spend_conversions integer;
    spend_metadata jsonb;
BEGIN
    spend_platform := spend_data->>'platform';
    spend_campaign_id := spend_data->>'campaign_id';
    spend_adset_id := spend_data->>'adset_id';
    spend_date := (spend_data->>'date')::date;
    spend_cents_val := COALESCE((spend_data->>'spend_cents')::integer, 0);
    spend_clicks := COALESCE((spend_data->>'clicks')::integer, 0);
    spend_impressions := COALESCE((spend_data->>'impressions')::integer, 0);
    spend_conversions := COALESCE((spend_data->>'conversions')::integer, 0);
    spend_metadata := COALESCE(spend_data->'metadata', '{}'::jsonb);

    INSERT INTO public.spend (
        platform, campaign_id, adset_id, date,
        spend_cents, clicks, impressions, conversions, metadata
    )
    VALUES (
        spend_platform, spend_campaign_id, spend_adset_id, spend_date,
        spend_cents_val, spend_clicks, spend_impressions, spend_conversions, spend_metadata
    )
    ON CONFLICT (platform, campaign_id, adset_id, date)
    DO UPDATE SET
        spend_cents = EXCLUDED.spend_cents,
        clicks = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        conversions = EXCLUDED.conversions,
        metadata = EXCLUDED.metadata,
        updated_at = now()
    RETURNING id INTO spend_id;

    RETURN spend_id;
END;
$$;

-- ============================================================================
-- METRICS ROLLUP FUNCTION
-- ============================================================================

-- Recompute metrics daily (idempotent rollup)
CREATE OR REPLACE FUNCTION public.recompute_metrics_daily(
    start_date date,
    end_date date
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    rec record;
    days_processed integer := 0;
BEGIN
    -- Loop through each day in range
    FOR rec IN
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS day
    LOOP
        INSERT INTO public.metrics_daily (
            day,
            sessions,
            add_to_carts,
            orders,
            revenue_cents,
            refunds_cents,
            aov_cents,
            cac_cents,
            conversion_rate,
            gross_margin_cents,
            traffic
        )
        SELECT
            rec.day,
            COUNT(DISTINCT CASE WHEN e.name = 'session_start' THEN e.user_id END)::integer AS sessions,
            COUNT(DISTINCT CASE WHEN e.name = 'add_to_cart' THEN e.id END)::integer AS add_to_carts,
            COUNT(DISTINCT CASE WHEN e.name = 'order_placed' THEN e.id END)::integer AS orders,
            COALESCE(SUM(CASE WHEN e.name = 'order_placed' THEN (e.props->>'revenue_cents')::integer END), 0)::integer AS revenue_cents,
            COALESCE(SUM(CASE WHEN e.name = 'refund' THEN (e.props->>'refund_cents')::integer END), 0)::integer AS refunds_cents,
            CASE
                WHEN COUNT(DISTINCT CASE WHEN e.name = 'order_placed' THEN e.id END) > 0
                THEN COALESCE(SUM(CASE WHEN e.name = 'order_placed' THEN (e.props->>'revenue_cents')::integer END), 0)::integer /
                     COUNT(DISTINCT CASE WHEN e.name = 'order_placed' THEN e.id END)
                ELSE 0
            END::integer AS aov_cents,
            COALESCE(SUM(s.spend_cents), 0)::integer AS cac_cents,
            CASE
                WHEN COUNT(DISTINCT CASE WHEN e.name = 'session_start' THEN e.user_id END) > 0
                THEN COUNT(DISTINCT CASE WHEN e.name = 'order_placed' THEN e.id END)::numeric /
                     COUNT(DISTINCT CASE WHEN e.name = 'session_start' THEN e.user_id END)::numeric
                ELSE 0
            END AS conversion_rate,
            COALESCE(SUM(CASE WHEN e.name = 'order_placed' THEN (e.props->>'revenue_cents')::integer END), 0)::integer -
            COALESCE(SUM(s.spend_cents), 0)::integer AS gross_margin_cents,
            COUNT(DISTINCT CASE WHEN e.name = 'page_view' THEN e.id END)::integer AS traffic
        FROM generate_series(rec.day, rec.day + '1 day'::interval - '1 second'::interval, '1 second'::interval) d
        LEFT JOIN public.events e ON e.occurred_at::date = rec.day
        LEFT JOIN public.spend s ON s.date = rec.day
        GROUP BY rec.day
        ON CONFLICT (day) DO UPDATE SET
            sessions = EXCLUDED.sessions,
            add_to_carts = EXCLUDED.add_to_carts,
            orders = EXCLUDED.orders,
            revenue_cents = EXCLUDED.revenue_cents,
            refunds_cents = EXCLUDED.refunds_cents,
            aov_cents = EXCLUDED.aov_cents,
            cac_cents = EXCLUDED.cac_cents,
            conversion_rate = EXCLUDED.conversion_rate,
            gross_margin_cents = EXCLUDED.gross_margin_cents,
            traffic = EXCLUDED.traffic,
            updated_at = now();

        days_processed := days_processed + 1;
    END LOOP;

    RETURN days_processed;
END;
$$;

-- ============================================================================
-- SYSTEM HEALTHCHECK FUNCTION
-- ============================================================================

-- System healthcheck (returns JSONB status)
CREATE OR REPLACE FUNCTION public.system_healthcheck()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    health jsonb;
    events_count bigint;
    spend_count bigint;
    metrics_count bigint;
    latest_event timestamptz;
    latest_spend date;
    latest_metrics date;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO events_count FROM public.events;
    SELECT COUNT(*) INTO spend_count FROM public.spend;
    SELECT COUNT(*) INTO metrics_count FROM public.metrics_daily;

    -- Latest timestamps
    SELECT MAX(occurred_at) INTO latest_event FROM public.events;
    SELECT MAX(date) INTO latest_spend FROM public.spend;
    SELECT MAX(day) INTO latest_metrics FROM public.metrics_daily;

    -- Build health JSON
    health := jsonb_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'tables', jsonb_build_object(
            'events', jsonb_build_object(
                'count', events_count,
                'latest', latest_event,
                'fresh', CASE WHEN latest_event > now() - interval '24 hours' THEN true ELSE false END
            ),
            'spend', jsonb_build_object(
                'count', spend_count,
                'latest', latest_spend,
                'fresh', CASE WHEN latest_spend >= CURRENT_DATE - 1 THEN true ELSE false END
            ),
            'metrics_daily', jsonb_build_object(
                'count', metrics_count,
                'latest', latest_metrics,
                'fresh', CASE WHEN latest_metrics >= CURRENT_DATE - 1 THEN true ELSE false END
            )
        ),
        'rls_enabled', jsonb_build_object(
            'events', (SELECT relrowsecurity FROM pg_class WHERE relname = 'events'),
            'spend', (SELECT relrowsecurity FROM pg_class WHERE relname = 'spend'),
            'metrics_daily', (SELECT relrowsecurity FROM pg_class WHERE relname = 'metrics_daily')
        )
    );

    RETURN health;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.upsert_events(jsonb) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_spend(jsonb) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recompute_metrics_daily(date, date) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.system_healthcheck() TO postgres, anon, authenticated, service_role;
