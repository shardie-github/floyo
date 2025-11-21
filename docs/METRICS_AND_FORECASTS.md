# Metrics & Forecasts
## Floyo - File Usage Pattern Tracking & Integration Suggestions

**Version:** 1.0  
**Last Updated:** 2025-01-XX

---

## Overview

This document defines key metrics, forecasting models, and success criteria for Floyo. It includes both leading and lagging indicators across acquisition, activation, engagement, retention, and revenue.

---

## North Star Metric

### Definition

**"Weekly Active Users (WAU) who see actionable insights"**

This metric combines:
- **Engagement:** Weekly Active Users (WAU)
- **Value Delivery:** Users who see actionable insights

### Rationale

- Captures both usage and value delivery
- Aligns with product goals (helping users discover tools)
- Actionable (we can influence both components)
- Predictive of long-term success

### Target

- **Month 1:** 50 WAU with insights
- **Month 3:** 200 WAU with insights
- **Month 6:** 1,000 WAU with insights
- **Month 12:** 5,000 WAU with insights

---

## Key Metrics Framework

### Acquisition Metrics

#### Sign-Ups per Week
- **Definition:** Number of new user registrations per week
- **Target:** 50/week (Month 1), 200/week (Month 6)
- **Forecast:** Linear growth with marketing campaigns
- **Tracking:** Supabase Auth events

#### Conversion Rate (Visitor → Signup)
- **Definition:** % of website visitors who sign up
- **Target:** 2-5% (industry average: 2-3%)
- **Forecast:** Improve with better landing page
- **Tracking:** PostHog analytics

#### Cost per Acquisition (CPA)
- **Definition:** Marketing spend / new sign-ups
- **Target:** < $15 (organic), < $50 (paid)
- **Forecast:** Decrease as brand awareness grows
- **Tracking:** Marketing spend tracking

#### Traffic Sources
- **Definition:** Breakdown of traffic by source
- **Target:** 60% organic, 30% direct, 10% paid
- **Forecast:** Shift to organic over time
- **Tracking:** UTM parameters, PostHog

---

### Activation Metrics

#### Onboarding Completion Rate
- **Definition:** % of sign-ups who complete onboarding
- **Target:** 40% (Month 1), 60% (Month 6)
- **Forecast:** Improve with better onboarding
- **Tracking:** Onboarding funnel events

#### Time to First Value
- **Definition:** Time from signup to first insight
- **Target:** < 48 hours
- **Forecast:** Improve with sample data, faster tracking
- **Tracking:** First insight timestamp

#### First Integration Connection
- **Definition:** % of users who connect first integration
- **Target:** 30% (Month 1), 50% (Month 6)
- **Forecast:** Improve with better recommendations
- **Tracking:** Integration connection events

#### Extension Installation Rate
- **Definition:** % of users who install browser extension
- **Target:** 50% (Month 1), 70% (Month 6)
- **Forecast:** Improve with better onboarding
- **Tracking:** Extension installation events

---

### Engagement Metrics

#### Daily Active Users (DAU)
- **Definition:** Number of unique users per day
- **Target:** 100 (Month 1), 1,000 (Month 6)
- **Forecast:** Exponential growth with retention
- **Tracking:** Daily login events

#### Weekly Active Users (WAU)
- **Definition:** Number of unique users per week
- **Target:** 200 (Month 1), 2,000 (Month 6)
- **Forecast:** Exponential growth with retention
- **Tracking:** Weekly login events

#### Monthly Active Users (MAU)
- **Definition:** Number of unique users per month
- **Target:** 500 (Month 1), 5,000 (Month 6)
- **Forecast:** Exponential growth with retention
- **Tracking:** Monthly login events

#### Average Session Duration
- **Definition:** Average time spent per session
- **Target:** 5 minutes (Month 1), 10 minutes (Month 6)
- **Forecast:** Increase with more features
- **Tracking:** Session duration tracking

#### Patterns Tracked per User
- **Definition:** Average number of patterns per user
- **Target:** 10 (Month 1), 50 (Month 6)
- **Forecast:** Increase with usage
- **Tracking:** Pattern creation events

