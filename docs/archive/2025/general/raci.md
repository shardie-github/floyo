> Archived on 2025-11-12. Superseded by: (see docs/final index)

# RACI Matrix — Roles & Responsibilities

**Generated:** $(date -Iseconds)  
**Methodology:** RACI (Responsible, Accountable, Consulted, Informed)

## Definitions

- **R (Responsible):** Does the work
- **A (Accountable):** Owns the outcome (one person)
- **C (Consulted):** Provides input
- **I (Informed):** Kept in the loop

## Deployments

| Activity | Developer | Tech Lead | DevOps | Security | Product |
|----------|-----------|-----------|--------|----------|---------|
| **Code Changes** | R | A | I | I | I |
| **PR Review** | R | A | C | C | I |
| **CI/CD Pipeline** | I | C | R | C | I |
| **Production Deploy** | I | A | R | C | I |
| **Rollback** | C | A | R | C | I |
| **Deploy Approval** | I | A | I | R | I |

**Notes:**
- Tech Lead accountable for overall deployment quality
- DevOps responsible for infrastructure and deployment execution
- Security consulted on security implications

## Incidents

| Activity | On-Call | Tech Lead | DevOps | Security | Product |
|----------|---------|-----------|--------|----------|---------|
| **Incident Detection** | R | I | I | I | I |
| **Incident Triage** | R | A | C | C | I |
| **Incident Response** | R | A | C | C | I |
| **Post-Mortem** | R | A | C | C | I |
| **Fix Implementation** | R | A | I | C | I |
| **Incident Communication** | R | A | I | I | C |

**Notes:**
- On-call engineer responsible for initial response
- Tech Lead accountable for resolution and learning
- Security consulted on security-related incidents

## Schema Changes

| Activity | Developer | Tech Lead | DBA/Backend | DevOps | Security |
|----------|-----------|-----------|-------------|--------|----------|
| **Schema Design** | R | A | C | I | C |
| **Migration Script** | R | A | C | I | C |
| **Migration Review** | C | A | R | C | C |
| **Migration Execution** | I | A | R | C | I |
| **Rollback Plan** | R | A | C | R | I |

**Notes:**
- DBA/Backend Lead responsible for migration execution
- Tech Lead accountable for schema changes
- Security consulted on data access patterns

## Security & Compliance

| Activity | Developer | Tech Lead | Security | Compliance | Legal |
|----------|-----------|-----------|----------|------------|-------|
| **Security Review** | R | C | A | C | I |
| **Vulnerability Fix** | R | A | C | I | I |
| **Compliance Audit** | I | C | C | A | C |
| **Privacy Policy Update** | I | C | C | C | A |
| **Secrets Rotation** | I | C | R | I | I |

**Notes:**
- Security team accountable for security posture
- Compliance team accountable for compliance audits
- Legal accountable for privacy policy

## Code Quality

| Activity | Developer | Tech Lead | QA | DevOps |
|----------|-----------|-----------|----|--------|
| **Code Review** | R | A | C | I |
| **Test Writing** | R | A | C | I |
| **Test Execution** | I | C | R | I |
| **Linting/Type Checking** | R | A | I | I |
| **Performance Testing** | C | A | R | C |

**Notes:**
- Developer responsible for code quality
- Tech Lead accountable for overall quality standards
- QA responsible for test execution

## Infrastructure

| Activity | Developer | Tech Lead | DevOps | Finance |
|----------|-----------|-----------|--------|---------|
| **Infrastructure Changes** | I | C | R | I |
| **Cost Optimization** | I | C | R | A |
| **Monitoring Setup** | C | A | R | I |
| **Scaling Decisions** | I | A | R | C |

**Notes:**
- DevOps responsible for infrastructure
- Finance accountable for cost optimization
- Tech Lead accountable for scaling decisions

## TBD (To Be Determined)

The following roles need clarification:

1. **Product Owner:** Exact involvement in technical decisions
2. **Engineering Manager:** Oversight and escalation path
3. **Designer:** UI/UX change approval process
4. **Data Analyst:** Analytics and telemetry decisions

## Notes

- **Accountable (A)** should always be a single person
- **Responsible (R)** can be multiple people
- **Consulted (C)** should be involved early
- **Informed (I)** should receive updates but not block

## Updates

This RACI matrix should be reviewed quarterly and updated based on:
- Team structure changes
- Process improvements
- Incident learnings
- Role clarifications

---

**Status:** ✅ RACI matrix defined  
**Next:** Review with team and update TBD items
