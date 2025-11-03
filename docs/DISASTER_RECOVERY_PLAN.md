# Disaster Recovery Plan for Floyo

## Overview

This document outlines the disaster recovery (DR) procedures for the Floyo application, including backup strategies, recovery objectives, and incident response procedures.

## Recovery Objectives

### Recovery Time Objective (RTO)
- **Target**: 4 hours for full system restoration
- **Maximum Acceptable**: 24 hours

### Recovery Point Objective (RPO)
- **Target**: 1 hour (maximum data loss)
- **Maximum Acceptable**: 24 hours

## Backup Strategy

### Database Backups

#### Full Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Location**: Primary backup storage + remote backup
- **Format**: PostgreSQL custom format (compressed)

#### Incremental Backups
- **Frequency**: Every 6 hours
- **Retention**: 7 days
- **Location**: Primary backup storage
- **Format**: PostgreSQL WAL archiving (if enabled)

#### Backup Locations
1. **Primary**: `./backups/` (local filesystem)
2. **Secondary**: Remote S3 bucket (if configured)
3. **Tertiary**: Off-site backup server (if configured)

#### Backup Verification
- Automated verification after each backup
- Monthly full restore test
- Quarterly DR drill

### Application Data Backups

#### User Uploaded Files
- Backed up daily via storage snapshot
- Retention: 90 days

#### Configuration Files
- Version controlled in Git
- Daily export to backup storage

## Recovery Procedures

### Database Recovery

#### Full Database Restore
```bash
# Stop application services
docker-compose down

# Restore from backup
python scripts/backup_database.py restore --file backups/floyo_full_YYYYMMDD_HHMMSS.sql.gz --drop-existing

# Verify database integrity
psql -d floyo -c "SELECT COUNT(*) FROM users;"

# Restart services
docker-compose up -d
```

#### Point-in-Time Recovery (if WAL archiving enabled)
```bash
# Restore base backup
python scripts/backup_database.py restore --file backups/floyo_full_YYYYMMDD_HHMMSS.sql.gz

# Apply WAL logs up to target time
# (Requires pg_basebackup and WAL archiving setup)
```

### Application Recovery

#### Infrastructure Recovery
1. Provision new infrastructure using Infrastructure as Code
2. Restore environment variables from secure vault
3. Restore SSL certificates
4. Configure DNS and load balancers

#### Code Deployment
1. Deploy from latest Git tag
2. Run database migrations
3. Verify health checks
4. Gradually enable traffic

### Communication Plan

#### Internal Notification
- **Immediate**: Notify engineering team via Slack/email
- **Within 1 hour**: Status update to stakeholders
- **Ongoing**: Hourly updates until resolution

#### Customer Communication
- **If RTO < 4 hours**: No customer notification needed
- **If RTO > 4 hours**: Status page update + email notification
- **If RTO > 24 hours**: Public incident report

## Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms:**
- Database connection errors
- Data inconsistency reports
- Application errors

**Recovery Steps:**
1. Immediately stop writes to database
2. Assess corruption extent
3. If repairable: Run `REINDEX` and `VACUUM FULL`
4. If not repairable: Restore from most recent backup
5. Replay any transactions since backup (if possible)
6. Verify data integrity
7. Resume normal operations

**RTO**: 2-4 hours
**RPO**: 1-24 hours (depending on backup frequency)

### Scenario 2: Total Server Failure

**Symptoms:**
- Complete service unavailability
- Infrastructure unreachable

**Recovery Steps:**
1. Activate disaster recovery infrastructure
2. Provision new servers
3. Restore database from latest backup
4. Deploy application code
5. Update DNS/load balancer configuration
6. Verify all services
7. Resume traffic gradually

**RTO**: 4-8 hours
**RPO**: 24 hours (from last backup)

### Scenario 3: Data Center Outage

**Symptoms:**
- Regional service unavailability
- Infrastructure provider status page indicates outage

**Recovery Steps:**
1. Verify outage with provider
2. Activate failover to secondary region (if configured)
3. Or provision infrastructure in alternative region
4. Restore database from remote backup
5. Deploy application to new region
6. Update DNS to point to new region

**RTO**: 8-24 hours
**RPO**: 24 hours

### Scenario 4: Security Breach

**Symptoms:**
- Unusual access patterns
- Security alerts
- Data exfiltration detected

**Recovery Steps:**
1. Immediately isolate affected systems
2. Preserve evidence for forensic analysis
3. Revoke compromised credentials
4. Restore from clean backup (before breach)
5. Patch security vulnerabilities
6. Rotate all secrets and certificates
7. Notify affected users (per GDPR requirements)
8. Conduct post-mortem and implement mitigations

**RTO**: 24-48 hours
**RPO**: Variable (may need backup from before breach)

## Testing and Validation

### Backup Testing
- **Weekly**: Automated backup verification
- **Monthly**: Manual restore test to staging
- **Quarterly**: Full DR drill

### DR Drill Schedule
- **Q1**: Database corruption scenario
- **Q2**: Total server failure scenario
- **Q3**: Data center outage scenario
- **Q4**: Security breach scenario

## Monitoring and Alerts

### Critical Alerts
- Backup failures
- Database replication lag
- Disk space below threshold
- Unusual error rates

### Alert Channels
- **PagerDuty**: For critical outages
- **Slack**: For team notifications
- **Email**: For stakeholder updates

## Contacts

### On-Call Rotation
- Primary: [Engineering Lead]
- Secondary: [Senior Engineer]
- Escalation: [CTO]

### External Contacts
- Database Provider: [Contact Info]
- Infrastructure Provider: [Contact Info]
- Backup Storage Provider: [Contact Info]

## Appendix

### Backup Script Usage
```bash
# Create full backup
python scripts/backup_database.py backup --full

# Create incremental backup
python scripts/backup_database.py backup --incremental

# List backups
python scripts/backup_database.py list

# Restore backup
python scripts/backup_database.py restore --file backups/floyo_full_YYYYMMDD_HHMMSS.sql.gz

# Cleanup old backups
python scripts/backup_database.py cleanup
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `BACKUP_DIR`: Backup storage directory
- `BACKUP_RETENTION_DAYS`: Days to retain backups (default: 30)
- `BACKUP_COMPRESSION`: Enable compression (true/false)

### Backup Metadata
Each backup includes a metadata file (`.meta.json`) with:
- Backup type (full/incremental)
- Timestamp
- Database name
- Size
- Compression status