#### Suggestions Viewed per User
- **Definition:** Average number of suggestions viewed
- **Target:** 5 (Month 1), 20 (Month 6)
- **Forecast:** Increase with better recommendations
- **Tracking:** Suggestion view events

---

### Retention Metrics

#### 7-Day Retention Rate
- **Definition:** % of users who return within 7 days
- **Target:** 30% (Month 1), 40% (Month 6)
- **Forecast:** Improve with better onboarding and value
- **Tracking:** Cohort analysis

#### 30-Day Retention Rate
- **Definition:** % of users who return within 30 days
- **Target:** 20% (Month 1), 30% (Month 6)
- **Forecast:** Improve with engagement features
- **Tracking:** Cohort analysis

#### Monthly Churn Rate
- **Definition:** % of users who churn per month
- **Target:** < 10% (Month 1), < 5% (Month 6)
- **Forecast:** Decrease with product improvements
- **Tracking:** User activity tracking

#### Cohort Retention Curves
- **Definition:** Retention by cohort over time
- **Target:** Improving retention curves
- **Forecast:** Better retention with product maturity
- **Tracking:** Cohort analysis

---

### Revenue Metrics

#### Monthly Recurring Revenue (MRR)
- **Definition:** Recurring revenue per month
- **Target:** $1K (Month 1), $10K (Month 6), $50K (Month 12)
- **Forecast:** Exponential growth with users and conversion
- **Tracking:** Stripe subscriptions

#### Average Revenue Per User (ARPU)
- **Definition:** MRR / MAU
- **Target:** $2 (Month 1), $2.50 (Month 6)
- **Forecast:** Increase with conversion to paid
- **Tracking:** Revenue / users

#### Customer Lifetime Value (LTV)
- **Definition:** Average revenue per customer over lifetime
- **Target:** $120 (12 months), $240 (24 months)
- **Forecast:** Increase with retention
- **Tracking:** Cohort analysis

#### Conversion Rate (Free → Paid)
- **Definition:** % of free users who convert to paid
- **Target:** 5% (Month 1), 15% (Month 6)
- **Forecast:** Improve with better value proposition
- **Tracking:** Subscription events

#### Churn Rate (Paid)
- **Definition:** % of paid users who churn per month
- **Target:** < 5% (Month 1), < 3% (Month 6)
- **Forecast:** Decrease with product improvements
- **Tracking:** Subscription cancellations

---

### Product Quality Metrics

#### Net Promoter Score (NPS)
- **Definition:** Likelihood to recommend (0-10 scale)
- **Target:** > 30 (Month 1), > 50 (Month 6)
- **Forecast:** Improve with product quality
- **Tracking:** NPS surveys

#### Customer Satisfaction (CSAT)
- **Definition:** Satisfaction score (1-5 scale)
- **Target:** > 4.0 (Month 1), > 4.5 (Month 6)
- **Forecast:** Improve with product quality
- **Tracking:** CSAT surveys

#### Feature Adoption Rate
- **Definition:** % of users using each feature
- **Target:** Varies by feature
- **Forecast:** Increase with better UX
- **Tracking:** Feature usage events

#### Error Rate
- **Definition:** % of requests that error
- **Target:** < 1%
- **Forecast:** Decrease with stability improvements
- **Tracking:** Error monitoring (Sentry)

#### Support Ticket Volume
- **Definition:** Number of support tickets per week
- **Target:** < 10/week per 1,000 users
- **Forecast:** Decrease with better UX and docs
- **Tracking:** Support system

---

## Forecasting Models

### User Growth Forecast

**Model:** Exponential growth with retention

**Formula:**
```
MAU(t) = MAU(0) × (1 + growth_rate)^t × retention_rate^t
```

**Assumptions:**
- Month 1: 500 MAU, 20% growth, 20% retention
- Month 6: 5,000 MAU, 15% growth, 30% retention
- Month 12: 25,000 MAU, 10% growth, 35% retention

**Forecast:**
- Month 1: 500 MAU
- Month 3: 1,500 MAU
- Month 6: 5,000 MAU
- Month 12: 25,000 MAU

