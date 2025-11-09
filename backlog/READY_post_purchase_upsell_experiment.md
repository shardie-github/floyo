# Post-Purchase Upsell Flow Experiment
**Owner:** Growth Team  
**Objective:** Increase LTV from $300 to $345 by capturing additional revenue immediately after purchase

**Steps:**
1. Review experiment plan (`growth/experiments/post-purchase-upsell/plan.md`)
2. Set up feature flag `post_purchase_upsell` in feature flag system
3. Design and build upsell flow (email + in-app notification)
4. Implement product recommendation logic (AI-based or rule-based)
5. Set up tracking (event tracking: `upsell_offer_shown`, `upsell_offer_clicked`, `upsell_purchase_completed`)
6. Launch experiment with 50/50 traffic split
7. Monitor daily metrics (AOV, LTV, upsell conversion rate, refund rate)
8. After 14 days or 800 customers, analyze results
9. If successful (AOV +8%, LTV +8%), scale to 100%. Otherwise, iterate or rollback

**Dependencies:** 
- Feature flag system (`featureflags/flags.json`, `middleware/flags.ts`)
- Email service (SendGrid/Mailchimp/etc.)
- In-app notification system
- Product recommendation engine (or manual rules)
- Order tracking in Supabase
- Experiment plan (`growth/experiments/post-purchase-upsell/plan.md`)

**KPI:** 
- Average Order Value (AOV): Target +15%, Success threshold +8%
- LTV: Target $345 (+15%), Success threshold $324 (+8%)
- Upsell conversion rate: Target >10%, Success threshold >7%

**30-day signal:** 
- AOV trending above $54
- Upsell conversion rate > 5%
- No increase in refund rate

**Done when:**
- [ ] Feature flag configured and active
- [ ] Upsell flow built and tested
- [ ] Email templates and in-app notifications created
- [ ] Tracking set up and verified
- [ ] Experiment running for 14 days or reached 800 customers
- [ ] Results analyzed and decision made (scale/iterate/rollback)
- [ ] Learnings documented

**Impact:** High | **Confidence:** High | **Effort:** Low  
**Score:** 9.0
