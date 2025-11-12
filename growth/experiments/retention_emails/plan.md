# Experiment: Retention Email Campaigns

**Status:** Active  
**Owner:** Growth Lead  
**Start Date:** 2025-01-27  
**Duration:** 4 weeks

---

## Hypothesis

D1/D7/D30 retention emails increase retention by 10 percentage points (D7: 15% → 25%, D30: 10% → 20%).

## Metrics

- **Primary:** D7 retention, D30 retention
- **Secondary:** Email open rate, click-through rate, time to return

## Sample Size

**Target:** 200 users (100 control, 100 treatment)  
**Power Analysis:** 80% power, 5% significance, 10pp retention increase  
**Minimum:** 100 users (50 control, 50 treatment)

## Rollout Plan

1. **Week 1:** Send D1 emails to 50% of users (A/B test)
2. **Week 2:** Send D7 emails to 50% of users (A/B test)
3. **Week 3:** Send D30 emails to 50% of users (A/B test)
4. **Week 4:** Analyze results, roll out to 100% if positive

## Rollout/Rollback Criteria

- **Rollout:** D7 retention +10pp (vs control), email open rate >30%
- **Rollback:** D7 retention -5pp (vs control), email unsubscribe rate >5%

## Guardrails

- Monitor email deliverability (bounce rate <5%)
- Alert if email unsubscribe rate >5%
- Alert if D7 retention drops below baseline

## Success Criteria

- **Success:** D7 retention +10pp (vs control), email open rate >30%
- **Partial Success:** D7 retention +5pp (vs control), email open rate >25%
- **Failure:** D7 retention <baseline or email unsubscribe rate >5%

## Implementation

- Feature flag: `retention_emails_v1`
- Email templates: D1 welcome, D7 value reminder, D30 check-in
- Triggers: D1 (day after signup), D7 (7 days after signup), D30 (30 days after signup)
- Analytics: Track `email_sent`, `email_opened`, `email_clicked`, `user_returned`

## Learnings

_To be filled after experiment completion_
