> Archived on 2025-11-12. Superseded by: (see docs/final index)

# KPIs and Dashboard Spec — floyo

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready

---

## Overview

Key Performance Indicators (KPIs) and dashboard specification for floyo telemetry and analytics.

**Minimal KPIs:** Focus on actionable metrics for solo operator, side-gig operation.

---

## Core KPIs

### 1. User Acquisition

**WAU (Weekly Active Users):**
- **Definition:** Unique users who used floyo in the past 7 days
- **Target:** 100+ (30 days), 500+ (90 days)
- **Dashboard:** Line chart (7-day rolling)

**DAU (Daily Active Users):**
- **Definition:** Unique users who used floyo in the past 24 hours
- **Target:** 20% of WAU (target)
- **Dashboard:** Line chart (daily)

**New Users:**
- **Definition:** Users who created accounts in the past 7 days
- **Target:** 20+ new users/week (30 days), 50+ new users/week (90 days)
- **Dashboard:** Bar chart (weekly)

---

### 2. Activation

**Activation Rate:**
- **Definition:** % of users who complete first workflow
- **Target:** ≥40% (30 days), ≥50% (90 days)
- **Dashboard:** Percentage, trend chart

**Time to First Workflow:**
- **Definition:** Average time from signup to first workflow (hours)
- **Target:** <24 hours (target)
- **Dashboard:** Histogram, average

**Pattern Detection Rate:**
- **Definition:** % of users who see at least one pattern
- **Target:** ≥60% (target)
- **Dashboard:** Percentage, trend chart

---

### 3. Retention

**7-Day Retention:**
- **Definition:** % of users active 7 days after signup
- **Target:** ≥25% (30 days), ≥30% (90 days)
- **Dashboard:** Cohort table, line chart

**30-Day Retention:**
- **Definition:** % of users active 30 days after signup
- **Target:** ≥15% (target)
- **Dashboard:** Cohort table, line chart

**Churn Rate:**
- **Definition:** % of users who churned in the past 30 days
- **Target:** <5% monthly churn (target)
- **Dashboard:** Percentage, trend chart

---

### 4. Revenue

**ARR (Annual Recurring Revenue):**
- **Definition:** Monthly recurring revenue × 12
- **Target:** $540K CAD (Year 1, 3K users)
- **Dashboard:** Line chart (monthly)

**ARPU (Average Revenue Per User):**
- **Definition:** Total revenue / active users (monthly)
- **Target:** $15 CAD/month (target)
- **Dashboard:** Line chart (monthly)

**CAC (Customer Acquisition Cost):**
- **Definition:** Marketing spend / new customers
- **Target:** <$5 CAD (target, organic)
- **Dashboard:** Line chart (monthly)

**LTV (Lifetime Value):**
- **Definition:** ARPU × average customer lifetime (months)
- **Target:** >$100 CAD (target, 12-month retention)
- **Dashboard:** Line chart (monthly)

**Payback Period:**
- **Definition:** CAC / (ARPU × gross margin) (months)
- **Target:** <3 months (target)
- **Dashboard:** Line chart (monthly)

---

### 5. Engagement

**Workflows Created:**
- **Definition:** Total workflows created (per user, per week)
- **Target:** ≥2 workflows/user (30 days)
- **Dashboard:** Histogram, average

**Suggestions Approved:**
- **Definition:** % of integration suggestions approved
- **Target:** ≥1 approval/user (30 days)
- **Dashboard:** Percentage, trend chart

**Pattern Detection Accuracy:**
- **Definition:** % of patterns that lead to workflow creation
- **Target:** ≥40% (target)
- **Dashboard:** Percentage, trend chart

---

## Dashboard Specification

### Dashboard Layout

**Header:**
- Date range selector (7 days, 30 days, 90 days, custom)
- Export button (CSV, PDF)

**Section 1: Overview**
- WAU (current, trend)
- DAU (current, trend)
- Activation Rate (current, trend)
- 7-Day Retention (current, trend)

**Section 2: Acquisition**
- New Users (weekly)
- CAC (monthly)
- Acquisition Channels (pie chart)

**Section 3: Engagement**
- Workflows Created (per user, weekly)
- Suggestions Approved (per user, weekly)
- Pattern Detection Rate (percentage, trend)

**Section 4: Revenue**
- ARR (monthly)
- ARPU (monthly)
- LTV (monthly)
- Payback Period (monthly)

**Section 5: Retention**
- 7-Day Retention (cohort table)
- 30-Day Retention (cohort table)
- Churn Rate (percentage, trend)

---

## Event Logging Schema

### Minimal Event Schema

**Event Types:**
- `user_signup` (user_id, timestamp, source)
- `user_activated` (user_id, timestamp, time_to_activation)
- `pattern_detected` (user_id, timestamp, pattern_type, confidence)
- `suggestion_shown` (user_id, timestamp, suggestion_type)
- `suggestion_approved` (user_id, timestamp, suggestion_type)
- `workflow_created` (user_id, timestamp, workflow_type)
- `workflow_executed` (user_id, timestamp, workflow_id, success)
- `subscription_started` (user_id, timestamp, tier, amount_cad)
- `subscription_cancelled` (user_id, timestamp, tier)

**Event Table Schema:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id UUID,
  event_type VARCHAR(50),
  timestamp TIMESTAMP,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp);
```

---

## Dashboard Wireframe

### Layout (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│ floyo Dashboard                    [Date Range] [Export] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Overview Metrics                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ WAU      │ │ DAU      │ │ Activate │ │ 7d Ret. │    │
│  │ 150      │ │ 30       │ │ 45%      │ │ 28%     │    │
│  │ ↑ 12%    │ │ ↑ 5%     │ │ ↑ 3%     │ │ ↑ 2%    │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  Acquisition                                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │ New Users (Weekly)                                 │ │
│  │ [Bar Chart]                                        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  Engagement                                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Workflows Created (per user)                      │ │
│  │ [Line Chart]                                      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  Revenue                                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ARR, ARPU, LTV, Payback Period                    │ │
│  │ [Line Charts]                                      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  Retention                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Cohort Analysis (7-day, 30-day)                    │ │
│  │ [Cohort Table]                                     │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### Data Collection
- **Telemetry:** Opt-in only (consent-gated)
- **Privacy:** Anonymized data (no PII in events)
- **Retention:** 12 months (if opt-in)

### Dashboard Tools
- **Option 1:** Custom dashboard (React, D3.js)
- **Option 2:** Supabase Dashboard (built-in analytics)
- **Option 3:** Metabase (open-source BI tool)

### Reporting
- **Frequency:** Weekly (internal), Monthly (external)
- **Format:** CSV export, PDF reports
- **Automation:** Automated weekly reports (email)

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready
