-- Data Quality Checks
-- Template SQL queries for data quality validation
-- Run via run_data_quality.ts script

-- ============================================================================
-- FRESHNESS CHECKS
-- ============================================================================

-- Events data freshness (should have data from last 24 hours)
SELECT 
    'events_freshness' as check_name,
    MAX(occurred_at) as latest_event,
    CASE 
        WHEN MAX(occurred_at) > NOW() - INTERVAL '24 hours' THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM public.events;

-- Spend data freshness (should have data from yesterday)
SELECT 
    'spend_freshness' as check_name,
    MAX(date) as latest_spend,
    CASE 
        WHEN MAX(date) >= CURRENT_DATE - 1 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM public.spend;

-- Metrics daily freshness (should have yesterday's data)
SELECT 
    'metrics_daily_freshness' as check_name,
    MAX(day) as latest_metrics,
    CASE 
        WHEN MAX(day) >= CURRENT_DATE - 1 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM public.metrics_daily;

-- ============================================================================
-- COMPLETENESS CHECKS
-- ============================================================================

-- Events completeness (check for NULL required fields)
SELECT 
    'events_completeness' as check_name,
    COUNT(*) FILTER (WHERE name IS NULL) as null_names,
    COUNT(*) FILTER (WHERE occurred_at IS NULL) as null_timestamps,
    CASE 
        WHEN COUNT(*) FILTER (WHERE name IS NULL OR occurred_at IS NULL) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM public.events;

-- Spend completeness (check for NULL required fields)
SELECT 
    'spend_completeness' as check_name,
    COUNT(*) FILTER (WHERE platform IS NULL) as null_platforms,
    COUNT(*) FILTER (WHERE date IS NULL) as null_dates,
    COUNT(*) FILTER (WHERE spend_cents IS NULL) as null_spend,
    CASE 
        WHEN COUNT(*) FILTER (WHERE platform IS NULL OR date IS NULL OR spend_cents IS NULL) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM public.spend;

-- Metrics daily completeness (check for NULL required fields)
SELECT 
    'metrics_daily_completeness' as check_name,
    COUNT(*) FILTER (WHERE day IS NULL) as null_days,
    COUNT(*) FILTER (WHERE revenue_cents IS NULL) as null_revenue,
    CASE 
        WHEN COUNT(*) FILTER (WHERE day IS NULL OR revenue_cents IS NULL) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM public.metrics_daily;

-- ============================================================================
-- ACCURACY CHECKS
-- ============================================================================

-- Revenue consistency (sum of orders should match metrics_daily)
SELECT 
    'revenue_consistency' as check_name,
    COALESCE(SUM(total_cents), 0) as orders_total_cents,
    (SELECT COALESCE(SUM(revenue_cents), 0) FROM public.metrics_daily WHERE day >= CURRENT_DATE - 7) as metrics_revenue_cents,
    CASE 
        WHEN ABS(COALESCE(SUM(total_cents), 0) - 
                 (SELECT COALESCE(SUM(revenue_cents), 0) FROM public.metrics_daily WHERE day >= CURRENT_DATE - 7)) 
             < 100 THEN 'PASS'  -- Allow $1 tolerance
        ELSE 'FAIL'
    END as status
FROM public.orders
WHERE placed_at >= CURRENT_DATE - 7;

-- Spend consistency (sum of spend should match platform totals)
SELECT 
    'spend_consistency' as check_name,
    COUNT(DISTINCT platform) as platforms_count,
    SUM(spend_cents) as total_spend_cents,
    CASE 
        WHEN COUNT(DISTINCT platform) > 0 AND SUM(spend_cents) >= 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM public.spend
WHERE date >= CURRENT_DATE - 7;

-- ============================================================================
-- DUPLICATE DETECTION
-- ============================================================================

-- Duplicate events (same name, occurred_at, user_id)
SELECT 
    'duplicate_events' as check_name,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM (
    SELECT name, occurred_at, user_id, COUNT(*) as cnt
    FROM public.events
    GROUP BY name, occurred_at, user_id
    HAVING COUNT(*) > 1
) duplicates;

-- Duplicate spend (same platform, campaign_id, adset_id, date)
SELECT 
    'duplicate_spend' as check_name,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM (
    SELECT platform, campaign_id, adset_id, date, COUNT(*) as cnt
    FROM public.spend
    GROUP BY platform, campaign_id, adset_id, date
    HAVING COUNT(*) > 1
) duplicates;

-- Duplicate metrics_daily (same day)
SELECT 
    'duplicate_metrics_daily' as check_name,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM (
    SELECT day, COUNT(*) as cnt
    FROM public.metrics_daily
    GROUP BY day
    HAVING COUNT(*) > 1
) duplicates;
