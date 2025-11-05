# Internal SLA — floyo

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready

---

## Overview

Internal Service Level Agreements (SLAs) for floyo operations, covering uptime, performance, and support metrics.

**Target Uptime:** 99.5% (monthly)  
**Target Response Time:** 48 hours (Starter), 24 hours (Pro)

---

## 1. Uptime SLAs

### 1.1 Service Availability
- **Target:** 99.5% uptime (monthly)
- **Measurement:** 24/7 monitoring (UptimeRobot, Pingdom)
- **Calculation:** (Total minutes - Downtime minutes) / Total minutes × 100

### 1.2 Uptime Tiers
- **Free Tier:** Best effort (no SLA)
- **Starter Tier:** 99.5% uptime (monthly)
- **Pro Tier:** 99.9% uptime (monthly)

### 1.3 Scheduled Maintenance
- **Notice:** 48 hours advance notice
- **Duration:** ≤4 hours per month
- **Frequency:** Monthly (if needed)

---

## 2. Performance SLAs

### 2.1 Response Time
- **Pattern Detection:** ≤5 seconds (for 1000+ events)
- **Workflow Execution:** ≤30 seconds (for typical workflows)
- **API Response:** ≤2 seconds (for API integrations)

### 2.2 Performance Targets
- **CPU Usage:** ≤70% average
- **Memory Usage:** ≤80% average
- **Disk I/O:** ≤80% average

---

## 3. Support SLAs

### 3.1 Response Time
- **Free Tier:** Best effort (community support)
- **Starter Tier:** 48 hours (business days)
- **Pro Tier:** 24 hours (business days)

### 3.2 Resolution Time
- **Starter Tier:** 5 business days
- **Pro Tier:** 3 business days

### 3.3 Escalation
- **Critical (P0):** Immediate escalation
- **High (P1):** Escalation within 4 hours

---

## 4. Data Protection SLAs

### 4.1 Backup Frequency
- **Local Data:** User-controlled (local-first architecture)
- **Cloud Backup (Optional):** Daily (if enabled)

### 4.2 Data Retention
- **Account Data:** Retained while account active
- **Telemetry Data:** 12 months (if opt-in)
- **Deleted Accounts:** Data deleted within 30 days

---

## 5. Security SLAs

### 5.1 Security Updates
- **Critical Vulnerabilities:** Patch within 24 hours
- **High Vulnerabilities:** Patch within 7 days
- **Medium Vulnerabilities:** Patch within 30 days

### 5.2 Security Monitoring
- **Log Review:** Weekly
- **Vulnerability Scanning:** Monthly
- **Penetration Testing:** Annually (if scale requires)

---

## 6. Incident Response SLAs

### 6.1 Detection Time
- **Target:** ≤15 minutes (automated monitoring)
- **Measurement:** Time from incident start to detection

### 6.2 Response Time
- **P0 (Critical):** ≤15 minutes
- **P1 (High):** ≤30 minutes
- **P2 (Medium):** ≤2 hours

### 6.3 Resolution Time
- **P0 (Critical):** ≤4 hours
- **P1 (High):** ≤24 hours
- **P2 (Medium):** ≤5 business days

---

## 7. Compliance SLAs

### 7.1 PIPEDA Compliance
- **Data Access Requests:** Response within 30 days
- **Data Deletion Requests:** Processed within 30 days
- **Privacy Policy Updates:** Reviewed quarterly

### 7.2 CASL Compliance
- **Unsubscribe Requests:** Processed within 10 business days
- **Consent Records:** Maintained for 3 years
- **Email Compliance:** Reviewed quarterly

---

## 8. Reporting

### 8.1 SLA Reporting
- **Frequency:** Monthly (internal), Quarterly (external)
- **Metrics:** Uptime, performance, support, security
- **Dashboard:** [YOUR-DOMAIN]/status/metrics (internal)

### 8.2 SLA Breaches
- **Notification:** Email notification within 24 hours
- **Remediation:** Root cause analysis, prevention measures
- **Compensation:** Pro-rated refunds (if applicable)

---

## 9. Continuous Improvement

### 9.1 Review Frequency
- **Monthly:** Internal SLA review
- **Quarterly:** External SLA review (if applicable)
- **Annually:** SLA policy review

### 9.2 Improvement Actions
- **Root Cause Analysis:** For SLA breaches
- **Prevention Measures:** Implemented based on findings
- **SLA Updates:** Updated based on feedback

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready
