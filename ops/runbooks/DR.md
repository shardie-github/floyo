# Disaster Recovery Playbook

## Overview
Automated disaster recovery procedures with quarterly CI rehearsals.

## Recovery Steps

### 1. Identify Snapshot
```bash
ops snapshot list
```

### 2. Restore Snapshot
```bash
ops restore <snapshot-file>
```

### 3. Verify System
```bash
ops doctor
```

### 4. Run Smoke Tests
```bash
ops test:e2e --project=smoke
```

### 5. Validate RTO/RPO
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours

## Quarterly Rehearsal

Run automated DR rehearsal via CI:
```yaml
# .github/workflows/dr-rehearsal.yml
```

## Automated Steps

1. Spin temporary environment from latest snapshot
2. Run smoke tests
3. Validate all critical paths
4. Generate RTO/RPO report
5. Clean up temporary environment

## Rollback Procedure

If production deployment fails:

```bash
# Rollback to previous version
vercel rollback

# Or restore from snapshot
ops restore ops/snapshots/snapshot-<timestamp>.sql.encrypted
```

## Emergency Contacts

- **On-Call Engineer**: [Configure in ops/secrets/]
- **Escalation**: [Configure webhook]

## Incident Response

1. Enable quiet mode: `QUIET_MODE=true`
2. Check status: `ops doctor`
3. Review logs: `ops logs`
4. Escalate if needed
