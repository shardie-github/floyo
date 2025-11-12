SELECT 'metrics_daily.day NULL' AS err FROM public.metrics_daily WHERE day IS NULL LIMIT 1;
SELECT 'metrics_daily.revenue_cents NULL' FROM public.metrics_daily WHERE revenue_cents IS NULL LIMIT 1;
SELECT 'metrics freshness fail'
WHERE NOT EXISTS (SELECT 1 FROM public.metrics_daily WHERE day = CURRENT_DATE - 1);
