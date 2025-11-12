# Metrics Dashboard Specification

**Purpose:** Real-time business intelligence dashboard for Floyo  
**Target Users:** Executives, Product, Growth, Engineering  
**Update Frequency:** Real-time (events), Daily (aggregates)

---

## Core Metrics

### Revenue Metrics
- **MRR** (Monthly Recurring Revenue)
- **ARR** (Annual Recurring Revenue)
- **Revenue Growth (MoM)** (Month-over-month growth rate)
- **ARPU** (Average Revenue Per User)

### Customer Metrics
- **Total Customers** (Active paying customers)
- **New Customers** (This month)
- **Churn Rate** (Monthly churn percentage)
- **Net Customer Growth** (New - Churned)

### Unit Economics
- **CAC** (Customer Acquisition Cost)
- **LTV** (Lifetime Value)
- **LTV:CAC Ratio** (Target: >4:1)
- **Payback Period** (Months to recover CAC)

### Activation & Retention
- **Activation Rate** (% of signups who create first workflow)
- **D1 Retention** (Day 1 retention rate)
- **D7 Retention** (Day 7 retention rate)
- **D30 Retention** (Day 30 retention rate)
- **Cohort Retention** (Retention by signup cohort)

### Growth Metrics
- **Signups** (Total signups)
- **Signup Growth (MoM)** (Month-over-month signup growth)
- **Conversion Rate** (Signup → Paid)
- **Referral Rate** (% of signups from referrals)

### Engagement Metrics
- **Active Users (DAU)** (Daily Active Users)
- **Active Users (MAU)** (Monthly Active Users)
- **Workflows Created** (Total workflows)
- **Workflows Run** (Total workflow executions)
- **Time Saved** (Estimated hours saved)

### Financial Metrics
- **Gross Margin** (Revenue - COGS)
- **Gross Margin %** (Target: >65%)
- **EBITDA** (Earnings Before Interest Taxes Depreciation Amortization)
- **EBITDA Margin %** (Target: >0% for profitability)
- **Cash Balance** (Current cash on hand)
- **Cash Runway** (Months until cash runs out)

### Marketing Metrics
- **Spend (Total)** (Total ad spend)
- **Spend (Meta)** (Meta ad spend)
- **Spend (TikTok)** (TikTok ad spend)
- **Impressions** (Total ad impressions)
- **Clicks** (Total ad clicks)
- **Conversions** (Total conversions)
- **CPC** (Cost Per Click)
- **CPM** (Cost Per Mille)

---

## Dashboard Views

### 1. Executive Dashboard
**Metrics:** MRR, ARR, Customers, LTV:CAC, Cash Runway, Growth Rate  
**Update Frequency:** Daily  
**Purpose:** High-level business health

### 2. Growth Dashboard
**Metrics:** Signups, Activation Rate, Conversion Rate, CAC, Referral Rate  
**Update Frequency:** Real-time  
**Purpose:** Track growth channels and conversion

### 3. Retention Dashboard
**Metrics:** D1/D7/D30 Retention, Cohort Retention, Churn Rate  
**Update Frequency:** Daily  
**Purpose:** Track retention and identify churn patterns

### 4. Financial Dashboard
**Metrics:** Revenue, COGS, Gross Margin, EBITDA, Cash Runway  
**Update Frequency:** Daily  
**Purpose:** Track profitability and cash position

### 5. Marketing Dashboard
**Metrics:** Spend, Impressions, Clicks, Conversions, CAC by Channel  
**Update Frequency:** Daily  
**Purpose:** Track marketing performance and ROI

---

## Data Sources

- **Supabase:** `metrics_daily`, `orders`, `spend`, `events`, `experiments`
- **ETL Scripts:** `pull_ads_meta.ts`, `pull_ads_tiktok.ts`, `pull_shopify_orders.ts`, `compute_metrics.ts`
- **Analytics:** PostHog/Mixpanel (events, funnels, cohorts)

---

## Implementation Notes

1. **Real-time Metrics:** Use Supabase Realtime subscriptions for events
2. **Aggregated Metrics:** Use `metrics_daily` table (updated nightly)
3. **Cohort Analysis:** Use `events` table with `user_id` and `occurred_at`
4. **Experiments:** Use `experiments` and `experiment_arms` tables

---

## Alerts & Guardrails

- **Cash Runway <3 months:** Alert executives
- **Activation Rate <30%:** Alert product team
- **D7 Retention <20%:** Alert growth team
- **LTV:CAC <3:1:** Alert marketing team
- **Churn Rate >10%:** Alert customer success team

---

## Tools & Stack

- **Dashboard:** Supabase Dashboard, Metabase, or custom React dashboard
- **Visualization:** Chart.js, Recharts, or D3.js
- **Data:** Supabase PostgreSQL (real-time subscriptions)
- **ETL:** TypeScript scripts (nightly cron)
