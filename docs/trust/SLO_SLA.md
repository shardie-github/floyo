# SLO/SLA Documentation

**Last Updated:** 2025-01-XX  
**Version:** 1.0

## Service Level Objectives (SLOs)

### Availability SLO

**Target:** 99.9% uptime (monthly)

**Calculation:**
- Uptime = (Total minutes - Downtime minutes) / Total minutes
- Downtime = Any period where service is unavailable or error rate > 5%
- Measurement period: Rolling 30 days

**Error Budget:**
- Monthly error budget: 43.2 minutes (0.1% of 30 days)
- Alert threshold: 50% of budget consumed (21.6 minutes)
- Critical threshold: 80% of budget consumed (34.6 minutes)

### Latency SLO

**Target:** P95 latency < 500ms

**Calculation:**
- P95 = 95th percentile of response times
- Measured at API gateway
- Excludes health checks and static assets

**Error Budget:**
- Monthly error budget: 2% of requests can exceed 500ms
- Alert threshold: 1% of requests exceed 500ms
- Critical threshold: 1.5% of requests exceed 500ms

### Error Rate SLO

**Target:** Error rate < 0.1%

**Calculation:**
- Error rate = (5xx errors + 4xx errors) / Total requests
- Measured at API gateway
- Excludes client errors (4xx) for user errors

**Error Budget:**
- Monthly error budget: 0.1% of requests can be errors
- Alert threshold: 0.05% error rate
- Critical threshold: 0.08% error rate

## Service Level Agreements (SLAs)

### Free Tier

- **Availability:** Best effort (no SLA)
- **Support:** Community support only
- **Response Time:** No guarantee

### Paid Tier

- **Availability:** 99.9% uptime (monthly)
- **Support:** Email support (business hours)
- **Response Time:** 
  - Critical: 4 hours
  - High: 24 hours
  - Medium: 48 hours

### Enterprise Tier

- **Availability:** 99.95% uptime (monthly)
- **Support:** 24/7 phone and email support
- **Response Time:**
  - Critical: 1 hour
  - High: 4 hours
  - Medium: 24 hours
- **SLA Credits:** Service credits for SLA violations

## Error Budget Management

### Error Budget Calculation

**Availability:**
- Error budget = 100% - Actual uptime
- Example: 99.95% uptime = 0.05% error budget consumed

**Latency:**
- Error budget = Requests exceeding threshold / Total requests
- Example: 100 requests exceed 500ms / 100,000 requests = 0.1% consumed

**Error Rate:**
- Error budget = Actual error rate / Target error rate
- Example: 0.15% error rate / 0.1% target = 150% consumed (budget exceeded)

### Error Budget Alerts

- **50% consumed:** Warning alert
- **80% consumed:** Critical alert
- **100% consumed:** Page on-call engineer

### Error Budget Recovery

- After budget consumed, focus shifts to stability
- New features may be delayed until budget recovers
- Post-mortem required for budget exhaustion

## Escalation Path

### Level 1: On-Call Engineer
- **Response Time:** 15 minutes
- **Responsibilities:** 
  - Acknowledge incident
  - Initial investigation
  - Status updates

### Level 2: Engineering Lead
- **Trigger:** Incident unresolved after 1 hour
- **Responsibilities:**
  - Deep investigation
  - Coordinate team
  - External communication

### Level 3: CTO/VP Engineering
- **Trigger:** Critical incident or budget exhaustion
- **Responsibilities:**
  - Strategic decisions
  - Customer communication
  - Post-mortem oversight

## On-Call Schedule

### Coverage

- **Schedule:** 24/7/365
- **Rotation:** Weekly rotation
- **Backup:** Secondary on-call available
- **Tooling:** PagerDuty/Opsgenie (if applicable)

### On-Call Responsibilities

1. **Monitoring:** Monitor alerts and dashboards
2. **Response:** Respond to incidents within SLA
3. **Communication:** Update status page and stakeholders
4. **Escalation:** Escalate when needed
5. **Documentation:** Document incident details

## Incident Communication

### Communication Cadence

- **Major Incident:** Updates every 15 minutes
- **Minor Incident:** Updates every 30-60 minutes
- **Status Page:** Primary communication channel

### Stakeholders

- **Users:** Via status page
- **Internal:** Via Slack/email
- **Customers (Enterprise):** Via email + phone (if critical)

See [STATUS.md](./STATUS.md) for detailed incident communication procedures.

## Metrics & Monitoring

### Key Metrics

- **Uptime:** Measured via health checks (every 30 seconds)
- **Latency:** P50, P95, P99 percentiles
- **Error Rate:** 4xx and 5xx error rates
- **Throughput:** Requests per second

### Dashboards

- **Main Dashboard:** Real-time metrics
- **SLO Dashboard:** Error budget tracking
- **Incident Dashboard:** Active incidents

### Alerting

- **Critical:** Page on-call immediately
- **Warning:** Email/Slack notification
- **Info:** Logged for review

## Post-Mortem Process

### When Post-Mortems Are Required

- All major incidents (SLO violation)
- Error budget exhaustion
- User-reported incidents (if significant)
- Any incident with > 1 hour downtime

### Post-Mortem Timeline

- **Incident:** Documented in real-time
- **Initial Review:** Within 24 hours
- **Draft:** Within 3 days
- **Review:** Within 5 days
- **Publication:** Within 7 days

### Post-Mortem Contents

1. **Summary:** What happened and impact
2. **Timeline:** Detailed timeline of events
3. **Root Cause:** What caused the incident
4. **Resolution:** How it was fixed
5. **Prevention:** What we're doing to prevent recurrence
6. **Metrics:** Duration, affected users, error rates
7. **Action Items:** Specific actions with owners and dates

## SLA Credits (Enterprise)

### Credit Calculation

- **99.9% → 99.5%:** 10% credit
- **99.5% → 99.0%:** 25% credit
- **< 99.0%:** 50% credit

### Credit Process

1. Customer reports SLA violation
2. We verify metrics
3. Credit applied to next billing cycle
4. Customer notified of credit

## Continuous Improvement

### SLO Review

- **Frequency:** Quarterly
- **Process:** Review metrics, adjust targets if needed
- **Stakeholders:** Engineering, Product, Sales

### Target Adjustments

- SLOs can be tightened (easier) or relaxed (harder)
- Changes require 30-day notice
- Historical data reviewed before changes

## References

- [Status Page](./STATUS.md) - Incident communication
- [Security Documentation](./SECURITY.md) - Security practices
- [Trust Documentation](./TRUST.md) - Overall trust framework

---

**Last Review:** 2025-01-XX  
**Next Review:** 2025-04-XX

*This document is updated quarterly. Metrics are reviewed monthly.*
