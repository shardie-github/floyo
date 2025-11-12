# Experiment: Referral Program

**Status:** Active  
**Owner:** Growth Lead  
**Start Date:** 2025-01-27  
**Duration:** 4 weeks

---

## Hypothesis

Referral program (1 month free for referrer + referee) drives 10% of signups with <$10 CAC and >40% retention.

## Metrics

- **Primary:** Referral rate (% of signups from referrals), Referral CAC
- **Secondary:** Referral retention (D7, D30), Referral LTV

## Sample Size

**Target:** 50 referrals  
**Power Analysis:** 80% power, 5% significance, 10% referral rate  
**Minimum:** 30 referrals (if low traffic)

## Rollout Plan

1. **Week 1:** Deploy to 10% of users (test)
2. **Week 2:** Deploy to 50% of users (if no issues)
3. **Week 3+:** Deploy to 100% of users (if positive)

## Rollback Criteria

- Referral rate <5% (below target)
- Referral CAC >$20 (not cost-effective)
- Critical bugs or errors

## Guardrails

- Monitor referral fraud (duplicate accounts, abuse)
- Alert if referral CAC >$20
- Alert if referral retention <30%

## Success Criteria

- **Success:** Referral rate >10%, referral CAC <$10
- **Partial Success:** Referral rate 5-10%, referral CAC <$15
- **Failure:** Referral rate <5% or referral CAC >$20

## Implementation

- Feature flag: `referral_program_v1`
- UI: Referral dashboard (share link, track referrals, rewards)
- Rewards: 1 month free for referrer + referee
- Analytics: Track `referral_link_shared`, `referral_signup`, `referral_reward_applied`

## Learnings

_To be filled after experiment completion_
