# Experiment: Onboarding Flow Optimization

**Slug:** `onboarding-v2`  
**Status:** Ready to Launch  
**Owner:** Growth Team  
**Created:** 2025-01-XX

---

## Hypothesis

Simplifying the onboarding flow and reducing friction will increase signup-to-paid conversion by 25%, reducing effective CAC without changing ad spend.

**If** we simplify the onboarding flow (reduce steps from 5 to 3, add progress indicators, improve mobile UX),  
**Then** signup-to-paid conversion will increase from 2.5% to 3.1%,  
**Because** reduced friction and clearer value proposition will reduce drop-off.

---

## Metrics

### Primary Metric
- **Signup-to-Paid Conversion Rate**
  - Baseline: 2.5%
  - Target: 3.1% (25% improvement)
  - Measurement: `(paid_signups / total_signups) × 100`

### Secondary Metrics
- **Time to First Value** (minutes)
- **Onboarding Completion Rate** (%)
- **CAC** (should decrease proportionally)
- **User Satisfaction** (NPS/CSAT)

---

## Success Threshold

**Minimum Success:** Conversion rate increases by 15% (2.5% → 2.9%)  
**Target Success:** Conversion rate increases by 25% (2.5% → 3.1%)  
**Statistical Significance:** p < 0.05 with 95% confidence interval

**Financial Impact:**
- If conversion improves 25%, CAC decreases from $150 to $120 (20% reduction)
- Annual savings: ~$30K in acquisition costs (assuming 1,000 customers/year)

---

## Sample Size Calculation

**Formula:** n = (2 × σ² × (Z_α/2 + Z_β)²) / δ²

Where:
- σ = 0.025 (estimated standard deviation)
- Z_α/2 = 1.96 (95% confidence)
- Z_β = 0.84 (80% power)
- δ = 0.006 (minimum detectable effect: 2.5% → 2.9%)

**Result:** n = 2,000 visitors per variant (4,000 total)

**Duration:** 2 weeks (assuming ~300 signups/day)

---

## Variants

### Control (A)
- Current 5-step onboarding flow
- No changes

### Treatment (B)
- Simplified 3-step onboarding flow
- Progress indicators
- Mobile-optimized layout
- Clearer value proposition messaging
- Skip optional steps

---

## Rollout Plan

1. **Week 1:** 50/50 split (A/B test)
2. **Week 2:** Continue 50/50, monitor for anomalies
3. **Decision Point:** After 2 weeks or 4,000 visitors (whichever comes first)
4. **Winner:** 100% rollout of winning variant
5. **Loser:** Revert to control, document learnings

---

## Rollback Plan

**Immediate Rollback Triggers:**
- Conversion rate drops >10% vs. baseline
- User complaints increase >50%
- Technical errors >1% of sessions
- Support tickets spike (>2x normal)

**Rollback Process:**
1. Disable feature flag immediately
2. Revert to control variant (100%)
3. Notify team via Slack
4. Document incident in experiment log
5. Post-mortem within 24 hours

---

## Implementation Details

### Feature Flag
- **Flag Name:** `onboarding_v2`
- **Toggle:** Gradual rollout (0% → 25% → 50% → 100%)
- **Fallback:** Control variant if flag fails

### Analytics Events
- `onboarding_started`
- `onboarding_step_completed` (step 1, 2, 3)
- `onboarding_completed`
- `onboarding_abandoned` (with step number)
- `first_value_achieved`

### Technical Requirements
- A/B testing framework integration
- Event tracking (Mixpanel/Amplitude)
- Feature flag system (LaunchDarkly/Flagsmith)
- Mobile-responsive design

---

## Dependencies

- **Design:** Onboarding flow mockups (completed)
- **Engineering:** Frontend implementation (2 days)
- **Analytics:** Event tracking setup (1 day)
- **QA:** Testing across devices/browsers (1 day)

**Total Effort:** ~4 engineer-days

---

## Monitoring

### Daily Checks
- Conversion rate by variant
- Error rates
- Support ticket volume

### Weekly Review
- Statistical significance test
- User feedback analysis
- Financial impact calculation

### Alerts
- Conversion rate drops >5%
- Error rate >1%
- Support tickets >2x normal

---

## Expected Outcomes

### Best Case
- Conversion increases 30% (2.5% → 3.25%)
- CAC decreases to $115
- Annual savings: $35K

### Base Case
- Conversion increases 25% (2.5% → 3.1%)
- CAC decreases to $120
- Annual savings: $30K

### Worst Case
- Conversion increases 10% (2.5% → 2.75%)
- CAC decreases to $136
- Annual savings: $14K

---

## Post-Experiment

### If Successful
1. Roll out to 100%
2. Document learnings
3. Plan follow-up experiments (onboarding step 2 optimization, etc.)
4. Update financial model assumptions

### If Unsuccessful
1. Revert to control
2. Document learnings
3. Analyze why it failed (user research, analytics deep-dive)
4. Plan alternative approach

---

## Related Experiments

- **Onboarding Step 2 Optimization** (follow-up if successful)
- **Mobile Onboarding** (separate experiment)
- **Value Proposition Testing** (messaging variants)
