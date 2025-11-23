# Operations Runbook

**Last Updated:** 2025-01-XX  
**Status:** ✅ Complete  
**Purpose:** Operational procedures for running Floyo in production

---

## Table of Contents

1. [Health Checks](#health-checks)
2. [Monitoring](#monitoring)
3. [Incident Response](#incident-response)
4. [Deployment](#deployment)
5. [Database Operations](#database-operations)
6. [Troubleshooting](#troubleshooting)

---

## Health Checks

### Check Application Health

```bash
# Basic health check
curl http://localhost:8000/health

# Readiness check (includes dependencies)
curl http://localhost:8000/health/readiness

# Detailed health check
curl http://localhost:8000/health/detailed

# Frontend health check
curl http://localhost:3000/api/health
```

### Expected Responses

**Healthy:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Unhealthy:**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": "error",
    "message": "Connection timeout"
  }
}
```

---

## Monitoring

### Key Metrics to Monitor

1. **Response Times**
   - P95 latency < 200ms
   - P99 latency < 500ms
   - Average latency < 100ms

2. **Error Rates**
   - Error rate < 0.1%
   - 5xx errors < 0.01%

3. **Database**
   - Connection pool utilization < 80%
   - Query time < 100ms (P95)

4. **Cache**
   - Hit rate > 80%
   - Miss rate < 20%

### Monitoring Endpoints

```bash
# Performance metrics
curl http://localhost:8000/api/monitoring/performance \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Cache statistics
curl http://localhost:8000/api/monitoring/cache/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Database pool status
curl http://localhost:8000/api/monitoring/database/pool \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Incident Response

### Severity Levels

**P0 - Critical**
- Service completely down
- Data loss or corruption
- Security breach

**P1 - High**
- Major feature broken
- Performance degradation (>50%)
- Partial service outage

**P2 - Medium**
- Minor feature broken
- Performance degradation (<50%)
- Non-critical errors

**P3 - Low**
- Cosmetic issues
- Documentation errors
- Enhancement requests

### Response Procedures

#### 1. Acknowledge Incident

```bash
# Check health endpoints
curl http://localhost:8000/health/detailed

# Check logs
tail -f /var/log/floyo/app.log

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"
```

#### 2. Identify Root Cause

```bash
# Check error logs
grep ERROR /var/log/floyo/app.log | tail -100

# Check database logs
# Check application metrics
curl http://localhost:8000/api/monitoring/performance
```

#### 3. Mitigate

**Database Issues:**
```bash
# Check connection pool
curl http://localhost:8000/api/monitoring/database/pool

# Restart if needed
systemctl restart floyo-backend
```

**Memory Issues:**
```bash
# Check memory usage
free -h

# Restart service
systemctl restart floyo-backend
```

**High Error Rate:**
```bash
# Check error patterns
grep ERROR /var/log/floyo/app.log | awk '{print $5}' | sort | uniq -c

# Enable circuit breaker if needed
# (Already implemented in code)
```

#### 4. Communicate

- Update status page
- Notify team via Slack/email
- Document incident in runbook

#### 5. Post-Mortem

- Document root cause
- Identify prevention measures
- Update runbook with learnings

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Database migrations reviewed
- [ ] Environment variables updated
- [ ] Health checks passing
- [ ] Backup database
- [ ] Notify team

### Deployment Steps

#### Backend Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Run database migrations
alembic upgrade head

# 4. Run tests
pytest tests/ -v

# 5. Restart service
systemctl restart floyo-backend

# 6. Verify health
curl http://localhost:8000/health
```

#### Frontend Deployment

```bash
# 1. Build
cd frontend && npm run build

# 2. Deploy to Vercel (automatic via GitHub)
# Or manually:
vercel deploy --prod

# 3. Verify deployment
curl https://your-app.vercel.app/api/health
```

### Rollback Procedure

```bash
# Backend rollback
git checkout <previous-commit>
pip install -r backend/requirements.txt
alembic downgrade -1  # If needed
systemctl restart floyo-backend

# Frontend rollback
# Via Vercel dashboard or:
vercel rollback
```

---

## Database Operations

### Backup

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_20250115_103000.sql
```

### Migrations

```bash
# Check migration status
alembic current
alembic heads

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Create new migration
alembic revision --autogenerate -m "description"
```

### Query Optimization

```bash
# Check slow queries
psql $DATABASE_URL -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# Analyze table
psql $DATABASE_URL -c "ANALYZE table_name;"
```

---

## Troubleshooting

### Common Issues

#### 1. High Database Connection Pool Usage

**Symptoms:**
- Slow response times
- Connection pool errors
- High database latency

**Solution:**
```bash
# Check pool status
curl http://localhost:8000/api/monitoring/database/pool

# Increase pool size in config
# Or restart service to clear connections
systemctl restart floyo-backend
```

#### 2. Cache Miss Rate High

**Symptoms:**
- Slow API responses
- High database load
- Cache hit rate < 50%

**Solution:**
```bash
# Check cache stats
curl http://localhost:8000/api/monitoring/cache/stats

# Clear cache if needed
redis-cli FLUSHDB

# Check cache configuration
# Verify Redis is running
redis-cli PING
```

#### 3. Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Service restarts needed frequently

**Solution:**
```bash
# Check memory usage
ps aux | grep floyo

# Check for memory leaks in logs
grep "memory" /var/log/floyo/app.log

# Restart service
systemctl restart floyo-backend
```

#### 4. High Error Rate

**Symptoms:**
- Many 5xx errors in logs
- Users reporting issues

**Solution:**
```bash
# Check error patterns
grep ERROR /var/log/floyo/app.log | tail -100

# Check circuit breaker status
# (Already implemented)

# Check database connectivity
curl http://localhost:8000/health/readiness
```

---

## Performance Tuning

### Database Optimization

```sql
-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Cache Optimization

```bash
# Check cache hit rate
curl http://localhost:8000/api/monitoring/cache/stats

# Target: > 80% hit rate
# If low, consider:
# - Increasing cache TTL
# - Caching more frequently accessed data
# - Checking cache invalidation patterns
```

---

## Security

### Security Checklist

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials
- [ ] HTTPS enabled in production
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (CSP headers)
- [ ] CSRF protection enabled

### Security Incident Response

1. **Immediate Actions**
   - Isolate affected systems
   - Preserve logs
   - Notify security team

2. **Investigation**
   - Review access logs
   - Check for data exfiltration
   - Identify attack vector

3. **Remediation**
   - Patch vulnerabilities
   - Rotate credentials
   - Update security controls

---

## Useful Commands

### Logs

```bash
# View application logs
tail -f /var/log/floyo/app.log

# Search logs
grep ERROR /var/log/floyo/app.log

# Filter by time
grep "2025-01-15" /var/log/floyo/app.log
```

### Service Management

```bash
# Check status
systemctl status floyo-backend

# Restart service
systemctl restart floyo-backend

# View logs
journalctl -u floyo-backend -f
```

### Database

```bash
# Connect to database
psql $DATABASE_URL

# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Kill long-running queries
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';"
```

---

**Generated by:** Post-Sprint Elevation Agent  
**Status:** ✅ Operations Runbook Complete
