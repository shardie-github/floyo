# Operations Runbook

**Last Updated:** 2025-01-XX  
**Status:** Active Operations Guide  
**Owner:** DevOps Team

This runbook provides step-by-step procedures for common operational tasks, incident response, and system maintenance.

---

## Table of Contents

1. [Monitoring & Health Checks](#monitoring--health-checks)
2. [Deployment Procedures](#deployment-procedures)
3. [Incident Response](#incident-response)
4. [Database Operations](#database-operations)
5. [Secret Management](#secret-management)
6. [Feature Flag Management](#feature-flag-management)
7. [Logging & Debugging](#logging--debugging)
8. [Performance Tuning](#performance-tuning)
9. [Backup & Recovery](#backup--recovery)

---

## Monitoring & Health Checks

### Health Check Endpoints

**Application Health:**
```bash
curl https://your-app.vercel.app/api/health
```

**Detailed Health Check:**
```bash
curl https://your-app.vercel.app/api/monitoring/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "supabase": "connected",
  "timestamp": "2025-01-XXT00:00:00Z"
}
```

### Key Metrics to Monitor

1. **Database Connection Pool**
   - Check: `/api/monitoring/health` includes pool status
   - Alert if: `checked_out >= pool_size + max_overflow`
   - Fix: Increase pool size or optimize queries

2. **API Response Times**
   - Check: Vercel Analytics or Sentry
   - Alert if: P95 latency > 2s
   - Fix: Optimize slow queries, add caching

3. **Error Rate**
   - Check: Sentry error rate
   - Alert if: Error rate > 1%
   - Fix: Investigate errors, fix bugs

4. **Retention Policy Compliance**
   - Check: Data older than retention period exists
   - Alert if: Retention cleanup fails
   - Fix: Run cleanup job manually, investigate failures

---

## Deployment Procedures

### Pre-Deployment Checklist

1. **Code Review**
   - [ ] All tests passing
   - [ ] Security checklist reviewed
   - [ ] No secrets in code

2. **Environment Variables**
   - [ ] All required variables set in Vercel
   - [ ] Secrets rotated if needed
   - [ ] Run `npm run env:validate`

3. **Database Migrations**
   - [ ] Migrations tested locally
   - [ ] RLS policies reviewed
   - [ ] Backup created before migration

4. **Dependencies**
   - [ ] `npm audit` passes
   - [ ] Vulnerable dependencies updated
   - [ ] Lock files committed

### Deployment Steps

**Frontend (Vercel):**
```bash
# Automatic deployment on push to main
git push origin main

# Manual deployment
vercel deploy --prod
```

**Database Migrations (Supabase):**
```bash
# Link project
supabase link --project-ref $SUPABASE_PROJECT_REF

# Check migration status
supabase db remote commit --dry-run

# Apply migrations
supabase db push
```

**Backend (Python):**
```bash
# Deploy to production server
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Post-Deployment Verification

1. **Health Checks**
   ```bash
   curl https://your-app.vercel.app/api/health
   curl https://your-app.vercel.app/api/monitoring/health
   ```

2. **Smoke Tests**
   - [ ] Login works
   - [ ] API endpoints respond
   - [ ] Database queries succeed

3. **Monitor Logs**
   - Check Vercel logs for errors
   - Check Sentry for exceptions
   - Monitor error rate

---

## Incident Response

### Severity Levels

- **P0 (Critical):** Service down, data loss, security breach
- **P1 (High):** Major feature broken, significant performance degradation
- **P2 (Medium):** Minor feature broken, performance issues
- **P3 (Low):** Cosmetic issues, minor bugs

### Incident Response Procedure

#### 1. Detect & Assess

**Check Health Status:**
```bash
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/monitoring/health
```

**Check Logs:**
- Vercel logs: Dashboard → Logs
- Sentry: Dashboard → Issues
- Supabase logs: Dashboard → Logs

**Assess Impact:**
- How many users affected?
- What functionality is broken?
- Is data at risk?

#### 2. Contain

**Disable Feature Flags:**
```python
# Via database
UPDATE feature_flags SET kill_switch = true WHERE name = 'affected_feature';
```

**Block Malicious Traffic:**
- Vercel: Block IPs in dashboard
- Rate limiting: Adjust limits in `rate_limit.py`

**Revoke Compromised Secrets:**
- Rotate `SECRET_KEY` if exposed
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if exposed
- Revoke API keys if compromised

#### 3. Investigate

**Check Error Logs:**
```bash
# Vercel logs
vercel logs --follow

# Supabase logs
supabase logs
```

**Check Database:**
```sql
-- Check for suspicious activity
SELECT * FROM security_audit 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Check Recent Deployments:**
- Review recent commits
- Check for configuration changes
- Review dependency updates

#### 4. Remediate

**Fix Code:**
- Create hotfix branch
- Fix issue
- Test locally
- Deploy fix

**Rollback (if needed):**
```bash
# Vercel rollback
vercel rollback

# Database rollback (if migration issue)
supabase db reset --linked
```

#### 5. Post-Incident

**Document Incident:**
- What happened?
- Root cause?
- Impact?
- Resolution?

**Update Runbook:**
- Add new procedures
- Update checklists
- Improve monitoring

**Post-Mortem:**
- Schedule post-mortem meeting
- Document lessons learned
- Create action items

---

## Database Operations

### Connection Pool Management

**Check Pool Status:**
```python
from backend.database import get_pool_status
status = get_pool_status()
print(status)
```

**Pool Exhaustion:**
- Symptoms: "Connection pool exhausted" errors
- Fix: Increase `pool_size` or `max_overflow` in `config.py`
- Monitor: Add pool metrics to health check

### Migration Management

**Create Migration:**
```bash
supabase migration new migration_name
```

**Apply Migration:**
```bash
# Local
supabase db reset

# Remote
supabase db push
```

**Rollback Migration:**
```bash
# Manual rollback SQL
supabase db reset --linked
```

### Query Optimization

**Slow Query Detection:**
```sql
-- Enable slow query logging
SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Index Management:**
```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;
```

---

## Secret Management

### Secret Rotation Procedure

**1. Generate New Secret:**
```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate CRON_SECRET
openssl rand -hex 16
```

**2. Update Environment Variables:**
- Vercel: Dashboard → Settings → Environment Variables
- Supabase: Dashboard → Settings → API
- Local: Update `.env.local`

**3. Restart Services:**
- Vercel: Redeploy (automatic on env var change)
- Backend: Restart server
- Cron jobs: Restart if needed

**4. Verify:**
- Check health endpoints
- Test authentication
- Verify cron jobs work

### Secret Audit

**Check for Exposed Secrets:**
```bash
npm run audit:secrets
```

**Git History Audit:**
```bash
git log --all --full-history --source -- "*.env*" "*.key"
```

**Rotate if Found:**
- Follow secret rotation procedure
- Update git history if needed (consult security team)

---

## Feature Flag Management

### Enable/Disable Feature

**Via Database:**
```sql
-- Enable feature
UPDATE feature_flags SET enabled = true WHERE name = 'feature_name';

-- Disable feature
UPDATE feature_flags SET enabled = false WHERE name = 'feature_name';

-- Emergency kill switch
UPDATE feature_flags SET kill_switch = true WHERE name = 'feature_name';
```

**Via API (if implemented):**
```bash
curl -X POST https://your-app.vercel.app/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "feature_name", "enabled": true}'
```

### Gradual Rollout

**Set Rollout Percentage:**
```sql
UPDATE feature_flags 
SET rollout_percentage = 25 
WHERE name = 'feature_name';
```

**Monitor Rollout:**
- Check error rates
- Monitor user feedback
- Review analytics

---

## Logging & Debugging

### Log Locations

**Application Logs:**
- Vercel: Dashboard → Logs
- Supabase: Dashboard → Logs
- Backend: Console output (if running locally)

**Error Tracking:**
- Sentry: Dashboard → Issues
- Logs include stack traces, user context

### Debugging Procedures

**Enable Debug Logging:**
```bash
# Set log level
export LOG_LEVEL=DEBUG

# Restart service
```

**Check Specific User:**
```sql
-- Find user events
SELECT * FROM events WHERE user_id = 'user-uuid' ORDER BY timestamp DESC LIMIT 100;

-- Find user sessions
SELECT * FROM sessions WHERE user_id = 'user-uuid' ORDER BY created_at DESC;
```

**Check API Errors:**
```bash
# Check Sentry for errors
# Filter by endpoint, user, time range
```

---

## Performance Tuning

### Database Performance

**Connection Pool Tuning:**
```python
# In config.py
database_pool_size = 20  # Increase if needed
database_max_overflow = 30  # Increase if needed
```

**Query Optimization:**
- Add indexes for frequently queried columns
- Use `EXPLAIN ANALYZE` to optimize queries
- Avoid N+1 queries

### API Performance

**Caching:**
```python
# Use Redis cache
from backend.cache import cached

@cached(ttl=300)
def expensive_operation():
    # ...
```

**Rate Limiting:**
```python
# Adjust rate limits in rate_limit.py
RATE_LIMIT_PER_MINUTE = 60
RATE_LIMIT_PER_HOUR = 1000
```

---

## Backup & Recovery

### Backup Procedures

**Supabase Backups:**
- Automatic: Supabase handles daily backups
- Manual: Dashboard → Database → Backups → Create backup

**Database Export:**
```bash
# Export schema
supabase db dump --schema-only > schema.sql

# Export data
supabase db dump --data-only > data.sql
```

### Recovery Procedures

**Restore from Backup:**
1. Go to Supabase Dashboard → Database → Backups
2. Select backup to restore
3. Confirm restore (this will overwrite current database)

**Point-in-Time Recovery:**
- Supabase Pro plan supports PITR
- Contact Supabase support for PITR restore

**Test Recovery:**
- Quarterly: Test backup restoration
- Document: Recovery time objectives (RTO), recovery point objectives (RPO)

---

## Maintenance Windows

### Scheduled Maintenance

**Weekly:**
- Review error logs
- Check security alerts
- Review performance metrics

**Monthly:**
- Rotate secrets (if needed)
- Review and update dependencies
- Test backup restoration

**Quarterly:**
- Full security audit
- Performance review
- Disaster recovery testing

---

## Emergency Contacts

- **On-Call Engineer:** [Add contact]
- **Security Team:** [Add contact]
- **Supabase Support:** support@supabase.com
- **Vercel Support:** [Add contact]

---

## Change Log

- **2025-01-XX**: Initial operations runbook created
