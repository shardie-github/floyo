# Next Steps & Future Enhancements: CRUX+HARDEN

**Generated:** 2025-11-05  
**Status:** Identified features and updates for future iterations

## Immediate Next Steps (Post-Merge)

### 1. Edge Function Hardening
**Priority:** High  
**Files:** `supabase/functions/*/index.ts`

Add timeout guards and input validation to existing edge functions:
- `analyze-patterns/index.ts` - Add timeout (30s), input size limits, retry logic
- `generate-suggestions/index.ts` - Add timeout (30s), input validation

**Implementation:** Create `supabase/functions/_shared/guardrails.ts` with reusable utilities.

### 2. Retry Logic Utility
**Priority:** High  
**File:** `frontend/lib/utils/retry.ts` (NEW)

Create reusable retry helper for HTTP requests and async operations:
```typescript
// Use with exponential backoff and jitter
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxTries?: number; baseDelay?: number }
): Promise<T>
```

**Usage:** When `lib/crux/executor.ts` is created, patch it to use this utility.

### 3. Ingest API Route Guardrails
**Priority:** Medium  
**File:** `frontend/app/api/ingest/route.ts` (WHEN CREATED)

Add input validation and size limits:
- Max payload size: 1MB
- Rate limiting via `rateLimit()` utility
- Input schema validation (Zod)
- Error handling with structured logging

### 4. RLS Verification Script
**Priority:** Medium  
**File:** `scripts/verify-rls.ts` (NEW)

Create read-only verification script to test RLS policies:
- Test user isolation
- Test service_role bypass restrictions
- Generate report of policy coverage

### 5. Secrets Audit Script
**Priority:** Medium  
**File:** `scripts/audit-secrets.ts` (NEW)

Scan codebase for potential secrets:
- Hardcoded API keys
- Plaintext passwords
- Exposed tokens
- Generate `.env.ci.example` entries

## Short-Term Enhancements (Next Sprint)

### 6. Queue Shim for Workflow Runs
**Priority:** Medium  
**File:** `frontend/lib/crux/queue.ts` (NEW)

In-DB status tracking + reprocessor:
- Status table: `workflow_runs(status, retries, error)`
- Reprocessor: Cleanup job for failed runs
- Retry with exponential backoff

### 7. Enhanced Observability
**Priority:** Low  
**Files:** `frontend/lib/obs/sentry.ts`, `frontend/lib/obs/metrics.ts`

- Sentry integration (if DSN provided)
- Metrics counters (events ingested, workflows run, error rates)
- Performance monitoring hooks

### 8. Bundle Analyzer Integration
**Priority:** Low  
**Status:** Infrastructure ready, needs:
- Install `@next/bundle-analyzer` package
- Run `ANALYZE=true npm run build` periodically
- Set up CI job for bundle size monitoring

### 9. CSP Policy Customization
**Priority:** Low  
**File:** `frontend/app/headers.ts`

When `csp_headers` flag is enabled:
- Environment-specific CSP policies
- Nonce generation for inline scripts
- Hash-based CSP for static assets
- Whitelist management for third-party embeds

## Medium-Term Features (Future Roadmap)

### 10. Rate Limiter KV Store Migration
**Priority:** Low  
**Enhancement:** Replace in-memory buckets with Redis/Upstash

When multi-instance scaling is needed:
- Use `@upstash/ratelimit` or Redis
- Fallback to in-memory if KV unavailable
- Feature flag: `rate_limit_kv_enabled`

### 11. Workflow Executor with Retries
**Priority:** High  
**File:** `frontend/lib/crux/executor.ts` (NEW)

When workflow execution is implemented:
- HTTP request retries with jitter
- Step-level retry configuration
- Dead letter queue for failed workflows
- Use `withRetry()` utility from step 2

### 12. Migration Tooling
**Priority:** Low  
**File:** `scripts/migrate-concurrent.sh` (NEW)

Helper script for concurrent index creation:
- Detect transaction wrapping
- Split migrations automatically
- Run via CLI outside transaction

### 13. Performance Monitoring Dashboard
**Priority:** Low  
**File:** `frontend/app/admin/performance/page.tsx` (NEW)

- Bundle size trends
- API response times
- Error rates
- Rate limit hit rates

## Documentation Updates Needed

### 14. API Rate Limiting Guide
**File:** `docs/api/rate-limiting.md` (NEW)

Document:
- How to use rate limiter in API routes
- Default limits and configuration
- Custom rate limits per endpoint
- Error handling (429 responses)

### 15. Security Headers Guide
**File:** `docs/security/headers.md` (NEW)

Document:
- CSP policy customization
- Header configuration
- Testing embedded content
- Troubleshooting CSP violations

### 16. Observability Guide
**File:** `docs/ops/observability.md` (NEW)

Document:
- Structured logging usage
- Sentry integration (when available)
- Metrics collection
- Performance monitoring

## Implementation Checklist

### Phase 1: Critical Security & Reliability
- [x] Edge function timeout guards (`supabase/functions/_shared/guardrails.ts`)
- [x] Edge function input validation (`supabase/functions/_shared/guardrails.ts`)
- [x] Retry logic utility (`frontend/lib/utils/retry.ts`)
- [x] RLS verification script (`scripts/verify-rls.ts`)

### Phase 2: API Hardening
- [ ] Ingest API route guardrails (when route exists)
- [ ] Rate limiting integration in API routes
- [x] Secrets audit script (`scripts/audit-secrets.ts`)

### Phase 3: Observability & Monitoring
- [ ] Sentry integration (conditional)
- [ ] Metrics collection
- [ ] Performance dashboard

### Phase 4: Scalability
- [ ] Queue shim for workflow runs
- [ ] KV store migration for rate limiter
- [ ] Workflow executor with retries

## Feature Flag Additions

Add to `config/flags.crux.json` when implementing:

```json
{
  "edge_function_timeouts": false,
  "edge_function_validation": false,
  "retry_logic_enabled": false,
  "ingest_guardrails": false,
  "queue_shim_enabled": false,
  "sentry_enabled": false,
  "metrics_collection": false,
  "rate_limit_kv_enabled": false
}
```

## Testing Priorities

1. **Security**: RLS verification, secrets audit
2. **Reliability**: Retry logic, timeout guards
3. **Performance**: Bundle analyzer, metrics
4. **Scalability**: Queue shim, KV migration

## Notes

- All future features should follow the same non-destructive pattern
- Use feature flags for gradual rollout
- Create backups before patching
- Document in `docs/upgrade/README.md` as features are added
