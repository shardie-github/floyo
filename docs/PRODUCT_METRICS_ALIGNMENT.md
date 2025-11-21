# Product-Metrics Alignment Document

**Last Updated:** [DATE]  
**Owner:** Product & Engineering Teams

---

## Sprint Goals → Business Metrics Mapping

### Current Sprint Goal
**"Achieve 40%+ activation rate (signup → first insight) and <5 min time-to-first-insight for 50+ users."**

### Business Metrics Impact

| Sprint Goal | Business Metric | Target | Current | Impact |
|-------------|----------------|--------|---------|--------|
| 40%+ Activation Rate | MRR Growth | $[X]K MRR | $[X]K | High - Activation drives conversion |
| <5 min Time to First Insight | User Satisfaction | NPS >40 | [X] | High - Fast time to value improves retention |
| 50+ Users Tracked | User Base | 500 MAU | [X] | Medium - Validates product-market fit |

---

## Weekly Metrics Review Process

### Schedule
- **Day:** Every [DAY] (e.g., Friday)
- **Time:** [TIME] (e.g., 2:00 PM)
- **Duration:** 30 minutes
- **Attendees:** Product Lead, Engineering Lead, Data Analyst (if available)

### Agenda
1. **Sprint Goal Progress** (5 min)
   - Review activation rate, time to first insight
   - Compare to targets

2. **Key Metrics Review** (15 min)
   - Acquisition, Activation, Engagement, Retention
   - Technical Performance

3. **Decisions & Action Items** (10 min)
   - What needs attention?
   - What decisions need to be made?
   - What actions are required?

---

## Decision Framework: When to Pivot

### Pivot Triggers

**If Activation Rate < 30%:**
- **Action:** Focus on onboarding improvements
- **Timeline:** Next sprint
- **Metrics to Watch:** Onboarding completion rate, time to first insight

**If Time to First Insight > 10 minutes:**
- **Action:** Optimize pattern detection latency, add sample data
- **Timeline:** Immediate
- **Metrics to Watch:** Pattern detection latency, sample data usage

**If Error Rate > 5%:**
- **Action:** Prioritize bug fixes and error handling
- **Timeline:** Immediate
- **Metrics to Watch:** Error rate by endpoint, user impact

**If Dashboard Load Time > 3s:**
- **Action:** Optimize queries, add caching
- **Timeline:** Next sprint
- **Metrics to Watch:** Query performance, cache hit rate

---

## Success Criteria Definitions

### What "Good" Looks Like

**Activation Rate:**
- **Excellent:** 50%+
- **Good:** 40-50%
- **Needs Improvement:** 30-40%
- **Poor:** <30%

**Time to First Insight:**
- **Excellent:** <3 minutes
- **Good:** 3-5 minutes
- **Needs Improvement:** 5-10 minutes
- **Poor:** >10 minutes

**Onboarding Completion:**
- **Excellent:** 90%+
- **Good:** 80-90%
- **Needs Improvement:** 70-80%
- **Poor:** <70%

**Dashboard Load Time:**
- **Excellent:** <1s (p95)
- **Good:** 1-2s (p95)
- **Needs Improvement:** 2-3s (p95)
- **Poor:** >3s (p95)

---

## Metrics Dashboard Links

- **Analytics Dashboard:** `/admin/analytics`
- **Performance Dashboard:** `/admin/metrics`
- **Security Dashboard:** `/admin/security`

---

**Next Review:** [DATE]
