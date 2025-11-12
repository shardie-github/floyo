> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Risk Assessment: CRUX+HARDEN Upgrade

## Risk Matrix

| Change | Risk Level | Impact | Mitigation |
|--------|-----------|--------|------------|
| New config files | LOW | None | Feature flags default OFF |
| New utility files | LOW | None | Must be explicitly imported |
| CSP headers | MEDIUM | May break embeds | Disabled by default (`csp_headers=false`) |
| Bundle analyzer | LOW | None | Conditional on `ANALYZE=true` |
| Migration indexes | MEDIUM | May conflict with existing | Uses `IF NOT EXISTS` |
| CI smoke tests | LOW | May fail CI | Non-blocking checks |

## Potential Conflicts

### 1. Migration Transaction Handling
**Risk:** Supabase migration runner may wrap in transaction  
**Impact:** `CREATE INDEX CONCURRENTLY` fails inside transaction  
**Mitigation:** 
- Migration uses `IF NOT EXISTS`
- If transaction wrapping detected, split to separate workflow step
- Documented in migration file comments

### 2. CSP Headers Breaking Third-Party Embeds
**Risk:** Strict CSP may block external resources  
**Impact:** UI breaks if CSP enabled  
**Mitigation:**
- CSP disabled by default (`csp_headers=false`)
- Minimal CSP policy (allows `https:` for images/scripts)
- Can be customized per environment

### 3. Rate Limiter Memory Usage
**Risk:** In-memory buckets may grow unbounded  
**Impact:** Memory leak in long-running processes  
**Mitigation:**
- In-memory fallback (can be replaced with KV store)
- Token bucket has natural expiration
- Rate limits are per-key (not global)

### 4. Bundle Analyzer Dependency
**Risk:** `@next/bundle-analyzer` not in package.json  
**Impact:** Build fails if ANALYZE=true  
**Mitigation:**
- Conditional require (wrapped in try-catch)
- Not installed by default
- Documented as optional

### 5. TypeScript Type Errors
**Risk:** New utilities may have type issues  
**Impact:** Type check fails  
**Mitigation:**
- TypeScript strict mode compatibility
- All utilities typed
- Will be caught by CI type-check step

### 6. Signals Table Missing
**Risk:** Migration references `signals` table that may not exist  
**Impact:** Migration fails  
**Mitigation:**
- Uses `IF NOT EXISTS` on index creation
- Index creation is idempotent
- Table existence check in migration comments

## Testing Checklist

- [ ] Type check passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Smoke tests pass (CI)
- [ ] Migration applies cleanly (test on staging)
- [ ] CSP headers don't break UI (if enabled)
- [ ] Rate limiter works as expected
- [ ] Logging utilities function correctly

## Rollback Triggers

Immediate rollback if:
1. Migration fails on production
2. Build fails after patch
3. Type errors introduced
4. CSP breaks critical UI flows (if enabled)

## Deployment Strategy

1. **Pre-merge:** All checks pass (type-check, build, tests)
2. **Merge:** PR merged to main
3. **Deploy:** CI applies migration → smoke tests → deploy
4. **Monitor:** Check logs for errors
5. **Enable flags:** Manually toggle flags as needed

## Long-term Considerations

- **Rate limiter:** Consider migrating to Redis/KV store for multi-instance
- **CSP:** Gradually tighten policy after confirming embed whitelists
- **Observability:** Integrate with Sentry if DSN provided
- **Bundle analyzer:** Run periodically to catch bundle bloat
