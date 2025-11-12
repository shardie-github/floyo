> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Quick Reference: New Files & Utilities

## Utilities Created

### Rate Limiting
**File:** `frontend/lib/utils/rate-limit.ts`
```typescript
import { rateLimit } from '@/lib/utils/rate-limit';

// In API route
if (!rateLimit(ip, 30, 10)) {
  return new Response('Too Many Requests', { status: 429 });
}
```

### Retry Logic
**File:** `frontend/lib/utils/retry.ts`
```typescript
import { withRetry, isRetryableError } from '@/lib/utils/retry';

// Wrap async operations
const result = await withRetry(
  () => fetch(url),
  { maxTries: 3, shouldRetry: isRetryableError }
);
```

### Structured Logging
**File:** `frontend/lib/obs/log.ts`
```typescript
import { log } from '@/lib/obs/log';

log.info('Event processed', { eventId: '123' });
log.warn('Rate limit approaching', { usage: 80 });
log.error('Processing failed', { error });
```

### Edge Function Guardrails
**File:** `supabase/functions/_shared/guardrails.ts`
```typescript
import { createGuardrails } from '../_shared/guardrails.ts';

const guardrails = createGuardrails({
  maxExecutionTime: 30000,
  maxPayloadSize: 1024 * 1024,
});

serve(guardrails.withTimeout(async (req) => {
  guardrails.validatePayloadSize(await req.text());
  const { user } = await guardrails.validateAuth(supabaseClient, req.headers);
  // ... handler
}));
```

## Scripts Created

### RLS Verification
**File:** `scripts/verify-rls.ts`
```bash
npm run verify-rls
# or
tsx scripts/verify-rls.ts
```

### Secrets Audit
**File:** `scripts/audit-secrets.ts`
```bash
npm run audit-secrets
# or
tsx scripts/audit-secrets.ts
```

## Feature Flags

**File:** `config/flags.crux.json`

Key flags:
- `csp_headers`: false (enable after testing embeds)
- `rate_limit_api`: true (protection enabled)
- `observability_min`: true (logging enabled)

## Next Steps

See `docs/upgrade/NEXT_STEPS.md` for:
- Future enhancements roadmap
- Implementation checklist
- Feature flag additions
- Testing priorities
