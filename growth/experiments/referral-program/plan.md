# Experiment: Referral Program Launch

**Slug:** `referral-program`  
**Status:** Ready to Launch  
**Owner:** Growth Team  
**Created:** 2025-01-XX

---

## Hypothesis

A referral program offering $25 credit to referrer and referee will generate 20% of new customers organically, reducing blended CAC and improving LTV (referrals have higher retention).

**If** we launch a referral program with $25 credit for both referrer and referee,  
**Then** 20% of new customers will come from referrals within 30 days,  
**Because** financial incentives motivate existing customers to refer, and referred customers have higher trust/retention.

---

## Metrics

### Primary Metric
- **Referral Signup Rate**
  - Target: 20% of new customers from referrals
  - Measurement: `(referral_signups / total_signups) × 100`

### Secondary Metrics
- **Blended CAC** (should decrease)
- **Referral Customer Retention** (vs. paid customers)
- **Referral Customer LTV** (vs. paid customers)
- **Cost per Referral** ($25 × 2 = $50 per referral)

---

## Success Threshold

**Minimum Success:** 15% of new customers from referrals  
**Target Success:** 20% of new customers from referrals  
**Financial Impact:**
- Blended CAC decreases from $150 to $127.50 (15% reduction)
- Referral customers have 10% higher retention
- ROI positive if referral LTV > $50 (cost)

---

## Sample Size

**No A/B test needed** - Full rollout with monitoring

**Duration:** 30 days to measure initial impact, then ongoing

**Expected Volume:**
- Assuming 1,000 new customers/month
- Target: 200 referral customers/month
- Cost: $10K/month ($50 × 200)

---

## Program Design

### Incentive Structure
- **Referrer:** $25 credit after referee makes first purchase
- **Referee:** $25 credit on signup (applied to first purchase)
- **Total Cost:** $50 per successful referral

### Referral Flow
1. Customer clicks "Refer Friends" in app
2. Shares unique referral link (via email, SMS, social)
3. Referee signs up using link
4. Referee makes first purchase → Both receive $25 credit
5. Credits applied automatically to accounts

### Tracking
- Unique referral codes per customer
- Attribution via UTM parameters
- Conversion tracking (signup → purchase)

---

## Rollout Plan

1. **Week 1:** Soft launch (email to top 10% customers)
2. **Week 2:** Expand to all active customers
3. **Week 3:** Add in-app prompts
4. **Week 4:** Marketing campaign (social, blog)
5. **Ongoing:** Monitor and optimize

---

## Rollback Plan

**Rollback Triggers:**
- Abuse detected (fake accounts, self-referrals)
- ROI negative (referral LTV < $50)
- Customer complaints about spam
- Fraud rate >5%

**Rollback Process:**
1. Pause new referrals immediately
2. Honor existing referral credits
3. Investigate abuse/fraud
4. Fix issues before relaunch

---

## Implementation Details

### Technical Requirements
- Referral code generation system
- Attribution tracking (UTM parameters)
- Credit/payment system integration
- Fraud detection (duplicate emails, IPs)
- Email/SMS automation

### Analytics Events
- `referral_link_shared`
- `referral_signup` (with referrer_id)
- `referral_purchase` (with referrer_id)
- `referral_credit_issued`

---

## Dependencies

- **Engineering:** Referral system (5 days)
- **Payment System:** Credit issuance (2 days)
- **Email/SMS:** Automation setup (2 days)
- **Design:** Referral UI/UX (2 days)
- **Legal:** Terms & conditions review (1 day)

**Total Effort:** ~12 engineer-days

---

## Monitoring

### Daily Checks
- Referral signups
- Fraud/abuse detection
- Credit issuance volume
- Customer support tickets

### Weekly Review
- Referral rate (% of total signups)
- Blended CAC calculation
- Referral customer retention
- ROI analysis

### Alerts
- Fraud rate >5%
- Abuse reports spike
- Credit issuance errors
- Support tickets >2x normal

---

## Expected Outcomes

### Best Case
- 25% of customers from referrals
- Blended CAC decreases to $112.50 (25% reduction)
- Referral retention 15% higher than paid
- Annual savings: $45K in acquisition costs

### Base Case
- 20% of customers from referrals
- Blended CAC decreases to $127.50 (15% reduction)
- Referral retention 10% higher than paid
- Annual savings: $30K in acquisition costs

### Worst Case
- 10% of customers from referrals
- Blended CAC decreases to $140 (7% reduction)
- Referral retention same as paid
- Annual savings: $10K in acquisition costs

---

## Risk Mitigation

### Fraud Prevention
- Email verification required
- IP address tracking
- Duplicate account detection
- Manual review of suspicious referrals

### Abuse Prevention
- Limit: 10 referrals per customer/month
- Self-referral detection
- Credit expiration (90 days)
- Terms & conditions enforcement

---

## Post-Experiment

### If Successful
1. Scale program (increase incentives, expand channels)
2. Optimize referral flow (A/B test messaging, incentives)
3. Build referral leaderboard/gamification
4. Update financial model assumptions

### If Unsuccessful
1. Analyze failure reasons (low participation, high fraud, etc.)
2. Test alternative incentive structures
3. Consider referral program pause or redesign

---

## Related Experiments

- **Referral Incentive Testing** (vary credit amounts)
- **Referral Channel Optimization** (email vs. SMS vs. social)
- **Referral Gamification** (leaderboards, badges)
