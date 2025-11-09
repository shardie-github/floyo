# Growth Experiment Portfolio

**Last Updated:** 2025-01-XX  
**Portfolio Size:** 5 prioritized experiments  
**Focus Areas:** CAC reduction, LTV improvement, Churn reduction

---

## Portfolio Overview

This portfolio contains 3-5 prioritized growth experiments aligned with financial model sensitivities. Each experiment is designed to move key metrics (CAC, LTV, Churn, Refund Rate) toward Optimistic scenario targets.

### Experiment Prioritization Framework

**Scoring:** Impact × Confidence ÷ Effort

- **Impact:** Expected change in target metric (1-10 scale)
- **Confidence:** Likelihood of success based on data/benchmarks (0.1-1.0 scale)
- **Effort:** Engineering/design time required (1-10 scale, higher = more effort)

**Priority Order:** Highest score first

---

## Experiment 1: Onboarding Flow Optimization

**Status:** Ready to Launch  
**Priority Score:** 8.4 (Impact: 8, Confidence: 0.7, Effort: 6.7)  
**Target Metric:** CAC reduction via improved conversion rates  
**Financial Impact:** Reduce CAC by 15-20% → Move toward Optimistic scenario ($120 → $100)

**Hypothesis:**  
Simplifying the onboarding flow and reducing friction will increase signup-to-paid conversion by 25%, reducing effective CAC without changing ad spend.

**Success Criteria:**
- Conversion rate increases from 2.5% to 3.1% (25% improvement)
- CAC decreases from $150 to $120 (20% reduction)
- Statistical significance: p < 0.05 with 95% confidence

**Sample Size:** 2,000 visitors per variant (4,000 total)  
**Duration:** 2 weeks  
**Rollout Plan:** 50/50 split → Winner takes 100%  
**Rollback Plan:** Revert to original if conversion drops >10%

**Dependencies:**
- Feature flag: `onboarding_v2`
- Analytics: Track conversion funnel events
- A/B testing framework

**30-Day Signal:** Conversion rate improvement visible within 7 days

---

## Experiment 2: Referral Program Launch

**Status:** Ready to Launch  
**Priority Score:** 7.8 (Impact: 9, Confidence: 0.6, Effort: 6.9)  
**Target Metric:** CAC reduction via organic acquisition  
**Financial Impact:** 20% of new customers from referrals → Reduce blended CAC by 15%

**Hypothesis:**  
A referral program offering $25 credit to referrer and referee will generate 20% of new customers organically, reducing blended CAC and improving LTV (referrals have higher retention).

**Success Criteria:**
- 20% of new customers from referrals within 30 days
- Blended CAC decreases from $150 to $127.50 (15% reduction)
- Referral customers have 10% higher retention than paid

**Sample Size:** Full rollout (no A/B test needed)  
**Duration:** 30 days to measure, then ongoing  
**Rollout Plan:** 100% rollout with monitoring  
**Rollback Plan:** Pause program if abuse detected or ROI negative

**Dependencies:**
- Referral tracking system
- Credit/payment system for rewards
- Email automation for referral invites

**30-Day Signal:** Referral signups > 5% of total signups

---

## Experiment 3: Email Win-Back Campaign

**Status:** Ready to Launch  
**Priority Score:** 7.2 (Impact: 7, Confidence: 0.8, Effort: 7.8)  
**Target Metric:** Churn reduction  
**Financial Impact:** Reduce churn from 5% to 4% monthly → Improve LTV from $600 to $750

**Hypothesis:**  
Targeted email campaigns to at-risk customers (inactive for 14+ days) with personalized offers will reduce monthly churn by 20% (5% → 4%).

**Success Criteria:**
- Monthly churn rate decreases from 5% to 4%
- Win-back rate: 15% of at-risk customers reactivate
- LTV increases from $600 to $750 (25% improvement)

**Sample Size:** All at-risk customers (typically 10-15% of base)  
**Duration:** 30 days to measure impact  
**Rollout Plan:** Phased: 25% → 50% → 100% over 2 weeks  
**Rollback Plan:** Pause if unsubscribe rate increases >2x

