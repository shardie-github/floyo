# API Latency Incident Runbook

## Overview
This runbook addresses API latency regressions and performance degradation.

## Symptoms
- API P95 latency > 400ms (SLO breach)
- TTFB > 200ms
- Increased error rates
- User complaints about slow responses

## Quick Checks

### 1. Verify Current Metrics
```bash
curl https://your-domain.com/api/metrics | jq '.performance'
```

Check dashboard: `/admin/metrics`

### 2. Check Database Performance
```bash
# Supabase dashboard → Database → Query Performance
# Look for slow queries (>200ms)
```

### 3. Review Recent Changes
- Check recent deployments: `git log --oneline -10`
- Review PRs merged in last 24h
- Check for new dependencies or config changes

## Diagnostic Steps

### Step 1: Identify Hotspots
1. Check `/api/metrics` for latency breakdown by endpoint
2. Review Supabase query logs for slow queries
3. Check Vercel Edge Function logs for timeouts

### Step 2: Check External Dependencies
```bash
# Test external API latency
curl -w "@curl-format.txt" https://api.external-service.com/health
```

### Step 3: Review Infrastructure
- Vercel: Check function execution time in dashboard
- Supabase: Review connection pool usage
- Edge: Check cache hit rates

## Remediation Actions

### Immediate (0-15 min)
1. **Enable caching** for high-traffic endpoints
2. **Scale up** database connection pool if needed
3. **Enable CDN** for static assets
4. **Check for** DDoS or traffic spikes

### Short-term (15-60 min)
1. **Add database indexes** for slow queries
2. **Optimize queries** (use EXPLAIN ANALYZE)
3. **Implement rate limiting** if traffic spike
4. **Review** and optimize N+1 queries

### Long-term (Post-incident)
1. **Add query monitoring** and alerting
2. **Implement** query result caching
3. **Review** API design for optimization opportunities
4. **Add** performance budgets to CI/CD

## What to Capture

### Metrics to Log
- P50, P95, P99 latency by endpoint
- Database query times
- Error rates and types
- Request volume and patterns
- Cache hit/miss rates

### Logs to Collect
```bash
# Vercel logs
vercel logs --follow

# Supabase logs (via dashboard)
# Application logs
tail -f logs/app.log | grep -i "latency\|slow\|timeout"
```

### Screenshots/Dashboards
- `/admin/metrics` dashboard state
- Supabase query performance dashboard
- Vercel function analytics
- Error tracking (Sentry/LogRocket)

## Escalation

### When to Escalate
- P95 > 1000ms for >5 minutes
- Error rate > 5%
- Database connection pool exhausted
- External dependency outage

### Escalation Path
1. **On-call engineer** (Slack: #incidents)
2. **Team lead** if unresolved in 30 min
3. **CTO** if production outage

## Post-Incident

### Follow-up Actions
- [ ] Root cause analysis document
- [ ] Update monitoring alerts
- [ ] Add regression tests
- [ ] Update this runbook with learnings

### Prevention
- Set up alerts for P95 > 350ms (warning threshold)
- Weekly performance review
- Load testing before major releases

## Related Resources
- Dashboard: `/admin/metrics`
- SLO Policy: `ops.config.json`
- Performance Report: `PERFORMANCE_REPORT.md`
- API Documentation: `docs/api/`

---
*Last updated: {{DATE}}*
