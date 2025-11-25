-- SQL Queries to Get Real Metrics for YC Documentation
-- Run these queries against your Supabase database to get current metrics

-- ============================================================================
-- USER METRICS
-- ============================================================================

-- Total Users
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d,
  COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
  COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '90 days' THEN 1 END) as new_users_90d
FROM users;

-- Paid Users
SELECT 
  COUNT(*) as total_paid_users,
  COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_users,
  COUNT(CASE WHEN plan = 'enterprise' THEN 1 END) as enterprise_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_paid_users
FROM subscriptions
WHERE plan != 'free';

-- ============================================================================
-- USAGE METRICS (DAU/WAU/MAU)
-- ============================================================================

-- DAU (Daily Active Users) - Last 24 hours
SELECT COUNT(DISTINCT "userId") as dau
FROM events
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- WAU (Weekly Active Users) - Last 7 days
SELECT COUNT(DISTINCT "userId") as wau
FROM events
WHERE timestamp >= NOW() - INTERVAL '7 days';

-- MAU (Monthly Active Users) - Last 30 days
SELECT COUNT(DISTINCT "userId") as mau
FROM events
WHERE timestamp >= NOW() - INTERVAL '30 days';

-- DAU/WAU/MAU Trend (Last 30 Days)
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT "userId") as active_users
FROM events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- ============================================================================
-- ACTIVATION METRICS
-- ============================================================================

-- Activation Rate (Users who viewed first suggestion within 7 days)
WITH signups AS (
  SELECT id, "createdAt"
  FROM users
  WHERE "createdAt" >= NOW() - INTERVAL '30 days'
),
activations AS (
  SELECT DISTINCT "userId"
  FROM audit_logs
  WHERE action = 'activation_event:first_insight_view'
    AND timestamp >= NOW() - INTERVAL '30 days'
)
SELECT 
  COUNT(DISTINCT s.id) as total_signups,
  COUNT(DISTINCT a."userId") as activated_users,
  ROUND(COUNT(DISTINCT a."userId")::numeric / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 2) as activation_rate_percent
FROM signups s
LEFT JOIN activations a ON s.id::text = a."userId"
WHERE a."userId" IS NOT NULL OR s."createdAt" >= NOW() - INTERVAL '7 days';

-- Time to Activation (Average days from signup to activation)
SELECT 
  AVG(EXTRACT(EPOCH FROM (a.timestamp - u."createdAt")) / 86400) as avg_days_to_activation
FROM users u
JOIN audit_logs a ON u.id::text = a."userId"
WHERE a.action = 'activation_event:first_insight_view'
  AND a.timestamp >= NOW() - INTERVAL '30 days';

-- ============================================================================
-- RETENTION METRICS
-- ============================================================================

-- 7-Day Retention (Users active in week 0 and week 1)
WITH week0_users AS (
  SELECT DISTINCT "userId"
  FROM events
  WHERE timestamp >= NOW() - INTERVAL '14 days'
    AND timestamp < NOW() - INTERVAL '7 days'
),
week1_users AS (
  SELECT DISTINCT "userId"
  FROM events
  WHERE timestamp >= NOW() - INTERVAL '7 days'
)
SELECT 
  COUNT(DISTINCT w0."userId") as week0_users,
  COUNT(DISTINCT w1."userId") as week1_users,
  ROUND(COUNT(DISTINCT w1."userId")::numeric / NULLIF(COUNT(DISTINCT w0."userId"), 0) * 100, 2) as retention_7d_percent
FROM week0_users w0
LEFT JOIN week1_users w1 ON w0."userId" = w1."userId";

-- 30-Day Retention (Users active in month 0 and month 1)
WITH month0_users AS (
  SELECT DISTINCT "userId"
  FROM events
  WHERE timestamp >= NOW() - INTERVAL '60 days'
    AND timestamp < NOW() - INTERVAL '30 days'
),
month1_users AS (
  SELECT DISTINCT "userId"
  FROM events
  WHERE timestamp >= NOW() - INTERVAL '30 days'
)
SELECT 
  COUNT(DISTINCT m0."userId") as month0_users,
  COUNT(DISTINCT m1."userId") as month1_users,
  ROUND(COUNT(DISTINCT m1."userId")::numeric / NULLIF(COUNT(DISTINCT m0."userId"), 0) * 100, 2) as retention_30d_percent
FROM month0_users m0
LEFT JOIN month1_users m1 ON m0."userId" = m1."userId";

-- ============================================================================
-- ENGAGEMENT METRICS
-- ============================================================================

-- Events per User (Average)
SELECT 
  COUNT(*)::numeric / NULLIF(COUNT(DISTINCT "userId"), 0) as avg_events_per_user,
  COUNT(DISTINCT "userId") as active_users,
  COUNT(*) as total_events
FROM events
WHERE timestamp >= NOW() - INTERVAL '30 days';

-- Suggestions Viewed (if tracked in audit_logs)
SELECT 
  COUNT(*) as suggestions_viewed,
  COUNT(DISTINCT "userId") as users_viewed_suggestions
FROM audit_logs
WHERE action LIKE '%suggestion%' OR action LIKE '%integration_suggestion%'
  AND timestamp >= NOW() - INTERVAL '30 days';

-- Integrations Implemented
SELECT 
  COUNT(*) as total_integrations,
  COUNT(DISTINCT "userId") as users_with_integrations,
  COUNT(*)::numeric / NULLIF(COUNT(DISTINCT "userId"), 0) as avg_integrations_per_user
