# Metrics Dashboard Specification

**Last Updated:** 2025-01-27  
**Dashboard Owner:** Product Manager  
**Data Source:** `public.metrics_daily` table

---

## Overview

This dashboard provides real-time visibility into key business metrics: revenue, CAC, LTV, retention, activation, and growth.

---

## Key Metrics

### Revenue Metrics
- **MRR** (Monthly Recurring Revenue): Sum of `revenue_cents` for current month / 100
- **ARR** (Annual Recurring Revenue): MRR × 12
- **Revenue Growth Rate**: MoM % change in MRR
- **AOV** (Average Order Value): Average of `aov_cents` / 100

### Acquisition Metrics
- **CAC** (Customer Acquisition Cost): Average of `cac_cents` / 100
- **New Customers**: Count of first-time orders
- **Traffic**: Sum of `traffic` (total events)
- **Sessions**: Sum of `sessions` (unique users)

### Retention Metrics
- **D7 Retention**: % of users active 7 days after signup
- **D30 Retention**: % of users active 30 days after signup
- **Churn Rate**: Monthly churn % (calculated from retention)

### Conversion Metrics
- **Conversion Rate**: Average of `conversion_rate` × 100
- **Activation Rate**: % of signups who create first workflow
- **Add-to-Cart Rate**: `add_to_carts` / `sessions` × 100

### Profitability Metrics
- **Gross Margin**: Sum of `gross_margin_cents` / Sum of `revenue_cents` × 100
- **LTV:CAC Ratio**: LTV / CAC
- **Net Margin**: (Revenue - Costs) / Revenue × 100

---

## Dashboard Views

### 1. Executive Summary
**Audience:** Executives, Investors  
**Refresh:** Daily  
**Metrics:**
- MRR (current + trend)
- ARR
- LTV:CAC ratio
- D7 Retention
- Net Margin

### 2. Growth Dashboard
**Audience:** Growth Team  
**Refresh:** Daily  
**Metrics:**
- New Customers (daily + trend)
- CAC by channel
- Conversion Rate
- Activation Rate
- Traffic & Sessions

### 3. Retention Dashboard
**Audience:** Product Team  
**Refresh:** Daily  
**Metrics:**
- D7 Retention (cohort view)
- D30 Retention (cohort view)
- Churn Rate
- Cohort Analysis

### 4. Finance Dashboard
**Audience:** Finance Team  
**Refresh:** Daily  
**Metrics:**
- Revenue (MRR, ARR)
- Costs (CAC, Infrastructure)
- Gross Margin
- Net Margin
- P&L Summary

---

## Data Queries

### MRR Calculation
```sql
SELECT 
  DATE_TRUNC('month', day) as month,
  SUM(revenue_cents) / 100.0 as mrr
FROM public.metrics_daily
WHERE DATE_TRUNC('month', day) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', day);
```

### CAC by Channel
```sql
SELECT 
  platform,
  date,
  SUM(spend_cents) / NULLIF(COUNT(DISTINCT campaign_id), 0) / 100.0 as avg_cac
FROM public.spend
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY platform, date
ORDER BY date DESC;
```

### D7 Retention
```sql
WITH signups AS (
  SELECT user_id, MIN(DATE(placed_at)) as signup_date
  FROM public.orders
  GROUP BY user_id
),
active_d7 AS (
  SELECT DISTINCT s.user_id
  FROM signups s
  JOIN public.events e ON e.user_id = s.user_id::text
  WHERE DATE(e.occurred_at) = s.signup_date + INTERVAL '7 days'
)
SELECT 
  COUNT(DISTINCT a.user_id)::float / NULLIF(COUNT(DISTINCT s.user_id), 0) * 100 as d7_retention
FROM signups s
LEFT JOIN active_d7 a ON a.user_id = s.user_id
WHERE s.signup_date >= CURRENT_DATE - INTERVAL '30 days';
```

---

## Implementation Notes

- **Dashboard Tool:** Use Supabase Dashboard, Metabase, or custom React dashboard
- **Refresh Frequency:** Daily (after ETL completes at 01:30 AM Toronto)
- **Data Retention:** Keep `metrics_daily` data for 2+ years
- **Alerts:** Set up alerts for CAC >$50, D7 retention <20%, MRR decline

---

## Next Steps

1. ✅ Metrics spec created (this document)
2. ⏭️ Build dashboard UI (React + Supabase client)
3. ⏭️ Set up automated alerts
4. ⏭️ Create executive summary email (weekly)

---

**Dashboard Owner:** Product Manager  
**Review Frequency:** Weekly  
**Last Review:** 2025-01-27
