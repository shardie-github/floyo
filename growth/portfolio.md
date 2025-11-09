# Growth Experiment Portfolio

**Last Updated:** 2025-01-15  
**Portfolio Owner:** Growth Experiment Agent  
**Status:** Active Planning

---

## Overview

This portfolio contains prioritized growth experiments designed to improve key financial metrics: CAC, LTV, refund rate, and revenue growth. Experiments are scored on Impact × Confidence ÷ Effort.

---

## Prioritized Experiments

### 1. 🎯 Optimize Meta Ads Targeting (High Priority)
**Slug:** `meta-ads-targeting-optimization`  
**Impact:** High | **Confidence:** Medium | **Effort:** Medium  
**Score:** 8.0

**Objective:** Reduce CAC by improving ad targeting precision and conversion rates.

**Hypothesis:** By refining Meta Ads audience targeting using lookalike audiences and interest-based segments, we can improve conversion rates by 20% and reduce CAC from $50 to $40.

**Key Metrics:**
- CAC (target: <$40)
- Conversion rate (target: +20%)
- LTV:CAC ratio (target: >7.5:1)

**Financial Impact:** 
- Estimated CAC reduction: $10 per customer
- At 1000 customers/month: $10K monthly savings
- Annual impact: $120K

**Status:** Ready to launch  
**Next Steps:** Create experiment plan, set up tracking

---

### 2. 🎯 Implement Post-Purchase Upsell Flow
**Slug:** `post-purchase-upsell`  
**Impact:** High | **Confidence:** High | **Effort:** Low  
**Score:** 9.0

**Objective:** Increase LTV by capturing additional revenue immediately after purchase.

**Hypothesis:** By presenting a relevant upsell offer within 24 hours of purchase, we can increase average order value by 15% and improve LTV from $300 to $345.

**Key Metrics:**
- Average order value (target: +15%)
- LTV (target: $345)
- Upsell conversion rate (target: >10%)

**Financial Impact:**
- Estimated LTV increase: $45 per customer
- At 1000 customers/month: $45K monthly additional revenue
- Annual impact: $540K

**Status:** Ready to launch  
**Next Steps:** Create experiment plan, build upsell flow

---

### 3. 🎯 Reduce Refund Rate via Onboarding Improvement
**Slug:** `onboarding-refund-reduction`  
**Impact:** Medium | **Confidence:** High | **Effort:** Medium  
**Score:** 6.0

**Objective:** Reduce refund rate from 5% to 3% by improving customer onboarding experience.

**Hypothesis:** By implementing an interactive onboarding flow with clear value demonstration, we can reduce refund rate by 40% (from 5% to 3%), improving net revenue.

**Key Metrics:**
- Refund rate (target: <3%)
- Day 7 activation rate (target: +25%)
- Customer satisfaction score (target: >4.5/5)

**Financial Impact:**
- Estimated refund reduction: 2% of revenue
- At $100K monthly revenue: $2K monthly savings
- Annual impact: $24K

**Status:** Ready to launch  
**Next Steps:** Create experiment plan, design onboarding flow

---

### 4. 🎯 TikTok Ads Channel Expansion
**Slug:** `tiktok-ads-expansion`  
**Impact:** Medium | **Confidence:** Medium | **Effort:** High  
**Score:** 4.5

**Objective:** Diversify acquisition channels and test TikTok Ads for lower CAC.

**Hypothesis:** By launching TikTok Ads campaigns with creative video content, we can achieve CAC <$45 and scale to 20% of total acquisition volume.

**Key Metrics:**
- TikTok CAC (target: <$45)
- TikTok conversion rate (target: >2%)
- TikTok share of new customers (target: 20%)

**Financial Impact:**
- Estimated CAC: $45 (vs. $50 average)
- At 200 customers/month from TikTok: $1K monthly savings
- Annual impact: $12K + diversification benefit

**Status:** Planning  
**Next Steps:** Create experiment plan, develop creative assets

---

### 5. 🎯 Referral Program Launch
**Slug:** `referral-program-launch`  
**Impact:** Medium | **Confidence:** Medium | **Effort:** High  
**Score:** 4.0

**Objective:** Reduce CAC by incentivizing customer referrals.

**Hypothesis:** By launching a referral program with $20 credit for referrer and referee, we can achieve referral CAC of $30 and drive 15% of new customers through referrals.

**Key Metrics:**
- Referral CAC (target: <$30)
- Referral conversion rate (target: >5%)
- Referral share of new customers (target: 15%)

**Financial Impact:**
- Estimated referral CAC: $30 (vs. $50 average)
- At 150 customers/month from referrals: $3K monthly savings
- Annual impact: $36K

**Status:** Planning  
**Next Steps:** Create experiment plan, build referral system

---

## Experiment Scoring Methodology

**Formula:** Impact × Confidence ÷ Effort

- **Impact:** 1-10 scale (financial + strategic impact)
- **Confidence:** 0.5-1.0 scale (data availability, past experience)
- **Effort:** 1-10 scale (time, resources, complexity)

**Scoring Ranges:**
- 8.0+: High priority, launch immediately
- 5.0-7.9: Medium priority, plan for next quarter
- <5.0: Low priority, revisit later

---

## Experiment Status Tracking

| Experiment | Status | Start Date | End Date | Sample Size | Results |
|------------|--------|------------|----------|-------------|---------|
| meta-ads-targeting-optimization | Ready | TBD | TBD | 5000 | - |
| post-purchase-upsell | Ready | TBD | TBD | 2000 | - |
| onboarding-refund-reduction | Ready | TBD | TBD | 3000 | - |
| tiktok-ads-expansion | Planning | TBD | TBD | 2000 | - |
| referral-program-launch | Planning | TBD | TBD | 1000 | - |

---

## Success Criteria

### Overall Portfolio Goals (30 days)
- Reduce average CAC by 15% (from $50 to $42.50)
- Increase LTV by 10% (from $300 to $330)
- Reduce refund rate by 20% (from 5% to 4%)
- Achieve LTV:CAC ratio >7.5:1

### Overall Portfolio Goals (90 days)
- Reduce average CAC by 25% (from $50 to $37.50)
- Increase LTV by 20% (from $300 to $360)
- Reduce refund rate by 40% (from 5% to 3%)
- Achieve LTV:CAC ratio >9:1

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Experiment fails to meet success threshold | Medium | Medium | Run smaller tests first, iterate quickly |
| Experiment negatively impacts other metrics | Low | High | Monitor all KPIs, set up rollback plan |
| Insufficient sample size | Low | Medium | Use statistical power calculator, extend test duration |
| External factors (seasonality, competition) | Medium | Medium | Control for seasonality, monitor competitive landscape |

---

## Next Steps

1. ✅ Portfolio prioritized (this document)
2. ⏭️ Create detailed experiment plans (`/growth/experiments/<slug>/plan.md`)
3. ⏭️ Set up feature flags (`/featureflags/flags.json`)
4. ⏭️ Implement tracking for experiment metrics
5. ⏭️ Launch first experiment (meta-ads-targeting-optimization)

---

**Portfolio Owner:** Growth Experiment Agent  
**Review Frequency:** Weekly  
**Last Review:** 2025-01-15
