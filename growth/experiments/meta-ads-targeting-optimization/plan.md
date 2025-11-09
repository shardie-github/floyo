# Experiment Plan: Meta Ads Targeting Optimization

**Slug:** `meta-ads-targeting-optimization`  
**Status:** Ready to Launch  
**Created:** 2025-01-15  
**Owner:** Growth Team

---

## Hypothesis

By refining Meta Ads audience targeting using lookalike audiences and interest-based segments, we can improve conversion rates by 20% and reduce CAC from $50 to $40.

---

## Objective

Reduce CAC while maintaining or improving conversion quality.

---

## Metrics

### Primary Metrics
- **CAC** (Customer Acquisition Cost)
  - Baseline: $50
  - Target: <$40
  - Success Threshold: <$42 (16% reduction)

### Secondary Metrics
- **Conversion Rate** (clicks to purchase)
  - Baseline: 2.0%
  - Target: 2.4% (+20%)
  - Success Threshold: 2.2% (+10%)

- **LTV:CAC Ratio**
  - Baseline: 6:1
  - Target: 7.5:1
  - Success Threshold: 7:1

- **Cost per Click (CPC)**
  - Baseline: $1.00
  - Target: <$0.85
  - Success Threshold: <$0.90

### Guardrail Metrics
- **Refund Rate** (must not increase)
  - Baseline: 5%
  - Max Allowed: 5.5%

- **Average Order Value** (must not decrease)
  - Baseline: $50
  - Min Allowed: $48

---

## Success Threshold

**Primary:** CAC < $42 (16% reduction)  
**Secondary:** Conversion rate > 2.2% (+10%)  
**Guardrails:** Refund rate < 5.5%, AOV > $48

**Decision Rule:** If primary metric meets threshold AND guardrails pass, roll out to 100%. Otherwise, iterate or rollback.

---

## Sample Size Heuristic

**Statistical Power:** 80%  
**Significance Level:** 5% (α = 0.05)  
**Minimum Detectable Effect:** 16% CAC reduction

**Calculation:**
- Baseline CAC: $50
- Target CAC: $42
- Standard deviation (estimated): $8
- Required sample size per variant: ~500 customers
- Total sample size: 1000 customers (500 control + 500 test)

**Duration Estimate:**
- At 50 customers/day: 20 days
- At 100 customers/day: 10 days
- Recommended: 14 days minimum

---

## Rollout Plan

### Phase 1: Test (Week 1-2)
- **Traffic Split:** 50% control, 50% test
- **Duration:** 14 days or until 1000 customers reached
- **Monitoring:** Daily review of metrics

### Phase 2: Scale (Week 3-4)
- **If successful:** Scale test variant to 100% of traffic
- **If inconclusive:** Extend test for 7 more days
- **If failed:** Rollback to control, analyze learnings

### Phase 3: Optimize (Week 5+)
- **If scaled:** Continue optimizing targeting parameters
- **Monitor:** Weekly review for 4 weeks post-launch

---

## Rollback Plan

### Automatic Rollback Triggers
- Refund rate > 5.5% for 3 consecutive days
- CAC > $55 (10% worse than baseline) for 3 consecutive days
- Conversion rate < 1.5% (25% worse than baseline) for 3 consecutive days

### Manual Rollback Process
1. Pause test ad sets in Meta Ads Manager
2. Revert to control targeting settings
3. Document learnings and failure reasons
4. Update experiment status to "Rolled Back"
5. Notify stakeholders via Slack

**Rollback Time:** < 1 hour

---

## Implementation Details

### Test Variant Configuration
- **Lookalike Audiences:** 
  - 1% lookalike of top 20% customers (by LTV)
  - 2% lookalike of all customers
- **Interest Targeting:**
  - Narrowed to top 5 performing interests
  - Excluded low-performing interests
- **Custom Audiences:**
  - Website visitors (last 30 days)
  - Engaged users (last 90 days)

### Control Variant Configuration
- Current targeting settings (no changes)

### Tracking Setup
- **UTM Parameters:** `utm_source=meta&utm_medium=ads&utm_campaign=targeting_test`
- **Meta Pixel:** Conversion events tracked
- **Supabase Events:** Order events tagged with experiment ID

---

## Dependencies

- Meta Ads Manager access
- Meta Pixel installed and configured
- Conversion tracking set up in Supabase
- Feature flag: `meta_ads_targeting_test` (enabled for test variant)

---

## Timeline

| Phase | Start Date | End Date | Duration |
|-------|------------|----------|----------|
| Setup | TBD | TBD | 2 days |
| Test | TBD | TBD | 14 days |
| Analysis | TBD | TBD | 2 days |
| Scale/Rollback | TBD | TBD | 1 day |

**Total Duration:** ~19 days

---

## Resources Required

- **Meta Ads Budget:** $5,000 (for test period)
- **Design:** Creative assets (if needed)
- **Engineering:** Feature flag setup, tracking implementation
- **Analytics:** Daily monitoring and reporting

---

## Communication Plan

### Stakeholders
- Growth Team (daily updates)
- Finance Team (weekly summary)
- Executive Team (final results)

### Updates
- **Daily:** Slack channel #growth-experiments
- **Weekly:** Email summary with metrics
- **Final:** Presentation with results and recommendations

---

## Learnings & Documentation

**Post-Experiment:**
- Document what worked and what didn't
- Update targeting best practices
- Share learnings with team
- Update experiment template if needed

---

## Related Experiments

- TikTok Ads Channel Expansion (similar targeting optimization)
- Post-Purchase Upsell (complements CAC reduction)

---

**Experiment Owner:** Growth Team  
**Last Updated:** 2025-01-15
