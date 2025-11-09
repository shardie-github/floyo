# Experiment Plan: Post-Purchase Upsell Flow

**Slug:** `post-purchase-upsell`  
**Status:** Ready to Launch  
**Created:** 2025-01-15  
**Owner:** Growth Team

---

## Hypothesis

By presenting a relevant upsell offer within 24 hours of purchase, we can increase average order value by 15% and improve LTV from $300 to $345.

---

## Objective

Increase LTV by capturing additional revenue immediately after purchase, improving unit economics.

---

## Metrics

### Primary Metrics
- **Average Order Value (AOV)**
  - Baseline: $50
  - Target: $57.50 (+15%)
  - Success Threshold: $54 (+8%)

- **LTV** (Lifetime Value)
  - Baseline: $300
  - Target: $345 (+15%)
  - Success Threshold: $324 (+8%)

### Secondary Metrics
- **Upsell Conversion Rate**
  - Baseline: 0% (no upsell flow)
  - Target: >10%
  - Success Threshold: >7%

- **Upsell Revenue per Customer**
  - Baseline: $0
  - Target: $7.50
  - Success Threshold: $4.20

- **LTV:CAC Ratio**
  - Baseline: 6:1
  - Target: 7.5:1
  - Success Threshold: 7:1

### Guardrail Metrics
- **Refund Rate** (must not increase)
  - Baseline: 5%
  - Max Allowed: 5.5%

- **Customer Satisfaction** (must not decrease)
  - Baseline: 4.2/5
  - Min Allowed: 4.0/5

---

## Success Threshold

**Primary:** AOV increase > 8% AND LTV increase > 8%  
**Secondary:** Upsell conversion rate > 7%  
**Guardrails:** Refund rate < 5.5%, Customer satisfaction > 4.0/5

**Decision Rule:** If primary metrics meet threshold AND guardrails pass, roll out to 100%. Otherwise, iterate on offer or rollback.

---

## Sample Size Heuristic

**Statistical Power:** 80%  
**Significance Level:** 5% (α = 0.05)  
**Minimum Detectable Effect:** 8% AOV increase

**Calculation:**
- Baseline AOV: $50
- Target AOV: $54
- Standard deviation (estimated): $15
- Required sample size per variant: ~400 customers
- Total sample size: 800 customers (400 control + 400 test)

**Duration Estimate:**
- At 50 customers/day: 16 days
- At 100 customers/day: 8 days
- Recommended: 14 days minimum

---

## Rollout Plan

### Phase 1: Test (Week 1-2)
- **Traffic Split:** 50% control (no upsell), 50% test (upsell shown)
- **Duration:** 14 days or until 800 customers reached
- **Monitoring:** Daily review of metrics

### Phase 2: Scale (Week 3)
- **If successful:** Scale test variant to 100% of traffic
- **If inconclusive:** Extend test for 7 more days
- **If failed:** Rollback to control, analyze learnings

### Phase 3: Optimize (Week 4+)
- **If scaled:** A/B test different upsell offers
- **Monitor:** Weekly review for 4 weeks post-launch

---

## Rollback Plan

### Automatic Rollback Triggers
- Refund rate > 5.5% for 3 consecutive days
- Customer satisfaction < 4.0/5 for 3 consecutive days
- Upsell conversion rate < 3% (indicating poor offer relevance)

### Manual Rollback Process
1. Disable upsell flow via feature flag
2. Remove upsell emails/notifications
3. Document learnings and failure reasons
4. Update experiment status to "Rolled Back"
5. Notify stakeholders via Slack

**Rollback Time:** < 30 minutes

---

## Implementation Details

### Upsell Offer Configuration
- **Timing:** Within 24 hours of purchase
- **Channel:** Email + In-app notification
- **Offer:** 
  - 20% discount on complementary product
  - Free shipping
  - Limited time (48 hours)
- **Product Selection:** AI-recommended based on purchase history

### Control Variant Configuration
- No upsell offer (current experience)

### Tracking Setup
- **Event Tracking:** `upsell_offer_shown`, `upsell_offer_clicked`, `upsell_purchase_completed`
- **UTM Parameters:** `utm_source=upsell&utm_campaign=post_purchase_test`
- **Supabase Events:** Order events tagged with experiment ID and upsell flag

---

## Dependencies

- Email service (SendGrid/Mailchimp/etc.)
- In-app notification system
- Product recommendation engine (or manual rules)
- Feature flag: `post_purchase_upsell` (enabled for test variant)
- Order tracking in Supabase

---

## Timeline

| Phase | Start Date | End Date | Duration |
|-------|------------|----------|----------|
| Setup | TBD | TBD | 3 days |
| Test | TBD | TBD | 14 days |
| Analysis | TBD | TBD | 2 days |
| Scale/Rollback | TBD | TBD | 1 day |

**Total Duration:** ~20 days

---

## Resources Required

- **Design:** Upsell email template, in-app notification design
- **Engineering:** Upsell flow implementation, tracking setup
- **Product:** Product recommendation logic (or manual rules)
- **Marketing:** Copywriting for upsell offers

---

## Communication Plan

### Stakeholders
- Growth Team (daily updates)
- Product Team (weekly summary)
- Finance Team (final results)

### Updates
- **Daily:** Slack channel #growth-experiments
- **Weekly:** Email summary with metrics
- **Final:** Presentation with results and recommendations

---

## Learnings & Documentation

**Post-Experiment:**
- Document which upsell offers performed best
- Analyze customer segments that convert best
- Update upsell best practices
- Share learnings with team

---

## Related Experiments

- Onboarding Refund Reduction (complements LTV improvement)
- Meta Ads Targeting Optimization (improves overall unit economics)

---

**Experiment Owner:** Growth Team  
**Last Updated:** 2025-01-15
