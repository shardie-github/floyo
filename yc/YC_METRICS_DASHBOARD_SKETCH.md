# YC Metrics Dashboard Sketch - Floyo

**Last Updated:** 2025-01-20  
**Purpose:** Describe what a basic metrics dashboard should show for YC prep

---

## Dashboard Overview

**Purpose:** Give founders instant visibility into key metrics for YC interview prep.

**Access:** Admin-only dashboard at `/admin/metrics` (or `/yc/metrics` for YC prep)

**Update Frequency:** Real-time (refreshes every 5 minutes)

---

## Key Charts and Numbers

### 1. North Star Metric (Top of Dashboard)

**Metric:** [TODO: Founders to define]
- Suggested: "Integrations Implemented This Month"
- Alternative: "Time Saved This Month (hours)"

**Display:**
```
┌─────────────────────────────────────┐
│  🎯 NORTH STAR METRIC                │
│                                      │
│  1,247 integrations implemented     │
│  +23% vs last month                 │
│                                      │
│  [Trend chart: Last 30 days]        │
└─────────────────────────────────────┘
```

---

### 2. Usage Metrics (Top Row)

**DAU / WAU / MAU:**
```
┌──────────┬──────────┬──────────┐
│   DAU    │   WAU    │   MAU    │
│   1,234  │   4,567  │  12,345  │
│  +12%    │  +8%     │  +5%     │
│  [Chart] │  [Chart] │  [Chart] │
└──────────┴──────────┴──────────┘
```

**Activation Rate:**
```
┌─────────────────────────────────────┐
│  Activation Rate: 45%               │
│  (45% of signups activate within 7d)│
│                                      │
│  [Trend chart: Last 30 days]        │
└─────────────────────────────────────┘
```

**Retention Rate:**
```
┌─────────────────────────────────────┐
│  7-Day Retention: 62%              │
│  30-Day Retention: 45%              │
│                                      │
│  [Cohort table: Last 6 months]      │
└─────────────────────────────────────┘
```

---

### 3. Growth Metrics (Second Row)

**Signups:**
```
┌─────────────────────────────────────┐
│  Signups This Month: 1,234         │
│  +15% vs last month                │
│                                      │
│  [Trend chart: Daily signups]        │
└─────────────────────────────────────┘
```

**Acquisition Channels:**
```
┌─────────────────────────────────────┐
│  Top Acquisition Channels           │
│                                      │
│  Product Hunt:    45% (556 users)   │
│  Hacker News:     25% (309 users)   │
│  Twitter/X:       15% (185 users)    │
│  GitHub:          10% (124 users)   │
│  Other:            5% (62 users)    │
│                                      │
│  [Pie chart]                         │
└─────────────────────────────────────┘
```

**Conversion Funnel:**
```
┌─────────────────────────────────────┐
│  Conversion Funnel (Last 30 Days)  │
│                                      │
│  Visitors:       10,000  [100%]     │
│  Signups:         1,234  [12.3%]    │
│  Activated:         556  [45.0%]    │
│  Engaged:           445  [80.0%]    │
│  Retained:          278  [62.5%]    │
│  Paying:             89  [32.0%]    │
│                                      │
│  [Funnel chart]                      │
└─────────────────────────────────────┘
```

---

### 4. Revenue Metrics (Third Row)

**MRR / ARR:**
```
┌──────────┬──────────┐
│   MRR    │   ARR    │
│  $2,581  │ $30,972  │
│  +23%    │  +23%    │
│  [Chart] │  [Chart] │
└──────────┴──────────┘
```

**ARPU:**
```
┌─────────────────────────────────────┐
│  Average Revenue Per User: $29.00   │
│  (Pro: $29, Enterprise: $100 avg)   │
│                                      │
│  [Trend chart: Last 30 days]        │
└─────────────────────────────────────┘
```

**Subscription Breakdown:**
```
┌─────────────────────────────────────┐
│  Subscription Tiers                 │
│                                      │
│  Free:        1,145 users (92.8%)   │
│  Pro:           89 users (7.2%)    │
│  Enterprise:     0 users (0.0%)    │
│                                      │
│  [Pie chart]                         │
└─────────────────────────────────────┘
```

---

### 5. Engagement Metrics (Fourth Row)

**Events per User:**
```
┌─────────────────────────────────────┐
│  Average Events per User: 45/day    │
│  (File opens, script runs, etc.)    │
│                                      │
│  [Trend chart: Last 30 days]        │
└─────────────────────────────────────┘
```

**Suggestions Viewed:**
```
┌─────────────────────────────────────┐
│  Suggestions Viewed: 2.3/user       │
│  Suggestions Implemented: 0.8/user │
│  Implementation Rate: 35%           │
│                                      │
│  [Trend chart: Last 30 days]        │
└─────────────────────────────────────┘
```

---

### 6. Unit Economics (Bottom Row)

**CAC / LTV:**
```
┌──────────┬──────────┬──────────┐
│   CAC    │   LTV    │ LTV:CAC  │
│   $45    │  $348    │   7.7:1  │
│  [Chart] │  [Chart] │  [Chart] │
└──────────┴──────────┴──────────┘
```

**Payback Period:**
```
┌─────────────────────────────────────┐
│  Payback Period: 1.6 months        │
│  (Time to recover CAC)               │
│                                      │
│  [Trend chart: Last 6 months]       │
└─────────────────────────────────────┘
```

**Gross Margin:**
```
┌─────────────────────────────────────┐
│  Gross Margin: 85%                  │
│  (Revenue: $2,581, Costs: $387)      │
│                                      │
│  [Breakdown: Supabase, Vercel, etc.] │
└─────────────────────────────────────┘
```

---

## Quick Stats Summary (Sidebar)

**For YC Interview Prep:**

```
┌─────────────────────────┐
│  QUICK STATS            │
├─────────────────────────┤
│  Total Users:    1,234  │
│  Paid Users:        89   │
│  MRR:            $2,581 │
│  ARR:           $30,972 │
│  Growth Rate:     +23%  │
│  Churn Rate:      2.5%  │
│  Activation:      45%  │
│  Retention (7d):  62%  │
│  CAC:             $45   │
│  LTV:            $348   │
│  LTV:CAC:        7.7:1  │
└─────────────────────────┘
```

---

## Export Functionality

**For YC Interview:**
- **Export to PDF:** One-page summary with all key metrics
- **Export to CSV:** Raw data for analysis
- **Share Link:** Read-only link for YC partners to view

---

## Implementation Notes

**Backend Endpoints Needed:**
- `/api/analytics/dashboard` - Returns all metrics (already exists!)
- `/api/analytics/export` - Export to PDF/CSV

**Frontend Components Needed:**
- Metrics dashboard page (`/admin/metrics`)
- Chart components (use Chart.js or Recharts)
- Export functionality

**Data Sources:**
- `events` table - Usage metrics
- `users` table - Signups, activation
- `subscriptions` table - Revenue metrics
- `utm_tracks` table - Acquisition channels
- `cohorts` table - Retention metrics

---

## TODO: Founders to Complete

> **TODO:** Build the dashboard UI:
> - Create `/admin/metrics` page
> - Add chart components
> - Add export functionality

> **TODO:** Fill in real metrics:
> - Replace placeholder numbers with actual data
> - Verify all calculations are correct
> - Test dashboard with real data

> **TODO:** Define North Star Metric:
> - What's the one metric that matters most?
> - How do you measure product-market fit?

> **TODO:** Set up automated updates:
> - Refresh dashboard every 5 minutes
> - Send daily/weekly metrics email
> - Alert on significant changes

---

**Status:** ✅ Draft Complete - Ready for implementation