**Dependencies:**
- Customer segmentation (at-risk identification)
- Email automation platform
- Personalization engine

**30-Day Signal:** Churn rate decreases by 0.5% in first 2 weeks

---

## Experiment 4: Upsell Flow Optimization

**Status:** Ready to Launch  
**Priority Score:** 6.9 (Impact: 8, Confidence: 0.6, Effort: 6.9)  
**Target Metric:** LTV improvement via expansion revenue  
**Financial Impact:** Increase ARPU by 20% → Improve LTV from $600 to $720

**Hypothesis:**  
In-app upsell prompts at optimal moments (after key feature usage) will increase upgrade rate from 5% to 8%, boosting ARPU and LTV.

**Success Criteria:**
- Upgrade rate increases from 5% to 8% (60% improvement)
- ARPU increases by 20%
- LTV increases from $600 to $720
- No increase in churn from upgrade pressure

**Sample Size:** 1,000 active users per variant (2,000 total)  
**Duration:** 3 weeks  
**Rollout Plan:** 50/50 split → Winner takes 100%  
**Rollback Plan:** Revert if churn increases >10% or complaints spike

**Dependencies:**
- Feature flag: `upsell_v2`
- Usage analytics (feature adoption tracking)
- Payment system for upgrades

**30-Day Signal:** Upgrade rate increases within 10 days

---

## Experiment 5: Refund Prevention Flow

**Status:** Ready to Launch  
**Priority Score:** 6.5 (Impact: 6, Confidence: 0.7, Effort: 6.5)  
**Target Metric:** Refund rate reduction  
**Financial Impact:** Reduce refund rate from 2% to 1.5% → Improve net revenue by 0.5%

**Hypothesis:**  
Proactive customer success outreach and self-service refund prevention tools will reduce refund rate from 2% to 1.5% by addressing issues before refund requests.

**Success Criteria:**
- Refund rate decreases from 2% to 1.5% (25% reduction)
- Customer satisfaction (CSAT) increases
- Net revenue improves by 0.5% (refund savings)

**Sample Size:** All customers (full rollout)  
**Duration:** 30 days to measure  
**Rollout Plan:** 100% rollout with monitoring  
**Rollback Plan:** Pause if customer complaints increase

**Dependencies:**
- Customer success automation
- Refund request tracking
- Self-service help center

**30-Day Signal:** Refund rate decreases by 0.2% in first 2 weeks

---

## Portfolio Metrics

### Expected Aggregate Impact (if all experiments succeed)

| Metric | Current (Base) | Target (Optimistic) | Improvement |
|--------|----------------|---------------------|-------------|
| CAC | $150 | $100 | -33% |
| LTV | $600 | $800 | +33% |
| LTV:CAC | 4.0 | 8.0 | +100% |
| Churn Rate | 5% | 3% | -40% |
| Refund Rate | 2% | 1% | -50% |

### Risk Assessment

**High Risk:** None (all experiments have rollback plans)  
**Medium Risk:** Referral Program (abuse potential), Upsell Flow (churn risk)  
**Low Risk:** Onboarding, Email Win-Back, Refund Prevention

### Resource Requirements

- **Engineering:** 2 engineers × 2 weeks
- **Design:** 1 designer × 1 week
- **Analytics:** 0.5 analyst × ongoing
- **Total Effort:** ~6 engineer-weeks

---

## Next Steps

1. **Week 1:** Launch Experiments 1 & 2 (Onboarding, Referral)
2. **Week 2:** Launch Experiment 3 (Email Win-Back)
3. **Week 3:** Launch Experiments 4 & 5 (Upsell, Refund Prevention)
4. **Week 4:** Review results, iterate on winners
5. **Ongoing:** Monitor metrics, plan next portfolio

---

## Experiment Tracking

Each experiment has a detailed plan in `/growth/experiments/<slug>/plan.md`:
- `onboarding-v2`
- `referral-program`
- `email-winback`
- `upsell-optimization`
- `refund-prevention`
