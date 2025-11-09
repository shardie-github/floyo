# Experiment Plan: Onboarding Refund Reduction

**Slug:** `onboarding-refund-reduction`  
**Status:** Ready to Launch  
**Created:** 2025-01-15  
**Owner:** Growth Team

---

## Hypothesis

By implementing an interactive onboarding flow with clear value demonstration, we can reduce refund rate by 40% (from 5% to 3%), improving net revenue.

---

## Objective

Reduce refund rate from 5% to 3% by improving customer onboarding experience and early value realization.

---

## Metrics

### Primary Metrics
- **Refund Rate**
  - Baseline: 5%
  - Target: 3% (-40%)
  - Success Threshold: 3.5% (-30%)

- **Net Revenue Impact**
  - Baseline: 95% of gross revenue
  - Target: 97% of gross revenue
  - Success Threshold: 96.5% of gross revenue

### Secondary Metrics
- **Day 7 Activation Rate**
  - Baseline: 60%
  - Target: 75% (+25%)
  - Success Threshold: 70% (+17%)

- **Time to First Value**
  - Baseline: 48 hours
  - Target: 24 hours (-50%)
  - Success Threshold: 36 hours (-25%)

- **Customer Satisfaction (Day 7)**
  - Baseline: 4.0/5
  - Target: 4.5/5 (+12.5%)
  - Success Threshold: 4.3/5 (+7.5%)

### Guardrail Metrics
- **Sign-up Conversion Rate** (must not decrease)
  - Baseline: 25%
  - Min Allowed: 23%

- **Day 1 Engagement** (must not decrease)
  - Baseline: 70%
  - Min Allowed: 65%

---

## Success Threshold

**Primary:** Refund rate < 3.5% (-30%)  
**Secondary:** Day 7 activation rate > 70% (+17%)  
**Guardrails:** Sign-up conversion > 23%, Day 1 engagement > 65%

**Decision Rule:** If primary metric meets threshold AND guardrails pass, roll out to 100%. Otherwise, iterate on onboarding flow or rollback.

---

## Sample Size Heuristic

**Statistical Power:** 80%  
**Significance Level:** 5% (α = 0.05)  
**Minimum Detectable Effect:** 30% refund rate reduction

**Calculation:**
- Baseline refund rate: 5%
- Target refund rate: 3.5%
- Required sample size per variant: ~1500 customers
- Total sample size: 3000 customers (1500 control + 1500 test)

**Duration Estimate:**
- At 100 customers/day: 30 days
- At 200 customers/day: 15 days
- Recommended: 21 days minimum

---

## Rollout Plan

### Phase 1: Test (Week 1-3)
- **Traffic Split:** 50% control (current onboarding), 50% test (new onboarding)
- **Duration:** 21 days or until 3000 customers reached
- **Monitoring:** Daily review of metrics

### Phase 2: Scale (Week 4)
- **If successful:** Scale test variant to 100% of traffic
- **If inconclusive:** Extend test for 7 more days
- **If failed:** Rollback to control, analyze learnings

### Phase 3: Optimize (Week 5+)
- **If scaled:** A/B test different onboarding steps
- **Monitor:** Weekly review for 4 weeks post-launch

---

## Rollback Plan

### Automatic Rollback Triggers
- Sign-up conversion rate < 23% for 3 consecutive days
- Day 1 engagement < 65% for 3 consecutive days
- Refund rate > 6% (worse than baseline) for 3 consecutive days

### Manual Rollback Process
1. Disable new onboarding flow via feature flag
2. Revert to previous onboarding experience
3. Document learnings and failure reasons
4. Update experiment status to "Rolled Back"
5. Notify stakeholders via Slack

**Rollback Time:** < 1 hour

---

## Implementation Details

### New Onboarding Flow
- **Step 1:** Welcome video (2 minutes) explaining core value
- **Step 2:** Interactive product tour with tooltips
- **Step 3:** First task completion (guided)
- **Step 4:** Success celebration + next steps
- **Step 5:** Email sequence (Days 1, 3, 7) with tips and resources

### Control Variant Configuration
- Current onboarding flow (no changes)

### Tracking Setup
- **Event Tracking:** `onboarding_started`, `onboarding_step_completed`, `onboarding_completed`, `first_value_achieved`
- **UTM Parameters:** `utm_source=onboarding&utm_campaign=refund_reduction_test`
- **Supabase Events:** User events tagged with experiment ID and onboarding variant

---

## Dependencies

- Onboarding flow builder (or custom implementation)
- Email service (SendGrid/Mailchimp/etc.)
- Analytics tracking (Supabase events)
- Feature flag: `onboarding_refund_reduction` (enabled for test variant)

---

## Timeline

| Phase | Start Date | End Date | Duration |
|-------|------------|----------|----------|
| Setup | TBD | TBD | 5 days |
| Test | TBD | TBD | 21 days |
| Analysis | TBD | TBD | 3 days |
| Scale/Rollback | TBD | TBD | 1 day |

**Total Duration:** ~30 days

---

## Resources Required

- **Design:** Onboarding flow UI/UX, email templates
- **Engineering:** Onboarding flow implementation, tracking setup
- **Content:** Welcome video script, onboarding copy
- **Product:** First task definition and guidance

---

## Communication Plan

### Stakeholders
- Growth Team (daily updates)
- Product Team (weekly summary)
- Customer Success Team (final results)

### Updates
- **Daily:** Slack channel #growth-experiments
- **Weekly:** Email summary with metrics
- **Final:** Presentation with results and recommendations

---

## Learnings & Documentation

**Post-Experiment:**
- Document which onboarding steps drive activation
- Analyze customer segments that benefit most
- Update onboarding best practices
- Share learnings with team

---

## Related Experiments

- Post-Purchase Upsell (complements LTV improvement)
- Meta Ads Targeting Optimization (improves overall unit economics)

---

**Experiment Owner:** Growth Team  
**Last Updated:** 2025-01-15
