# Growth Experiment Portfolio

**Date:** 2025-01-27  
**Status:** Active  
**Target:** 3-5 prioritized experiments running concurrently

---

## Experiment Priority Matrix

| Experiment | Impact | Confidence | Effort | Score | Status |
|-----------|--------|-----------|--------|-------|--------|
| **Activation Funnel** | 10 | 9 | 3 | 270 | Active |
| **Referral Program** | 8 | 7 | 5 | 280 | Active |
| **Retention Emails** | 9 | 8 | 2 | 144 | Active |
| **Pricing Test** | 7 | 6 | 4 | 168 | Planned |
| **Onboarding Video** | 6 | 7 | 3 | 126 | Planned |

**Score = Impact × Confidence ÷ Effort**

---

## Active Experiments

### 1. Activation Funnel (P0)
**Hypothesis:** Guided onboarding increases activation rate from 0% to 40%  
**Metrics:** Activation rate (first workflow created)  
**Sample Size:** 100 signups  
**Duration:** 2 weeks  
**Status:** Active  
**Owner:** Product Lead

### 2. Referral Program (P1)
**Hypothesis:** Referral program drives 10% of signups with <$10 CAC  
**Metrics:** Referral rate, referral CAC, referral retention  
**Sample Size:** 50 referrals  
**Duration:** 4 weeks  
**Status:** Active  
**Owner:** Growth Lead

### 3. Retention Emails (P1)
**Hypothesis:** D1/D7/D30 emails increase retention by 10 percentage points  
**Metrics:** D1/D7/D30 retention, email open rate, click-through rate  
**Sample Size:** 200 users  
**Duration:** 4 weeks  
**Status:** Active  
**Owner:** Growth Lead

---

## Planned Experiments

### 4. Pricing Test (P2)
**Hypothesis:** $39/mo pricing increases conversion by 20% vs $49/mo  
**Metrics:** Conversion rate, ARPU, LTV  
**Sample Size:** 200 signups  
**Duration:** 4 weeks  
**Status:** Planned  
**Owner:** Growth Lead

### 5. Onboarding Video (P2)
**Hypothesis:** Video tutorial increases activation rate by 15 percentage points  
**Metrics:** Activation rate, time to first workflow  
**Sample Size:** 150 signups  
**Duration:** 3 weeks  
**Status:** Planned  
**Owner:** Product Lead

---

## Experiment Framework

**Tools:**
- Feature flags: `/featureflags/flags.json` + `/middleware/flags.ts`
- Database: `experiments` and `experiment_arms` tables
- Analytics: PostHog/Mixpanel for event tracking

**Process:**
1. Define hypothesis + metrics
2. Set sample size (power analysis)
3. Create feature flag
4. Roll out to 10% → 50% → 100%
5. Monitor metrics daily
6. Rollback if negative impact
7. Document learnings

---

## Success Criteria

**Activation Funnel:** Activation rate >40% (vs 0% baseline)  
**Referral Program:** Referral rate >10%, referral CAC <$10  
**Retention Emails:** D7 retention >25% (vs 15% baseline)  
**Pricing Test:** Conversion rate +20% (vs baseline)  
**Onboarding Video:** Activation rate +15pp (vs baseline)

---

## Next Steps

1. **Week 1:** Launch activation funnel experiment
2. **Week 2:** Launch referral program experiment
3. **Week 3:** Launch retention emails experiment
4. **Week 4:** Review results, iterate, plan next batch
