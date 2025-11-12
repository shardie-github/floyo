> Archived on 2025-11-12. Superseded by: (see docs/final index)

# System Health: Constraint Propagation Analysis

**Date:** 2025-01-27  
**Status:** Diagnostic Complete  
**Owner:** Engineering Lead

---

## Executive Summary

**Critical Finding:** Floyo's primary constraint is missing analytics infrastructure, which propagates to all other constraints: no activation tracking → low retention → high CAC → negative unit economics → cash runway risk.

**Alignment Temperature Impact:** -12 points (constraints compound)

---

## Constraint Map

| Stage | Constraint | Cause | Impact | Fix | Cost | Benefit | Owner | KPI |
|-------|-----------|-------|--------|-----|------|---------|-------|-----|
| **Acquisition** | High CAC ($80 vs $50 target) | No referral program, no organic growth | High | Launch referral program | Low | High | Growth | CAC <$50 |
| **Activation** | Low activation (20% vs 40% target) | No onboarding funnel | High | Build activation funnel | Low | High | Product | Activation >40% |
| **Retention** | Low retention (D7 <20% vs 25% target) | No retention campaigns | High | Retention emails | Low | High | Growth | D7 retention >25% |
| **Revenue** | Cannot track revenue | Stripe integration incomplete | High | Complete Stripe integration | Medium | High | Engineering | Stripe webhook >99% |
| **Metrics** | Cannot measure anything | No analytics infrastructure | Critical | Implement analytics | Medium | Critical | Engineering | Events >100/day |
| **Cash** | Cash runway <3 months | High burn, low revenue | Fatal | Reduce burn + increase revenue | High | Critical | CEO | Runway >6mo |

**Key Finding:** All constraints stem from missing analytics infrastructure. Fix analytics first, then other constraints become measurable and fixable.

---

## Constraint Propagation Chain

**Primary Constraint:** Missing analytics infrastructure

**Propagation:**
1. No analytics → Cannot measure activation
2. Cannot measure activation → Cannot optimize onboarding
3. Cannot optimize onboarding → Low activation (20% vs 40% target)
4. Low activation → Low retention (D7 <20% vs 25% target)
5. Low retention → High CAC ($80 vs $50 target)
6. High CAC → Negative unit economics (LTV:CAC <2:1)
7. Negative unit economics → Cash runway risk (<3 months)

**Impact:** Estimated -$15K MRR potential untapped

---

## Throughput Analysis

| Stage | Current Throughput | Target Throughput | Gap | Bottleneck | Fix |
|-------|-------------------|-------------------|-----|------------|-----|
| **Acquisition** | 50 signups/mo | 100 signups/mo | 50% | High CAC | Referral program |
| **Activation** | 10 workflows/mo (20% of 50) | 40 workflows/mo (40% of 100) | 75% | No onboarding | Activation funnel |
| **Retention** | 2 retained/mo (20% of 10) | 10 retained/mo (25% of 40) | 80% | No retention campaigns | Retention emails |
| **Revenue** | $0 MRR | $5K MRR | 100% | No billing | Stripe integration |

**Key Finding:** Throughput is low at all stages. Fix activation first (highest leverage), then retention, then acquisition.

---

## Recommendations

1. **Week 1:** Implement analytics infrastructure (breaks constraint at source)
2. **Week 1-2:** Build activation funnel (increases activation throughput)
3. **Week 2:** Complete Stripe integration (enables revenue tracking)
4. **Week 2-3:** Launch retention campaigns (increases retention throughput)
5. **Week 3:** Launch referral program (reduces CAC, increases acquisition throughput)

**Priority:** P0 (all fixes critical to remove constraints)