---

### Revenue Forecast

**Model:** MRR = MAU × Conversion Rate × ARPU

**Assumptions:**
- Month 1: 500 MAU, 5% conversion, $2 ARPU → $50 MRR
- Month 6: 5,000 MAU, 15% conversion, $2.50 ARPU → $1,875 MRR
- Month 12: 25,000 MAU, 20% conversion, $3 ARPU → $15,000 MRR

**Forecast:**
- Month 1: $50 MRR
- Month 3: $300 MRR
- Month 6: $1,875 MRR
- Month 12: $15,000 MRR

**Note:** Conservative forecast. Actual may be higher with enterprise sales.

---

### Unit Economics Forecast

**Assumptions (from unit-economics-cad.csv):**
- COGS per user: $2.50 CAD
- CAC (organic): $4.00 CAD
- CAC (paid): $15.00 CAD
- LTV (Pro 12mo): $290 CAD
- LTV (Pro 24mo): $580 CAD
- Gross margin: 65%

**Forecast:**
- **Payback Period:** 2.5 months (CAC / (ARPU × margin))
- **LTV:CAC Ratio:** 19:1 (Pro tier, 12 months)
- **Gross Margin:** 65% (target)

---

## Dashboard & Reporting

### Executive Dashboard

**Metrics:**
- North Star Metric (WAU with insights)
- MRR trend
- MAU trend
- Conversion rate
- NPS score

**Frequency:** Weekly

---

### Product Dashboard

**Metrics:**
- Activation funnel
- Engagement metrics
- Retention curves
- Feature adoption
- Error rates

**Frequency:** Daily

---

### Growth Dashboard

**Metrics:**
- Sign-ups by source
- Conversion rates
- CAC by channel
- LTV by cohort
- Churn analysis

**Frequency:** Weekly

---

## Instrumentation Plan

### Phase 1: Core Metrics (Weeks 1-4)

**Tracking:**
- Sign-ups
- Onboarding completion
- First value
- Daily/weekly active users
- Basic revenue metrics

**Tools:**
- PostHog (analytics)
- Supabase (events)
- Stripe (revenue)

---

### Phase 2: Advanced Metrics (Weeks 5-8)

**Tracking:**
- Retention cohorts
- Feature adoption
- User journeys
- Conversion funnels
- NPS/CSAT

**Tools:**
- PostHog (advanced analytics)
- Custom dashboards
- Survey tools

---

### Phase 3: Predictive Metrics (Weeks 9-12)

**Tracking:**
- Predictive churn
- LTV forecasting
- Cohort analysis
- A/B test results
- Advanced segmentation

**Tools:**
- PostHog (predictive analytics)
- Custom ML models
- Data warehouse

---

## Success Criteria

### Month 1 Success Criteria

- ✅ 500 MAU
- ✅ 40% activation rate
- ✅ 30% 7-day retention
- ✅ $50 MRR
- ✅ NPS > 30

### Month 3 Success Criteria

- ✅ 1,500 MAU
- ✅ 50% activation rate
- ✅ 25% 30-day retention
- ✅ $300 MRR
- ✅ NPS > 40

### Month 6 Success Criteria

- ✅ 5,000 MAU
- ✅ 60% activation rate
- ✅ 30% 30-day retention
- ✅ $1,875 MRR
- ✅ NPS > 50

### Month 12 Success Criteria

- ✅ 25,000 MAU
- ✅ 70% activation rate
- ✅ 35% 30-day retention
- ✅ $15,000 MRR
- ✅ NPS > 60

---

## Appendix

### Related Documents

- [PRD](./PRD.md)
- [Roadmap](./ROADMAP.md)
- [Risks & Guardrails](./RISKS_AND_GUARDRAILS.md)

### Data Sources

- PostHog: User analytics
- Supabase: Database events
- Stripe: Revenue data
- Sentry: Error tracking
- Custom: Internal metrics

---

**Document Owner:** Product Team  
**Review Cycle:** Weekly  
**Next Review:** [Date]