FROM user_integrations
WHERE "isActive" = true
  AND "createdAt" >= NOW() - INTERVAL '30 days';

-- ============================================================================
-- REVENUE METRICS
-- ============================================================================

-- MRR (Monthly Recurring Revenue)
SELECT 
  SUM(CASE 
    WHEN plan = 'pro' THEN 29
    WHEN plan = 'enterprise' THEN 100  -- Adjust based on actual pricing
    ELSE 0
  END) as mrr,
  COUNT(*) as paid_subscriptions
FROM subscriptions
WHERE status = 'active' AND plan != 'free';

-- ARR (Annual Recurring Revenue)
SELECT 
  SUM(CASE 
    WHEN plan = 'pro' THEN 29 * 12
    WHEN plan = 'enterprise' THEN 100 * 12  -- Adjust based on actual pricing
    ELSE 0
  END) as arr
FROM subscriptions
WHERE status = 'active' AND plan != 'free';

-- ARPU (Average Revenue Per User)
SELECT 
  SUM(CASE 
    WHEN plan = 'pro' THEN 29
    WHEN plan = 'enterprise' THEN 100
    ELSE 0
  END)::numeric / NULLIF(COUNT(*), 0) as arpu
FROM subscriptions
WHERE status = 'active' AND plan != 'free';

-- Subscription Breakdown
SELECT 
  plan,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM subscriptions WHERE status = 'active'), 0) * 100, 2) as percentage
FROM subscriptions
WHERE status = 'active'
GROUP BY plan;

-- ============================================================================
-- GROWTH METRICS
-- ============================================================================

-- Signups per Day (Last 30 Days)
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as signups
FROM users
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- Acquisition Channels (UTM Tracking)
SELECT 
  source,
  medium,
  COUNT(DISTINCT "userId") as signups
FROM utm_tracks
WHERE "firstTouch" = true
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY source, medium
ORDER BY signups DESC;

-- Conversion Funnel
WITH funnel AS (
  SELECT 
    (SELECT COUNT(*) FROM users WHERE "createdAt" >= NOW() - INTERVAL '30 days') as visitors,
    (SELECT COUNT(*) FROM users WHERE "createdAt" >= NOW() - INTERVAL '30 days') as signups,
    (SELECT COUNT(DISTINCT "userId") FROM audit_logs WHERE action = 'activation_event:first_insight_view' AND timestamp >= NOW() - INTERVAL '30 days') as activated,
    (SELECT COUNT(DISTINCT "userId") FROM events WHERE timestamp >= NOW() - INTERVAL '30 days' GROUP BY "userId" HAVING COUNT(*) >= 10) as engaged,
    (SELECT COUNT(DISTINCT "userId") FROM events WHERE timestamp >= NOW() - INTERVAL '7 days' AND "userId" IN (SELECT DISTINCT "userId" FROM events WHERE timestamp >= NOW() - INTERVAL '14 days' AND timestamp < NOW() - INTERVAL '7 days')) as retained,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND plan != 'free' AND "createdAt" >= NOW() - INTERVAL '30 days') as paying
)
SELECT 
  visitors,
  signups,
  ROUND(signups::numeric / NULLIF(visitors, 0) * 100, 2) as signup_rate,
  activated,
  ROUND(activated::numeric / NULLIF(signups, 0) * 100, 2) as activation_rate,
  engaged,
  ROUND(engaged::numeric / NULLIF(activated, 0) * 100, 2) as engagement_rate,
  retained,
  ROUND(retained::numeric / NULLIF(engaged, 0) * 100, 2) as retention_rate,
  paying,
  ROUND(paying::numeric / NULLIF(signups, 0) * 100, 2) as conversion_rate
FROM funnel;

-- ============================================================================
-- UNIT ECONOMICS (Requires Marketing Spend Data)
-- ============================================================================

-- CAC Calculation (requires marketing_spend table or external data)
-- TODO: Create marketing_spend table or integrate with marketing platform APIs

-- LTV Calculation (assumes 12-month average lifetime)
SELECT 
  AVG(CASE 
    WHEN plan = 'pro' THEN 29 * 12
    WHEN plan = 'enterprise' THEN 100 * 12
    ELSE 0
  END) as avg_ltv
FROM subscriptions
WHERE status = 'active' AND plan != 'free';

-- ============================================================================
-- EXPORT FOR YC DOCS
-- ============================================================================

-- Run this query and paste results into YC_INTERVIEW_CHEATSHEET.md
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
  'Paid Users',
  COUNT(*)::text
FROM subscriptions
WHERE status = 'active' AND plan != 'free'
UNION ALL
SELECT 
  'MRR',
  COALESCE(SUM(CASE WHEN plan = 'pro' THEN 29 WHEN plan = 'enterprise' THEN 100 ELSE 0 END)::text, '0')
FROM subscriptions
WHERE status = 'active' AND plan != 'free'
UNION ALL
SELECT 
  'DAU',
  COUNT(DISTINCT "userId")::text
FROM events
WHERE timestamp >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'WAU',
  COUNT(DISTINCT "userId")::text
FROM events
WHERE timestamp >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'MAU',
  COUNT(DISTINCT "userId")::text
FROM events
WHERE timestamp >= NOW() - INTERVAL '30 days';
