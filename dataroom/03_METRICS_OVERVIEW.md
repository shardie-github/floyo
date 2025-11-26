# Metrics Overview - Floyo

**Last Updated:** 2025-01-20  
**Status:** Draft - Founders to fill in real metrics

---

## North Star Metric

**✅ DEFINED:** **Integrations Implemented Per User Per Month**

**Definition:** Average number of integration suggestions that users implement per month.

**Why:** Measures core value delivery - users implementing Floyo's suggestions. Indicates product-market fit, predicts retention, and drives revenue.

**Current Target:** 1+ integration per user per month (to be validated)

---

## User Metrics

### Acquisition

> **TODO:** Fill in real numbers

- **Total Users:** [N]
- **New Users (30d):** [N]
- **Growth Rate:** [N]% month-over-month
- **Signups by Channel:**
  - Organic: [N]%
  - Referral: [N]%
  - Paid: [N]%
  - Other: [N]%

### Activation

> **TODO:** Fill in real numbers

- **Activation Rate:** [N]% (users who discover first integration suggestion)
- **Time to Activation:** [N] days (median)
- **Activation Funnel:**
  - Signup → First pattern discovered: [N]%
  - First pattern → First suggestion viewed: [N]%
  - First suggestion → Integration implemented: [N]%

### Engagement

> **TODO:** Fill in real numbers

- **DAU:** [N] (Daily Active Users)
- **WAU:** [N] (Weekly Active Users)
- **MAU:** [N] (Monthly Active Users)
- **DAU/MAU Ratio:** [N]% (stickiness)

### Retention

> **TODO:** Fill in real numbers

- **Day 1 Retention:** [N]%
- **Day 7 Retention:** [N]%
- **Day 30 Retention:** [N]%
- **Retention Cohorts:** [Link to cohort chart]

---

## Revenue Metrics

### Current Revenue

> **TODO:** Fill in real numbers

- **MRR:** $[N]/month
- **ARR:** $[N]/year
- **Paying Customers:** [N]
- **ARPU:** $[N]/month (Average Revenue Per User)
- **Revenue Growth:** [N]% month-over-month

### Pricing Tiers

- **Free:** [N] users
- **Pro ($29/month):** [N] users
- **Team ($100/month):** [N] users

### Conversion

> **TODO:** Fill in real numbers

- **Free → Pro Conversion:** [N]%
- **Free → Team Conversion:** [N]%
- **Upgrade Rate:** [N]% (monthly)

---

## Unit Economics

> **TODO:** Fill in real numbers

- **CAC (Customer Acquisition Cost):** $[N]
- **LTV (Lifetime Value):** $[N]
- **LTV:CAC Ratio:** [N]:1
- **Payback Period:** [N] months
- **Gross Margin:** [N]%

**Calculation Notes:**
- CAC = Marketing spend / New customers acquired
- LTV = ARPU × Average customer lifetime (months)
- Payback Period = CAC / (ARPU × Gross Margin)

---

## Product Metrics

### Core Value Delivery

> **TODO:** Fill in real numbers

- **Patterns Discovered:** [N] total, [N] per user (avg)
- **Integration Suggestions:** [N] total, [N] per user (avg)
- **Integrations Implemented:** [N] total, [N] per user (avg)
- **Time Saved:** [N] hours total, [N] hours per user (avg)

### Feature Usage

> **TODO:** Fill in real numbers

- **% Users Using Pattern Discovery:** [N]%
- **% Users Using Integration Suggestions:** [N]%
- **% Users Using Analytics:** [N]%
- **% Users Sharing Integrations:** [N]%

---

## Growth Metrics

### Viral Coefficient

> **TODO:** Fill in real numbers

- **Referral Rate:** [N]% (users who refer others)
- **Viral Coefficient:** [N] (average invites per user)
- **Share Rate:** [N]% (users who share integrations)

### Channel Performance

> **TODO:** Fill in real numbers

| Channel | Users | CAC | Conversion Rate | LTV |
|---------|-------|-----|------------------|-----|
| Organic | [N] | $[N] | [N]% | $[N] |
| Referral | [N] | $[N] | [N]% | $[N] |
| Paid | [N] | $[N] | [N]% | $[N] |

---

## Metrics Dashboard Status

**Current State:** ⚠️ Metrics infrastructure exists, dashboard not built yet

**TODO:** Build metrics dashboard at `/frontend/app/admin/metrics/`

See: `/yc/YC_METRICS_CHECKLIST.md` and `/yc/YC_METRICS_DASHBOARD_SKETCH.md`

---

## Data Sources

- **Database:** Supabase PostgreSQL (`users`, `events`, `patterns`, `relationships` tables)
- **Analytics:** PostHog (user behavior tracking)
- **Errors:** Sentry (error tracking)
- **Revenue:** Stripe (if integrated)

---

## How to Get Real Metrics

### SQL Queries

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- Active users (30d)
SELECT COUNT(*) FROM users WHERE last_active_at >= NOW() - INTERVAL '30 days';

-- Paying users
SELECT COUNT(*) FROM users WHERE plan != 'free';

-- MRR (if subscriptions table exists)
SELECT SUM(CASE WHEN plan = 'pro' THEN 29 ELSE 100 END) as mrr
FROM subscriptions WHERE status = 'active' AND plan != 'free';
```

### PostHog Queries

- DAU/WAU/MAU: PostHog dashboard
- Retention: PostHog retention analysis
- Funnel: PostHog funnel analysis

---

**Cross-References:**
- Metrics Checklist: `/yc/YC_METRICS_CHECKLIST.md`
- Metrics Dashboard Sketch: `/yc/YC_METRICS_DASHBOARD_SKETCH.md`
- Gap Analysis: `/yc/YC_GAP_ANALYSIS.md` (Gap 5: Metrics Not Instrumented)

---

**Status:** ⚠️ Framework complete - Requires real data
