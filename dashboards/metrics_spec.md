# Metrics Dashboard Specification

**Purpose:** Define metrics, visualizations, and KPIs for finance automation and growth tracking dashboards.

**Last Updated:** 2025-01-15  
**Timezone:** America/Toronto

---

## Dashboard Overview

The metrics dashboard provides real-time visibility into:
1. Financial performance (revenue, margins, cash runway)
2. Unit economics (CAC, LTV, LTV:CAC ratio)
3. Growth metrics (MRR, ARR, growth rates)
4. Marketing efficiency (spend by channel, conversion rates)
5. Experiment performance

---

## Data Sources

- **Primary:** `metrics_daily` table (Supabase)
- **Supporting:** `orders`, `spend`, `experiments` tables
- **Refresh:** Daily via ETL pipeline (01:10 AM America/Toronto)

---

## Key Metrics & Visualizations

### 1. Financial Overview

#### Revenue Metrics
- **Total Revenue** (line chart, 30/90/365 day views)
- **Net Revenue** (after refunds)
- **Refund Rate** (gauge, target: <5%)
- **MRR** (monthly recurring revenue, line chart)
- **ARR** (annualized run rate, calculated from MRR)

#### Margin Analysis
- **Gross Margin %** (gauge, target: >65%)
- **EBITDA Margin %** (gauge, target: >30%)
- **COGS %** (bar chart, target: <35%)

#### Cash Management
- **Cash Balance** (number, with trend)
- **Cash Runway** (months, gauge, target: >12 months)
- **Monthly Burn Rate** (calculated from expenses)

---

### 2. Unit Economics

#### Customer Acquisition
- **CAC** (Customer Acquisition Cost, line chart)
  - Overall CAC
  - CAC by channel (Meta, TikTok, Other)
- **New Customers** (bar chart, daily/weekly/monthly)

#### Customer Value
- **LTV** (Lifetime Value, line chart)
- **LTV:CAC Ratio** (gauge, target: >5:1)
- **Average Order Value** (AOV, bar chart)

#### Payback Period
- **CAC Payback Period** (days, calculated from LTV and monthly revenue)

---

### 3. Growth Metrics

#### Revenue Growth
- **MRR Growth Rate** (line chart, month-over-month)
- **Revenue Growth Rate** (line chart, week-over-week, month-over-month)
- **Cohort Analysis** (cohort retention curves)

#### Customer Growth
- **New vs. Returning Customers** (stacked bar chart)
- **Customer Retention Rate** (line chart, 30/60/90 day retention)

---

### 4. Marketing Efficiency

#### Spend by Channel
- **Total Spend** (pie chart, Meta vs. TikTok vs. Other)
- **Spend Trend** (line chart, by channel)
- **Spend Efficiency** (CAC by channel, bar chart)

#### Performance Metrics
- **Impressions** (line chart, by channel)
- **Clicks** (line chart, by channel)
- **Conversions** (line chart, by channel)
- **CTR** (Click-Through Rate, line chart)
- **Conversion Rate** (line chart)

---

### 5. Experiment Tracking

#### Active Experiments
- **Experiment Status** (table: name, status, start date, sample size)
- **Experiment Performance** (bar chart: conversion rates, revenue impact)
- **Success Rate** (percentage of experiments meeting success threshold)

#### Experiment Metrics
- **A/B Test Results** (comparison charts)
- **Feature Flag Performance** (adoption rates, impact on KPIs)

---

## Dashboard Layouts

### Executive Dashboard (High-Level)
1. **Top Row:** MRR, ARR, Cash Runway, LTV:CAC Ratio
2. **Second Row:** Revenue Trend (30 days), Margin Trends
3. **Third Row:** CAC by Channel, Experiment Status

### Finance Dashboard (Detailed)
1. **Revenue Section:** Revenue, refunds, margins, cash metrics
2. **Expenses Section:** Operating expenses breakdown, burn rate
3. **Forecast Section:** Actual vs. Forecast comparison (from finance model)

### Growth Dashboard (Detailed)
1. **Acquisition Section:** CAC, new customers, channel performance
2. **Retention Section:** LTV, retention rates, cohort analysis
3. **Experiments Section:** Active experiments, results, impact

---

## Alert Thresholds

### Critical Alerts
- Cash runway < 6 months
- LTV:CAC ratio < 3:1
- Refund rate > 10%
- CAC increase > 20% month-over-month

### Warning Alerts
- Cash runway < 9 months
- LTV:CAC ratio < 4:1
- Refund rate > 7%
- MRR growth rate < 5% month-over-month

---

## Implementation Notes

### Technology Stack
- **Frontend:** React/Next.js (or preferred framework)
- **Charts:** Recharts, Chart.js, or similar
- **Data Fetching:** Supabase client (real-time subscriptions)
- **Caching:** React Query or SWR for data caching

### Data Refresh
- **Real-time:** Use Supabase real-time subscriptions for `metrics_daily` table
- **Manual Refresh:** Button to trigger ETL pipeline
- **Auto-refresh:** Every 5 minutes for real-time data, daily for historical

### Performance Considerations
- **Pagination:** For large date ranges, paginate queries
- **Aggregation:** Pre-aggregate data in `metrics_daily` table
- **Caching:** Cache dashboard data for 5 minutes

---

## Future Enhancements

1. **Forecast Comparison:** Overlay finance model forecasts on actuals
2. **Cohort Analysis:** Detailed cohort retention and revenue analysis
3. **Attribution Modeling:** Multi-touch attribution for customer acquisition
4. **Anomaly Detection:** Automated alerts for metric anomalies
5. **Export Functionality:** Export dashboards as PDF/CSV

---

## Related Documentation

- Finance Model: `/models/finance_model.csv`
- Assumptions: `/models/assumptions.json`
- ETL Scripts: `/scripts/etl/`
- Database Schema: `/infra/supabase/migrations/001_metrics.sql`
