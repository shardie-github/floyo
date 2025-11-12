> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Onboarding Refund Reduction Experiment
**Owner:** Growth Team  
**Objective:** Reduce refund rate from 5% to 3% by improving customer onboarding experience

**Steps:**
1. Review experiment plan (`growth/experiments/onboarding-refund-reduction/plan.md`)
2. Set up feature flag `onboarding_refund_reduction` in feature flag system
3. Design and build new interactive onboarding flow (welcome video, product tour, guided first task)
4. Create email sequence (Days 1, 3, 7) with tips and resources
5. Set up tracking (event tracking: `onboarding_started`, `onboarding_step_completed`, `onboarding_completed`, `first_value_achieved`)
6. Launch experiment with 50/50 traffic split
7. Monitor daily metrics (refund rate, Day 7 activation rate, time to first value, customer satisfaction)
8. After 21 days or 3000 customers, analyze results
9. If successful (refund rate < 3.5%), scale to 100%. Otherwise, iterate or rollback

**Dependencies:** 
- Feature flag system (`featureflags/flags.json`, `middleware/flags.ts`)
- Onboarding flow builder (or custom implementation)
- Email service (SendGrid/Mailchimp/etc.)
- Analytics tracking (Supabase events)
- Experiment plan (`growth/experiments/onboarding-refund-reduction/plan.md`)

**KPI:** 
- Refund rate: Target 3% (-40%), Success threshold 3.5% (-30%)
- Day 7 activation rate: Target 75% (+25%), Success threshold 70% (+17%)
- Time to first value: Target 24 hours (-50%), Success threshold 36 hours (-25%)

**30-day signal:** 
- Refund rate trending below 4%
- Day 7 activation rate > 65%
- No decrease in sign-up conversion rate

**Done when:**
- [ ] Feature flag configured and active
- [ ] New onboarding flow built and tested
- [ ] Email sequence created and scheduled
- [ ] Tracking set up and verified
- [ ] Experiment running for 21 days or reached 3000 customers
- [ ] Results analyzed and decision made (scale/iterate/rollback)
- [ ] Learnings documented

**Impact:** Medium | **Confidence:** High | **Effort:** Medium  
**Score:** 6.0
