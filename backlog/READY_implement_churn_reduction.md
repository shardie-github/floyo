# Implement Churn Reduction (Email Win-Back Campaign)
**Owner:** Growth Team / Marketing  
**Objective:** Reduce monthly churn from 5% to 4% via proactive customer engagement.

## Steps:
1. Review experiment plan: `/growth/experiments/email-winback/plan.md`
2. Build at-risk customer detection:
   - Inactive for 14+ days
   - No login in last 7 days
   - Low feature usage
3. Create email sequence:
   - Day 0: "We miss you" email
   - Day 7: "What you're missing" email
   - Day 14: "Special offer" email
   - Day 21: "Final chance" email
4. Personalize emails:
   - Customer name
   - Last used feature
   - Recommended actions
5. Set up email automation:
   - Segmentation logic
   - Send scheduling
   - A/B testing (subject lines, content)
6. Phased rollout:
   - Week 1: 25% of at-risk customers
   - Week 2: 50% rollout
   - Week 3: 100% rollout
7. Monitor weekly:
   - Churn rate
   - Win-back rate
   - Email metrics (open, click)
   - Unsubscribe rate

## Dependencies:
- Customer segmentation logic
- Email automation platform (SendGrid, Mailchimp)
- Personalization engine

## KPI:
- Churn decreases 20% (5% → 4%) | **30-day signal:** Churn decreases by 0.5% in first 2 weeks

## Done when:
- Email win-back campaign live
- Churn rate decreases to 4%
- Win-back rate: 15% of at-risk customers reactivate
- LTV increases from $600 to $750

---

**Impact:** High | **Confidence:** High | **Effort:** Medium (1-2 weeks)
