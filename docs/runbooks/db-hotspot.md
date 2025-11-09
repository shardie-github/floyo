# Database Hotspot Incident Runbook

## Overview
This runbook addresses database performance issues, hotspots, and query problems.

## Symptoms
- Slow query responses (>200ms)
- Database connection pool exhaustion
- High CPU/memory usage on database
- Timeout errors from database
- Lock contention warnings

## Quick Checks

### 1. Check Database Metrics
```bash
# Supabase dashboard → Database → Performance
# Check:
# - Active connections
# - Query performance
# - CPU/Memory usage
```

### 2. Identify Slow Queries
```sql
-- Supabase: Check query performance
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 3. Check Connection Pool
- Supabase dashboard → Database → Connection Pooling
- Verify pool usage < 80%
- Check for connection leaks

## Diagnostic Steps

### Step 1: Identify Hot Queries
1. Review Supabase query performance dashboard
2. Check for queries without indexes
3. Identify N+1 query patterns
4. Look for full table scans

### Step 2: Check Database Load
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Step 3: Review Application Patterns
- Check for missing connection pooling
- Review transaction duration
- Identify long-running queries
- Check for connection leaks

## Remediation Actions

### Immediate (0-15 min)
1. **Kill long-running queries** (if safe)
2. **Scale up** database instance if needed
3. **Enable** query timeout limits
4. **Restart** connection pool if stuck

### Short-term (15-60 min)
1. **Add missing indexes** for slow queries
2. **Optimize queries** (use EXPLAIN ANALYZE)
3. **Implement** query result caching
4. **Fix** N+1 query patterns

### Long-term (Post-incident)
1. **Add** query monitoring and alerting
2. **Implement** read replicas for analytics
3. **Review** database schema for optimization
4. **Add** query performance budgets

## What to Capture

### Metrics to Log
- Query execution times (P50, P95, P99)
- Connection pool usage
- Database CPU/Memory usage
- Lock contention metrics
- Table sizes and growth rates

### Logs to Collect
```sql
-- Slow query log
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 200 
ORDER BY mean_exec_time DESC;

-- Connection info
SELECT * FROM pg_stat_activity 
WHERE state = 'active';
```

### Screenshots/Dashboards
- Supabase query performance dashboard
- Connection pool metrics
- Database resource usage graphs
- Query execution plans (EXPLAIN ANALYZE)

## Common Hotspot Patterns

### Pattern 1: Missing Indexes
**Symptoms:** Full table scans, slow WHERE clauses
**Fix:** Add indexes on frequently queried columns
```sql
CREATE INDEX idx_table_column ON table(column);
```

### Pattern 2: N+1 Queries
**Symptoms:** Many small queries instead of one join
**Fix:** Use JOINs or batch loading in application code

### Pattern 3: Connection Leaks
**Symptoms:** Pool exhaustion, connections not released
**Fix:** Ensure proper connection cleanup, use connection pooling

### Pattern 4: Long Transactions
**Symptoms:** Locks held for extended periods
**Fix:** Reduce transaction scope, commit frequently

## Database Safety Rails

### Migration Canary
- **Flag:** `MIGRATION_CANARY` must be `true` for destructive operations
- **Check:** Verify flag before running migrations
- **Documentation:** See `README.md` for migration procedures

### Read-Only Analytics Role
- Use separate read-only role for analytics queries
- Prevents accidental writes from reporting tools
- Configure in Supabase dashboard

### Backup Verification
- Check backup evidence in `SECURITY_COMPLIANCE_REPORT.md`
- Verify backup metadata present
- Test restore procedure quarterly

## Escalation

### When to Escalate
- Database unavailable >5 minutes
- Data corruption suspected
- Connection pool exhausted
- Critical query timeout >30s

### Escalation Path
1. **On-call engineer** (Slack: #incidents)
2. **Database admin** if schema changes needed
3. **CTO** if data loss risk

## Post-Incident

### Follow-up Actions
- [ ] Root cause analysis document
- [ ] Add query performance monitoring
- [ ] Update indexes and query optimization
- [ ] Update this runbook with learnings

### Prevention
- Set up alerts for slow queries (>200ms)
- Weekly database performance review
- Regular index optimization
- Connection pool monitoring

## Related Resources
- Database Schema: `prisma/schema.prisma`, `supabase/migrations/`
- Migration Guide: `docs/DEPLOYMENT.md`
- Backup Procedures: `docs/runbooks/restore.md`
- Compliance Report: `SECURITY_COMPLIANCE_REPORT.md`

---
*Last updated: {{DATE}}*
