# Experiment: Email Win-Back Campaign

**Slug:** `email-winback`  
**Status:** Ready to Launch  
**Owner:** Growth Team  
**Created:** 2025-01-XX

---

## Hypothesis

Targeted email campaigns to at-risk customers (inactive for 14+ days) with personalized offers will reduce monthly churn by 20% (5% → 4%).

**If** we send personalized win-back emails to at-risk customers with relevant offers,  
**Then** monthly churn will decrease from 5% to 4%,  
**Because** proactive engagement and incentives will reactivate dormant customers before they churn.

---

## Metrics

### Primary Metric
- **Monthly Churn Rate**
  - Baseline: 5%
  - Target: 4% (20% reduction)

### Secondary Metrics
- **Win-Back Rate** (15% of at-risk customers reactivate)
- **LTV Improvement** ($600 → $750)
- **Email Open Rate** (>30%)
- **Email Click Rate** (>10%)

---

## Success Threshold

**Minimum Success:** Churn decreases by 10% (5% → 4.5%)  
**Target Success:** Churn decreases by 20% (5% → 4%)  
**Financial Impact:** LTV increases from $600 to $750 (25% improvement)

---

## Sample Size

**Full Rollout** - All at-risk customers (typically 10-15% of customer base)

**Duration:** 30 days to measure impact

---

## Campaign Design

### Segmentation
- **At-Risk:** Inactive for 14+ days, no login in last 7 days
- **High-Risk:** Inactive for 30+ days, no engagement
- **Critical:** Payment failed, subscription expiring soon

### Email Sequence
1. **Day 0:** "We miss you" email with personalized content
2. **Day 7:** "What you're missing" email with feature highlights
3. **Day 14:** "Special offer" email with discount/incentive
4. **Day 21:** "Final chance" email with best offer

### Personalization
- Customer name
- Last used feature
- Recommended actions based on usage history
- Relevant case studies/testimonials

---

## Rollout Plan

1. **Week 1:** 25% of at-risk customers (test segment)
2. **Week 2:** 50% rollout (if Week 1 successful)
3. **Week 3:** 100% rollout
4. **Ongoing:** Monitor and optimize

---

## Rollback Plan

**Rollback Triggers:**
- Unsubscribe rate increases >2x
- Spam complaints spike
- No improvement in churn after 2 weeks
- Customer complaints about email frequency

**Rollback Process:**
1. Pause email sends immediately
2. Review unsubscribe/complaint data
3. Adjust frequency/content
4. Relaunch with improvements

---

## Implementation Details

### Technical Requirements
- Customer segmentation logic (inactivity detection)
- Email automation platform (SendGrid, Mailchimp, etc.)
- Personalization engine
- A/B testing framework (subject lines, content, offers)

### Analytics Events
- `winback_email_sent`
- `winback_email_opened`
- `winback_email_clicked`
- `winback_customer_reactivated`

---

## Dependencies

- **Engineering:** Segmentation logic (2 days)
- **Marketing:** Email templates & content (3 days)
- **Analytics:** Event tracking (1 day)
- **Email Platform:** Automation setup (2 days)

**Total Effort:** ~8 engineer-days

---

## Expected Outcomes

### Best Case
- Churn decreases 25% (5% → 3.75%)
- Win-back rate: 20%
- LTV increases to $800
- Annual impact: $200K+ in retained revenue

### Base Case
- Churn decreases 20% (5% → 4%)
- Win-back rate: 15%
- LTV increases to $750
- Annual impact: $150K+ in retained revenue

### Worst Case
- Churn decreases 10% (5% → 4.5%)
- Win-back rate: 10%
- LTV increases to $675
- Annual impact: $75K+ in retained revenue

---

## Related Experiments

- **SMS Win-Back** (alternative channel)
- **In-App Win-Back** (push notifications)
- **Personalization Testing** (content variants)
