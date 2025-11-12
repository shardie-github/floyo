> Archived on 2025-11-12. Superseded by: (see docs/final index)

# READY: Fix User → Product Feedback Loop (Analytics Infrastructure)

**Priority:** P0  
**Owner:** Engineering Lead  
**Status:** Ready  
**Effort:** Medium (7 days)  
**Impact:** High

## Problem Statement

User actions (signups, workflows, churn) are not tracked. Product decisions are guesses. The User → Product feedback loop is broken.

## Success Criteria

- Analytics events tracked >100/day
- Can measure user behavior (signups, workflows, churn)
- Analytics dashboard shows activation funnel, retention cohorts

## Implementation Plan

1. **Day 1-2:** Set up PostHog/Mixpanel account + Supabase integration
2. **Day 3-4:** Implement event tracking in frontend (signup, workflow_created, workflow_run, upgrade)
3. **Day 5-6:** Build analytics dashboard (activation funnel, retention cohorts)
4. **Day 7:** Test + deploy

## 30-Day Signal

- Analytics events tracked >100/day
- Can measure activation rate (target: >40%)
- Can measure retention (target: D7 >25%)

## Dependencies

- Supabase database (exists)
- Frontend access (exists)

## Acceptance Criteria

- [ ] PostHog/Mixpanel integrated
- [ ] Core events tracked (signup, workflow_created, workflow_run, upgrade)
- [ ] Analytics dashboard shows activation funnel
- [ ] Retention cohorts visible
- [ ] Events synced to Supabase for ETL

## Notes

This fixes the User → Product feedback loop. Without this, we cannot learn from user behavior.
