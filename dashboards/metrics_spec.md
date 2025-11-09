# Metrics Dashboard Specification

## Overview

This document specifies the metrics dashboard requirements for the Finance Automation & Growth Execution Chain.

## Dashboard Views

### 1. Executive Dashboard

**Purpose:** High-level KPIs for leadership review

**Metrics:**
- Revenue (MTD, YTD, YoY growth)
- Net Revenue (after refunds)
- EBITDA Margin
- Cash Balance & Runway
- LTV:CAC Ratio
- Active Customers
- Churn Rate

**Refresh:** Daily
**Time Range:** Last 30 days, Last 90 days, Last 12 months

### 2. Finance Dashboard

**Purpose:** Detailed financial metrics and forecasting

**Metrics:**
- Revenue by day/week/month
- COGS & Gross Margin
- Operating Expenses breakdown:
  - Sales & Marketing
  - Product Development
  - General & Admin
- EBITDA & EBITDA Margin
- Cash Flow & Burn Rate
- Runway (months)
- Refund Rate & Refund Amount

**Charts:**
- Revenue trend (line chart)
- Expense breakdown (stacked bar)
- Cash balance over time (area chart)
- Runway projection (line chart)

**Refresh:** Daily
**Time Range:** Last 90 days, Last 12 months

### 3. Growth Dashboard

**Purpose:** Marketing and customer acquisition metrics

**Metrics:**
- CAC by channel (Meta, TikTok, Other)
- LTV & LTV:CAC Ratio
- New Customers
- Customer Churn Rate
- Active Customers
- Conversion Rate (clicks → customers)

**Charts:**
- CAC trend by channel (multi-line)
- LTV:CAC ratio over time (line chart)
- Customer acquisition funnel (funnel chart)
- Channel performance comparison (bar chart)

**Refresh:** Daily
**Time Range:** Last 30 days, Last 90 days

### 4. Marketing Spend Dashboard

**Purpose:** Advertising spend and performance

**Metrics:**
- Total Spend by Channel
- Spend by Campaign
- Impressions, Clicks, Conversions
- Cost per Click (CPC)
- Cost per Conversion
- Return on Ad Spend (ROAS)

**Charts:**
- Spend by channel (pie/bar chart)
- Campaign performance (table with sort/filter)
- ROAS trend (line chart)
- Spend efficiency (scatter plot: spend vs. conversions)

**Refresh:** Daily
**Time Range:** Last 7 days, Last 30 days, Last 90 days

### 5. Experiment Dashboard

**Purpose:** Growth experiment tracking

**Metrics:**
- Active Experiments
- Experiment Results (variant performance)
- Success Rate
- Sample Sizes
- Statistical Significance

**Charts:**
- Experiment status (kanban board)
- Variant comparison (bar chart)
- Experiment timeline (Gantt chart)

**Refresh:** Real-time (on experiment update)
**Time Range:** All active + completed experiments

## Data Sources

All dashboards pull from the `metrics_daily` table in Supabase, with real-time queries to:
- `orders` table (for order-level details)
- `spend` table (for campaign-level details)
- `experiments` table (for experiment results)
- `events` table (for user behavior)

## Implementation Notes

### Recommended Tools

1. **Supabase Dashboard** (built-in)
   - Quick setup
   - SQL queries with charts
   - Good for ad-hoc analysis

2. **Metabase** (open-source)
   - Self-hosted or cloud
   - Rich visualization options
   - Scheduled reports

3. **Looker Studio** (Google)
   - Free
   - Easy sharing
   - Connects to Supabase via BigQuery or direct SQL

4. **Retool** (for custom dashboards)
   - Internal tools
   - Custom workflows
   - API integrations

### Query Examples

```sql
-- Executive Dashboard: Last 30 days summary
SELECT 
  SUM(revenue) as revenue,
  SUM(net_revenue) as net_revenue,
  AVG(ebitda_margin) as avg_ebitda_margin,
  AVG(ltv_cac_ratio) as avg_ltv_cac,
  MAX(cash_balance) as cash_balance,
  AVG(runway_months) as avg_runway
FROM metrics_daily
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Growth Dashboard: CAC by channel
SELECT 
  date,
  SUM(spend_meta) / NULLIF(SUM(new_customers), 0) as cac_meta,
  SUM(spend_tiktok) / NULLIF(SUM(new_customers), 0) as cac_tiktok,
  SUM(spend_other) / NULLIF(SUM(new_customers), 0) as cac_other
FROM metrics_daily
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

## Alerting

Set up alerts for:
- CAC > $200 (threshold breach)
- LTV:CAC < 3.0 (efficiency warning)
- Runway < 6 months (cash risk)
- Refund rate > 5% (quality issue)
- Churn rate > 7% (retention issue)

## Access Control

- **Executive Dashboard:** C-level, investors
- **Finance Dashboard:** Finance team, CFO
- **Growth Dashboard:** Growth team, CMO
- **Marketing Spend Dashboard:** Marketing team
- **Experiment Dashboard:** Product & Growth teams

## Next Steps

1. Set up Supabase connection in chosen dashboard tool
2. Create initial dashboard views
3. Configure scheduled refreshes
4. Set up alerting rules
5. Train team on dashboard usage
