# Solutions: Second-Order Effects Guardrails

**Date:** 2025-01-27  
**Status:** Ready for Implementation  
**Owner:** Engineering + Growth Teams

---

## Guardrail 1: Cash Runway Alert

**Risk:** Cash runway <3 months (fatal)

**Guardrail:** Alert if cash runway <3 months

**Implementation:**
1. Track cash balance in `metrics_daily` table
2. Calculate cash runway (cash balance / monthly burn)
3. Alert if cash runway <3 months

**Owner:** CEO  
**KPI:** Cash runway >6 months  
**Alert Threshold:** <3 months

---

## Guardrail 2: LTV:CAC Alert

**Risk:** LTV:CAC <2:1 (negative unit economics)

**Guardrail:** Alert if LTV:CAC <3:1

**Implementation:**
1. Calculate LTV from retention data
2. Calculate CAC from marketing spend
3. Alert if LTV:CAC <3:1

**Owner:** Growth Lead  
**KPI:** LTV:CAC >4:1  
**Alert Threshold:** <3:1

---

## Guardrail 3: Activation Rate Alert

**Risk:** Activation rate <20% (low value delivery)

**Guardrail:** Alert if activation rate <30%

**Implementation:**
1. Track activation rate (first workflow created)
2. Alert if activation rate <30%

**Owner:** Product Lead  
**KPI:** Activation rate >40%  
**Alert Threshold:** <30%

---

## Guardrail 4: Retention Alert

**Risk:** D7 retention <15% (high churn)

**Guardrail:** Alert if D7 retention <20%

**Implementation:**
1. Track D7 retention (cohort analysis)
2. Alert if D7 retention <20%

**Owner:** Growth Lead  
**KPI:** D7 retention >25%  
**Alert Threshold:** <20%

---

## Guardrail 5: Churn Rate Alert

**Risk:** Churn rate >10% (unsustainable)

**Guardrail:** Alert if churn rate >10%

**Implementation:**
1. Track monthly churn rate
2. Alert if churn rate >10%

**Owner:** Customer Success  
**KPI:** Churn rate <5%  
**Alert Threshold:** >10%

---

## Implementation

**Tools:**
- Supabase database (metrics_daily table)
- GitHub Actions (nightly checks)
- Email/Slack alerts

**Timeline:**
- **Week 1:** Implement cash runway alert
- **Week 2:** Implement LTV:CAC alert
- **Week 3:** Implement activation/retention/churn alerts

**Total Effort:** Low (3 days)  
**Total Impact:** High (prevents cascading failures)
