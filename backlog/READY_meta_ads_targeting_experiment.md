# Meta Ads Targeting Optimization Experiment
**Owner:** Growth Team  
**Objective:** Reduce CAC from $50 to <$40 by optimizing Meta Ads targeting (lookalike audiences, refined interests)

**Steps:**
1. Review experiment plan (`growth/experiments/meta-ads-targeting-optimization/plan.md`)
2. Set up feature flag `meta_ads_targeting_test` in feature flag system
3. Configure Meta Ads Manager with test variant targeting (lookalike audiences, refined interests)
4. Set up tracking (UTM parameters, Meta Pixel, Supabase events)
5. Launch experiment with 50/50 traffic split
6. Monitor daily metrics (CAC, conversion rate, LTV:CAC ratio, refund rate)
7. After 14 days or 1000 customers, analyze results
8. If successful (CAC < $42), scale to 100%. Otherwise, iterate or rollback

**Dependencies:** 
- Feature flag system (`featureflags/flags.json`, `middleware/flags.ts`)
- Meta Ads Manager access and API credentials
- Tracking infrastructure (Meta Pixel, Supabase events)
- Experiment plan (`growth/experiments/meta-ads-targeting-optimization/plan.md`)

**KPI:** 
- CAC reduction: Target <$40, Success threshold <$42 (16% reduction)
- Conversion rate increase: Target +20%, Success threshold +10%
- LTV:CAC ratio: Target >7.5:1, Success threshold >7:1

**30-day signal:** 
- CAC trending below $45
- Conversion rate > 2.2%
- No increase in refund rate

**Done when:**
- [ ] Feature flag configured and active
- [ ] Meta Ads test variant live with 50% traffic
- [ ] Tracking set up and verified
- [ ] Experiment running for 14 days or reached 1000 customers
- [ ] Results analyzed and decision made (scale/iterate/rollback)
- [ ] Learnings documented

**Impact:** High | **Confidence:** Medium | **Effort:** Medium  
**Score:** 8.0
