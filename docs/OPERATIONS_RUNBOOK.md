# Operations Runbook
## Common Operations and Troubleshooting

**Last Updated:** 2025-01-15

---

## Health Checks

### Backend Health Check
```bash
curl http://localhost:8000/health
```

### Frontend Health Check
```bash
curl http://localhost:3000/api/health
```

### Database Health Check
```bash
# Via Supabase CLI
supabase db remote commit --dry-run
```

---

## Common Operations

### Generate Sample Data
```bash
npm run generate-sample-data -- --userId <user-id> --events 100 --daysBack 30
```

### Run Metrics Aggregation
```bash
# Daily aggregation
python -m backend.jobs.metrics_aggregation --daily

# Weekly aggregation
python -m backend.jobs.metrics_aggregation --weekly
```

### Calculate Retention Rates
```bash
python -m backend.jobs.retention_analysis --cohort-date 2025-01-01
python -m backend.jobs.retention_analysis --weeks 12
```

### Run Load Tests
```bash
# Install k6 first: https://k6.io/docs/getting-started/installation/
k6 run k6/load-test-activation.js
```

### Clear Cache
```python
from backend.cache import clear_cache
clear_cache()
```

---

## Debugging

### Check Activation Events
```sql
SELECT action, COUNT(*) 
FROM audit_logs 
WHERE action LIKE 'activation_event:%' 
GROUP BY action;
```

### Check Slow Queries
```sql
-- Requires pg_stat_statements extension
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### View Cache Statistics
```python
from backend.cache import get_cache_stats
print(get_cache_stats())
```

---

## Troubleshooting

### Activation Events Not Tracking
1. Check backend logs: `tail -f logs/backend.log`
2. Verify endpoint: `curl -X POST http://localhost:8000/api/analytics/track -d '{"events":[]}'`
3. Check database: Query `audit_logs` table

### Dashboard Loading Slowly
1. Check cache hit rate: `get_cache_stats()`
2. Analyze slow queries: Run query optimizer
3. Check database indexes: Verify indexes exist

### Metrics Not Aggregating
1. Check cron jobs: `crontab -l`
2. Run manually: `python -m backend.jobs.metrics_aggregation --daily`
3. Check logs: `/var/log/floyo-metrics-daily.log`

---

## Emergency Procedures

### Database Backup
```bash
# Supabase handles backups automatically
# Manual backup:
supabase db dump > backup_$(date +%Y%m%d).sql
```

### Rollback Deployment
```bash
# Vercel: Use dashboard to rollback
# Supabase: Use migration rollback
supabase migration repair --status reverted <migration_name>
```

### Clear All Caches
```python
from backend.cache import clear_cache, invalidate_pattern
clear_cache()
invalidate_pattern("*")  # Clear all
```

---

**For more details, see:** `/docs/OPERATIONS_RUNBOOK.md`
