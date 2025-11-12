# Incident Runbooks

This directory contains runbooks for common operational incidents.

## Available Runbooks

- **[API Latency](./api-latency.md)** - Handle API performance regressions and latency issues
- **[Build Failure](./build-failure.md)** - Troubleshoot CI/CD build failures
- **[Database Hotspot](./db-hotspot.md)** - Address database performance issues and hotspots
- **[Database Restore](./restore.md)** - Restore database from backups
- **[Disaster Recovery](./DR.md)** - Full disaster recovery procedures

## Usage

When an incident occurs:

1. Identify the incident type
2. Open the relevant runbook
3. Follow the diagnostic steps
4. Execute remediation actions
5. Document learnings in post-incident follow-up

## Runbook Structure

Each runbook follows this structure:

1. **Overview** - Brief description
2. **Symptoms** - How to identify the issue
3. **Quick Checks** - Fast diagnostic steps
4. **Diagnostic Steps** - Detailed investigation
5. **Remediation Actions** - Fix procedures
6. **What to Capture** - Metrics and logs to collect
7. **Escalation** - When and how to escalate
8. **Post-Incident** - Follow-up actions

## Related Resources

- Dashboard: `/admin/metrics`
- Performance Report: `PERFORMANCE_REPORT.md`
- Security Report: `SECURITY_COMPLIANCE_REPORT.md`
- Ops Config: `ops.config.json`

---
*Last updated: {{DATE}}*
