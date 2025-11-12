# Experiment: Activation Funnel

**Status:** Active  
**Owner:** Product Lead  
**Start Date:** 2025-01-27  
**Duration:** 2 weeks

---

## Hypothesis

Guided onboarding (welcome → tutorial → create first workflow) increases activation rate from 0% (unknown baseline) to 40% (target).

## Metrics

- **Primary:** Activation rate (% of signups who create first workflow within 7 days)
- **Secondary:** Time to first workflow (minutes), Onboarding completion rate (%)

## Sample Size

**Target:** 100 signups  
**Power Analysis:** 80% power, 5% significance, 40% activation rate (vs 0% baseline)  
**Minimum:** 50 signups (if low traffic)

## Rollout Plan

1. **Day 1-2:** Deploy to 10% of signups (test)
2. **Day 3-4:** Deploy to 50% of signups (if no issues)
3. **Day 5+:** Deploy to 100% of signups (if positive)

## Rollback Criteria

- Activation rate <20% (worse than expected)
- Critical bugs or errors
- User complaints >5%

## Guardrails

- Monitor error rates daily
- Alert if activation rate drops below 20%
- Alert if time to first workflow >10 minutes

## Success Criteria

- **Success:** Activation rate >40%
- **Partial Success:** Activation rate 30-40%
- **Failure:** Activation rate <30%

## Implementation

- Feature flag: `activation_funnel_v1`
- UI: Onboarding flow (welcome → tutorial → workflow creation)
- Analytics: Track `onboarding_started`, `onboarding_completed`, `workflow_created`

## Learnings

_To be filled after experiment completion_
