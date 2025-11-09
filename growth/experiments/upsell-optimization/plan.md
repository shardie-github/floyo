# Experiment: Upsell Flow Optimization

**Slug:** `upsell-optimization`  
**Status:** Ready to Launch  
**Owner:** Growth Team  
**Created:** 2025-01-XX

---

## Hypothesis

In-app upsell prompts at optimal moments (after key feature usage) will increase upgrade rate from 5% to 8%, boosting ARPU and LTV.

**If** we show contextual upsell prompts after users achieve key milestones,  
**Then** upgrade rate will increase from 5% to 8%,  
**Because** users see value before being asked to pay more, and timing is optimal.

---

## Metrics

### Primary Metric
- **Upgrade Rate**
  - Baseline: 5%
  - Target: 8% (60% improvement)

### Secondary Metrics
- **ARPU** (should increase 20%)
- **LTV** ($600 → $720)
- **Churn Rate** (should not increase)
- **Time to Upgrade** (should decrease)

---

## Success Threshold

**Minimum Success:** Upgrade rate increases to 6.5% (30% improvement)  
**Target Success:** Upgrade rate increases to 8% (60% improvement)  
**Financial Impact:** ARPU increases 20%, LTV increases to $720

---

## Sample Size

**2,000 active users** (1,000 per variant)

**Duration:** 3 weeks

---

## Variants

### Control (A)
- Current upsell flow (generic prompts)

### Treatment (B)
- Contextual upsell prompts after:
  - Key feature usage (e.g., after exporting first report)
  - Milestone achievement (e.g., 10th project created)
  - Value demonstration (e.g., time saved calculation)
- Personalized messaging based on usage
- Clear value proposition

---

## Rollout Plan

1. **Week 1:** 50/50 split (A/B test)
2. **Week 2:** Continue 50/50, monitor churn
3. **Week 3:** Decision point, winner takes 100%
4. **Loser:** Revert to control

---

## Rollback Plan

**Rollback Triggers:**
- Churn increases >10%
- Customer complaints spike (>2x)
- Upgrade rate drops vs. baseline
- Support tickets increase >50%

---

## Implementation Details

### Feature Flag
- **Flag Name:** `upsell_v2`
- **Trigger Points:**
  - After feature usage (export, share, etc.)
  - After milestone (10 projects, 100 tasks, etc.)
  - After value calculation (time saved, etc.)

### Analytics Events
- `upsell_prompt_shown`
- `upsell_prompt_dismissed`
- `upsell_prompt_clicked`
- `upgrade_initiated`
- `upgrade_completed`

---

## Dependencies

- **Engineering:** Upsell flow implementation (3 days)
- **Design:** Upsell UI/UX (2 days)
- **Analytics:** Event tracking (1 day)
- **Product:** Milestone detection logic (2 days)

**Total Effort:** ~8 engineer-days

---

## Expected Outcomes

### Best Case
- Upgrade rate increases to 10%
- ARPU increases 30%
- LTV increases to $780
- No churn increase

### Base Case
- Upgrade rate increases to 8%
- ARPU increases 20%
- LTV increases to $720
- Churn increases <5%

### Worst Case
- Upgrade rate increases to 6%
- ARPU increases 10%
- LTV increases to $660
- Churn increases 10% (rollback)

---

## Related Experiments

- **Upsell Timing Testing** (when to show prompts)
- **Upsell Messaging Testing** (value proposition variants)
- **Upsell Incentive Testing** (discounts, trials)
