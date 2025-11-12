-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Core tables
CREATE TABLE IF NOT EXISTS public.events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  event_name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.spend(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  campaign_id text,
  adset_id text,
  date date NOT NULL,
  spend_cents integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  conv integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.metrics_daily(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL,
  sessions integer NOT NULL DEFAULT 0,
  add_to_carts integer NOT NULL DEFAULT 0,
  orders integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  refunds_cents integer NOT NULL DEFAULT 0,
  aov_cents integer NOT NULL DEFAULT 0,
  cac_cents integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  gross_margin_cents integer NOT NULL DEFAULT 0,
  traffic integer NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_name_time ON public.events(event_name, occurred_at);
CREATE INDEX IF NOT EXISTS idx_spend_platform_dt ON public.spend(platform, date);
CREATE INDEX IF NOT EXISTS idx_metrics_day       ON public.metrics_daily(day);

-- RLS + basic policy
ALTER TABLE public.events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spend         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='events_select_all_srv') THEN
    CREATE POLICY events_select_all_srv ON public.events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='spend' AND policyname='spend_select_all_srv') THEN
    CREATE POLICY spend_select_all_srv ON public.spend FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='metrics_daily' AND policyname='metrics_select_all_srv') THEN
    CREATE POLICY metrics_select_all_srv ON public.metrics_daily FOR SELECT USING (true);
  END IF;
END $$;

-- Upserts
CREATE OR REPLACE FUNCTION public.upsert_events(_rows jsonb)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE _r jsonb; _ins int := 0;
BEGIN
  FOR _r IN SELECT * FROM jsonb_array_elements(_rows)
  LOOP
    INSERT INTO public.events AS e(id, occurred_at, user_id, event_name, props)
    VALUES (
      COALESCE((_r->>'id')::uuid, gen_random_uuid()),
      COALESCE((_r->>'occurred_at')::timestamptz, now()),
      NULLIF(_r->>'user_id','')::uuid,
      _r->>'event_name',
      COALESCE((_r->'props')::jsonb, '{}'::jsonb)
    )
    ON CONFLICT (id) DO UPDATE
      SET occurred_at = EXCLUDED.occurred_at,
          user_id     = EXCLUDED.user_id,
          event_name  = EXCLUDED.event_name,
          props       = EXCLUDED.props;
    _ins := _ins + 1;
  END LOOP;
  RETURN COALESCE(_ins,0);
END $$;

CREATE OR REPLACE FUNCTION public.upsert_spend(_rows jsonb)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE _r jsonb; _ins int := 0;
BEGIN
  FOR _r IN SELECT * FROM jsonb_array_elements(_rows)
  LOOP
    INSERT INTO public.spend AS s(id, platform, campaign_id, adset_id, date, spend_cents, clicks, impressions, conv)
    VALUES (
      COALESCE((_r->>'id')::uuid, gen_random_uuid()),
      _r->>'platform',
      _r->>'campaign_id',
      _r->>'adset_id',
      (_r->>'date')::date,
      COALESCE((_r->>'spend_cents')::int,0),
      COALESCE((_r->>'clicks')::int,0),
      COALESCE((_r->>'impressions')::int,0),
      COALESCE((_r->>'conv')::int,0)
    )
    ON CONFLICT (id) DO UPDATE
      SET platform    = EXCLUDED.platform,
          campaign_id = EXCLUDED.campaign_id,
          adset_id    = EXCLUDED.adset_id,
          date        = EXCLUDED.date,
          spend_cents = EXCLUDED.spend_cents,
          clicks      = EXCLUDED.clicks,
          impressions = EXCLUDED.impressions,
          conv        = EXCLUDED.conv;
    _ins := _ins + 1;
  END LOOP;
  RETURN COALESCE(_ins,0);
END $$;

-- Rollup + healthcheck
CREATE OR REPLACE FUNCTION public.recompute_metrics_daily(_start date, _end date)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.metrics_daily WHERE day BETWEEN _start AND _end;
  INSERT INTO public.metrics_daily(day, sessions, add_to_carts, orders, revenue_cents, refunds_cents, aov_cents, cac_cents, conversion_rate, gross_margin_cents, traffic)
  SELECT d::date, 0,0,
    COALESCE((SELECT count(*) FROM public.events e WHERE e.event_name='order_completed' AND e.occurred_at::date=d),0),
    COALESCE((SELECT sum((e.props->>'revenue_cents')::int) FROM public.events e WHERE e.event_name='order_completed' AND e.occurred_at::date=d),0),
    COALESCE((SELECT sum((e.props->>'refunds_cents')::int) FROM public.events e WHERE e.event_name='order_refunded'  AND e.occurred_at::date=d),0),
    0,
    COALESCE((SELECT sum(spend_cents) FROM public.spend s WHERE s.date=d),0),
    0,
    0,
    COALESCE((SELECT sum(clicks) FROM public.spend s WHERE s.date=d),0)
  FROM generate_series(_start, _end, '1 day') d;
  UPDATE public.metrics_daily
     SET aov_cents = CASE WHEN orders>0 THEN revenue_cents/GREATEST(orders,1) ELSE 0 END,
         conversion_rate = CASE WHEN traffic>0 THEN orders::numeric/traffic ELSE 0 END
   WHERE day BETWEEN _start AND _end;
END $$;

CREATE OR REPLACE FUNCTION public.system_healthcheck()
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v jsonb;
BEGIN
  SELECT jsonb_build_object(
    'events', (SELECT count(*) FROM public.events),
    'spend_days', (SELECT count(DISTINCT date) FROM public.spend),
    'metrics_days', (SELECT count(*) FROM public.metrics_daily)
  ) INTO v;
  RETURN v;
END $$;
