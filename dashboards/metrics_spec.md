# Metrics Dashboard Specification

**Last Updated:** 2025-01-27  
**Timezone:** America/Toronto

## Overview

This document defines KPIs and Data Quality (DQ) tiles for the metrics dashboard.

## Core KPIs

### Revenue Metrics
- **MRR** (Monthly Recurring Revenue): Sum of active subscriptions
- **ARR** (Annual Recurring Revenue): MRR × 12
- **Revenue**: Total revenue (orders + subscriptions)
- **AOV** (Average Order Value): Revenue / Orders
- **Gross Margin**: Revenue - COGS
- **Gross Margin %**: (Gross Margin / Revenue) × 100

### Customer Metrics
- **Customers**: Total paying customers
- **New Customers**: New customers this period
- **ARPU** (Average Revenue Per User): MRR / Customers
- **Churn Rate**: Customers lost / Starting customers
- **Retention D7**: % of users active on day 7
- **Retention D30**: % of users active on day 30

### Growth Metrics
- **Activation Rate**: % of signups who activate (first workflow created)
- **Conversion Rate**: Orders / Sessions
- **CAC** (Customer Acquisition Cost): Marketing spend / New customers
- **LTV** (Lifetime Value): ARPU × Average lifetime months
- **LTV:CAC Ratio**: LTV / CAC (target: ≥4:1)

### Engagement Metrics
- **Sessions**: Total user sessions
- **Active Users**: Users with activity in period
- **Workflows Created**: Total workflows created
- **Workflows Executed**: Total workflow executions

## Data Quality Tiles

### Freshness Checks
- **Events Data Freshness**: Last event timestamp (alert if >24h old)
- **Spend Data Freshness**: Last spend record date (alert if >48h old)
- **Metrics Daily Freshness**: Last metrics_daily record (alert if missing yesterday)

### Completeness Checks
- **Events Completeness**: % of expected events received (target: >95%)
- **Spend Completeness**: % of platforms reporting (target: 100%)
- **Orders Completeness**: % of orders with required fields (target: 100%)

### Accuracy Checks
- **Revenue Reconciliation**: Sum of orders vs. Stripe revenue (tolerance: ±1%)
- **Spend Reconciliation**: Sum of spend vs. platform totals (tolerance: ±2%)
- **Metrics Consistency**: Daily metrics sum matches raw data (tolerance: ±0.5%)

### Duplicate Detection
- **Duplicate Events**: Count of duplicate event IDs (target: 0)
- **Duplicate Orders**: Count of duplicate order numbers (target: 0)
- **Duplicate Spend**: Count of duplicate spend records (target: 0)

## Dashboard Layout

### Row 1: Revenue & Customers
- MRR, ARR, Revenue, Gross Margin %
- Customers, New Customers, ARPU, Churn Rate

### Row 2: Growth & Unit Economics
- Activation Rate, Conversion Rate, CAC, LTV, LTV:CAC

### Row 3: Engagement
- Sessions, Active Users, Workflows Created, Workflows Executed

### Row 4: Data Quality
- Freshness tiles (Events, Spend, Metrics)
- Completeness tiles (Events, Spend, Orders)
- Accuracy tiles (Revenue, Spend, Metrics)
- Duplicate detection tiles

## Alert Thresholds

- **MRR Drop**: >10% MoM decrease → Alert
- **Churn Rate**: >8% monthly → Alert
- **LTV:CAC**: <3:1 → Alert
- **Activation Rate**: <30% → Alert
- **D7 Retention**: <20% → Alert
- **Data Freshness**: >24h stale → Alert
- **Completeness**: <90% → Alert
- **Accuracy**: >2% variance → Alert

## Refresh Frequency

- **Real-time**: Revenue, Customers, Sessions
- **Hourly**: Engagement metrics
- **Daily**: All metrics (computed at 01:10 ET)
- **Weekly**: Cohort analysis, retention curves

## Notes

- All monetary values in cents (integer) for precision
- All percentages as decimals (0.25 = 25%)
- Timezone: America/Toronto
- Date ranges: Inclusive start, exclusive end
