# Troubleshooting Guide

**Generated:** 2025-01-20  
**Agent:** Unified Background Agent v3.0  
**Status:** Complete

## Common Issues & Solutions

### Deployment Issues

#### Build Failures

**Symptoms:**
- CI/CD build fails
- TypeScript errors
- Missing dependencies

**Solutions:**
1. **Check build logs:**
   ```bash
   npm run build
   ```

2. **Verify dependencies:**
   ```bash
   npm ci
   cd frontend && npm ci
   ```

3. **Check TypeScript errors:**
   ```bash
   npm run type-check
   ```

4. **Clear cache and rebuild:**
   ```bash
   rm -rf node_modules frontend/node_modules frontend/.next
   npm ci && cd frontend && npm ci && npm run build
   ```

#### Migration Failures

**Symptoms:**
- Database migration fails
- Schema drift errors
- Migration conflicts

**Solutions:**
1. **Check migration status:**
   ```bash
   supabase migration list
   ```

2. **Validate schema alignment:**
   ```bash
   npm run schema:validate
   ```

3. **Reset local (development only):**
   ```bash
   supabase db reset
   ```

4. **Create alignment migration:**
   ```bash
   npm run migrations:align
   ```

### Environment Variable Issues

#### Missing Environment Variables

**Symptoms:**
- Application errors about undefined variables
- Authentication failures
- Database connection errors

**Solutions:**
1. **Run environment doctor:**
   ```bash
   npm run env:doctor
   ```

2. **Check .env.local exists:**
   ```bash
   cp .env.example .env.local
   # Fill in values
   ```

3. **Validate environment:**
   ```bash
   npm run env:validate
   ```

4. **Check Vercel environment variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Verify all required variables are set

#### Wrong Environment Variable Values

**Symptoms:**
- Authentication errors
- Database connection failures
- API errors

**Solutions:**
1. **Verify Supabase credentials:**
   - Check Supabase Dashboard → Settings → API
   - Verify URLs and keys match

2. **Check variable names:**
   - Ensure `NEXT_PUBLIC_` prefix for client-side variables
   - Verify casing matches exactly

3. **Restart development server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### Database Issues

#### Connection Errors

**Symptoms:**
- "Connection refused" errors
- "Database unavailable" errors
- Timeout errors

**Solutions:**
1. **Check DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Check Supabase status:**
   - Visit Supabase Dashboard
   - Check project status

4. **Verify connection pooling:**
   - Check pool size settings
   - Monitor connection usage

#### Query Performance Issues

**Symptoms:**
- Slow API responses
- Timeout errors
- High database CPU usage

**Solutions:**
1. **Check slow queries:**
   ```bash
   # Enable slow query log in Supabase
   ```

2. **Review indexes:**
   ```bash
   npm run schema:validate
   ```

3. **Optimize queries:**
   - Use EXPLAIN ANALYZE
   - Add missing indexes
   - Optimize query patterns

### API Issues

#### Authentication Errors

**Symptoms:**
- 401 Unauthorized errors
- Token expired errors
- Invalid token errors

**Solutions:**
1. **Check JWT token:**
   - Verify token is valid
   - Check token expiration
   - Verify token format

2. **Check Supabase Auth:**
   - Verify user exists
   - Check user status
   - Verify email verification

3. **Check RLS policies:**
   ```bash
   npm run verify:rls
   ```

#### Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- Rate limit headers present

**Solutions:**
1. **Check rate limit headers:**
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 95
   ```

2. **Implement backoff:**
   - Use exponential backoff
   - Respect Retry-After header

3. **Optimize requests:**
   - Batch requests
   - Cache responses
   - Reduce request frequency

### Performance Issues

#### Slow Page Loads

**Symptoms:**
- High First Contentful Paint (FCP)
- High Largest Contentful Paint (LCP)
- Slow Time to Interactive (TTI)

**Solutions:**
1. **Check bundle size:**
   ```bash
   npm run perf:check
   ```

2. **Optimize images:**
   - Use Next.js Image component
   - Optimize image formats
   - Implement lazy loading

3. **Enable caching:**
   - Check CDN cache headers
   - Implement service worker caching
   - Use React Query caching

#### High API Latency

**Symptoms:**
- Slow API responses
- Timeout errors
- High p95/p99 latency

**Solutions:**
1. **Check performance budgets:**
   ```bash
   npm run perf:check
   ```

2. **Optimize database queries:**
   - Add indexes
   - Optimize query patterns
   - Use connection pooling

3. **Implement caching:**
   - Redis caching
   - CDN caching
   - Application-level caching

### Security Issues

#### Secrets Exposure

**Symptoms:**
- Secrets in logs
- Secrets in git history
- Secrets exposed in client

**Solutions:**
1. **Audit secrets:**
   ```bash
   npm run audit:secrets
   ```

2. **Rotate exposed secrets:**
   ```bash
   npm run rotate-secrets:dry-run
   npm run rotate-secrets
   ```

3. **Check git history:**
   ```bash
   git log --all --full-history -- .env*
   ```

#### RLS Policy Issues

**Symptoms:**
- Unauthorized data access
- Missing data
- Permission errors

**Solutions:**
1. **Verify RLS policies:**
   ```bash
   npm run verify:rls
   ```

2. **Check policy definitions:**
   - Review Supabase migrations
   - Verify policy conditions
   - Test with different users

## Debugging Tools

### Local Development

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Environment Validation:**
```bash
npm run env:validate
npm run env:doctor
```

**Schema Validation:**
```bash
npm run schema:validate
```

### Production Debugging

**Health Check:**
```bash
curl https://your-app.vercel.app/api/health
```

**Comprehensive Health:**
```bash
curl https://your-app.vercel.app/api/health/comprehensive
```

**Monitoring:**
- Sentry: Error tracking and performance
- PostHog: Analytics and user behavior
- Vercel Analytics: Performance metrics

## Getting Help

### Documentation

1. **Architecture:** `docs/stack-discovery.md`
2. **API:** `docs/api.md`
3. **Deployment:** `docs/deploy-strategy.md`
4. **Environment:** `docs/env-and-secrets.md`

### Support Channels

1. **GitHub Issues:** Create issue with relevant labels
2. **Documentation:** Check `docs/` directory
3. **Logs:** Check Sentry, Vercel logs, Supabase logs

### Escalation

1. **Check monitoring dashboards**
2. **Review error logs**
3. **Check recent deployments**
4. **Contact team lead**

---

**Generated by Unified Background Agent v3.0**  
**Last Updated:** 2025-01-20
