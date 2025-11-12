> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Database Restore Runbook

## Overview
This runbook provides steps for restoring database from backups. **No PII should be included in backups or restore procedures.**

## Prerequisites
- Backup snapshot available
- Access to Supabase dashboard or database
- Migration canary flag set if needed
- Approval from team lead for production restores

## Restore Steps

### Step 1: Verify Backup Availability
```bash
# List available snapshots
ops snapshot list

# Or check Supabase dashboard → Backups
```

**Verify:**
- Backup timestamp is recent enough
- Backup metadata is present
- Backup file integrity (checksum if available)

### Step 2: Choose Restore Target

#### Option A: Restore to Staging (Recommended First)
- Use staging environment for testing
- Verify restore procedure works
- Test application functionality

#### Option B: Restore to Production
- **Requires:** Team lead approval
- **Requires:** Migration canary flag enabled
- **Requires:** Maintenance window scheduled

### Step 3: Pre-Restore Checklist
- [ ] Notify team of restore operation
- [ ] Enable maintenance mode (if applicable)
- [ ] Backup current state (safety backup)
- [ ] Verify restore target environment
- [ ] Check migration canary flag: `MIGRATION_CANARY=true`

### Step 4: Execute Restore

#### Using Ops CLI (Recommended)
```bash
# Restore from snapshot
ops restore ops/snapshots/snapshot-<timestamp>.sql.encrypted

# Verify restore
ops doctor
```

#### Using Supabase Dashboard
1. Navigate to Supabase dashboard → Database → Backups
2. Select backup snapshot
3. Click "Restore" (staging) or "Restore to Production"
4. Confirm restore operation
5. Wait for completion

#### Using SQL (Manual)
```bash
# WARNING: Only for advanced users
# Ensure MIGRATION_CANARY=true

# Restore from SQL dump
psql $DATABASE_URL < backup.sql
```

### Step 5: Post-Restore Verification

#### Database Integrity
```bash
# Run health checks
ops doctor

# Verify critical tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM events;"
```

#### Application Functionality
```bash
# Run smoke tests
ops test:e2e --project=smoke

# Check API endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/metrics
```

#### Data Consistency
- Verify row counts match expectations
- Check foreign key relationships
- Validate critical data integrity

### Step 6: Rollback Plan (If Restore Fails)
```bash
# Restore from safety backup created in Step 3
ops restore ops/snapshots/safety-backup-<timestamp>.sql.encrypted

# Or use Supabase point-in-time recovery
# (if enabled in Supabase dashboard)
```

## RTO/RPO Targets

- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 24 hours

## Safety Rails

### Migration Canary Flag
- **Environment Variable:** `MIGRATION_CANARY`
- **Purpose:** Prevents accidental destructive operations
- **Required:** Must be `true` for production restores
- **Check:** Verify before running restore

### Read-Only Analytics Role
- Use separate role for analytics queries
- Prevents accidental writes during restore
- Configure in Supabase dashboard

### Backup Evidence
- Backup metadata stored in `ops/snapshots/`
- Compliance report tracks backup status
- See `SECURITY_COMPLIANCE_REPORT.md`

## What to Capture

### Metrics to Log
- Restore duration
- Data volume restored
- Verification test results
- Any errors or warnings

### Documentation
- Restore timestamp and reason
- Backup snapshot used
- Verification results
- Post-restore issues (if any)

## Common Issues

### Issue 1: Backup Not Found
**Fix:** Check backup location, verify backup schedule, check Supabase dashboard

### Issue 2: Restore Timeout
**Fix:** Increase timeout, restore in smaller chunks, contact Supabase support

### Issue 3: Data Inconsistency
**Fix:** Verify backup integrity, check restore logs, consider point-in-time recovery

### Issue 4: Migration Conflicts
**Fix:** Review migration history, resolve conflicts, re-run migrations if needed

## Escalation

### When to Escalate
- Restore fails after retry
- Data loss suspected
- Production outage >1 hour
- Migration conflicts unresolved

### Escalation Path
1. **On-call engineer** (Slack: #incidents)
2. **Database admin** for complex issues
3. **CTO** if data loss or extended outage

## Post-Restore

### Follow-up Actions
- [ ] Document restore reason and results
- [ ] Update backup procedures if needed
- [ ] Review backup schedule and retention
- [ ] Update this runbook with learnings

### Prevention
- Regular backup testing
- Automated backup verification
- Quarterly DR rehearsals
- Monitor backup success rates

## Related Resources
- Disaster Recovery: `ops/runbooks/DR.md`
- Backup Procedures: `ops/commands/snapshot.ts`
- Compliance Report: `SECURITY_COMPLIANCE_REPORT.md`
- Migration Guide: `docs/DEPLOYMENT.md`

---
**Important:** This runbook contains no PII. All restore operations should follow data privacy guidelines.

*Last updated: {{DATE}}*
