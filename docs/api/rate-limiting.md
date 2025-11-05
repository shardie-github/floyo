# API Rate Limiting Guide

## Overview

Rate limiting protects your API endpoints from abuse and ensures fair resource allocation. The CRUX+HARDEN upgrade includes a token bucket rate limiter that can be used in any API route.

## Basic Usage

### In-Memory Rate Limiter

```typescript
import { rateLimit } from '@/lib/utils/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limit: 30 requests per bucket, refills at 10/sec
  if (!rateLimit(`api:${ip}`, 30, 10)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Your handler logic here
  return NextResponse.json({ success: true });
}
```

### KV-Based Rate Limiter (Multi-Instance)

For production with multiple instances, use the KV-based rate limiter:

```typescript
import { rateLimitKV, initKVRateLimiter } from '@/lib/utils/rate-limit-kv';

// Initialize once (e.g., in app initialization)
initKVRateLimiter(
  process.env.UPSTASH_REDIS_URL,
  process.env.UPSTASH_REDIS_TOKEN
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Uses Redis if available, falls back to memory
  if (!(await rateLimitKV(`api:${ip}`, 30, 10))) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  return NextResponse.json({ success: true });
}
```

## Configuration

### Rate Limit Parameters

- **Key**: Unique identifier (usually IP address or user ID)
- **Capacity**: Maximum tokens in bucket (default: 30)
- **Refill Rate**: Tokens per second (default: 10)

### Recommended Limits

| Endpoint Type | Capacity | Refill Rate |
|--------------|----------|-------------|
| Public API   | 30       | 10/sec      |
| Authenticated| 100      | 20/sec      |
| Admin API    | 1000     | 100/sec     |

## Error Handling

### 429 Too Many Requests

When rate limit is exceeded, return a 429 status with helpful headers:

```typescript
if (!rateLimit(key, 30, 10)) {
  return NextResponse.json(
    { 
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: 60 // seconds
    },
    { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0',
      }
    }
  );
}
```

## Integration with Metrics

Track rate limit hits:

```typescript
import { metrics, metricNames } from '@/lib/obs/metrics';

if (!rateLimit(key, 30, 10)) {
  metrics.increment(metricNames.RATE_LIMIT_HITS, 1, { endpoint: '/api/ingest' });
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

## Per-Endpoint Customization

Different endpoints can have different limits:

```typescript
// Strict limit for ingest
if (!rateLimit(`ingest:${ip}`, 100, 20)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}

// More lenient for reads
if (!rateLimit(`read:${ip}`, 1000, 100)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

## Feature Flag

Enable/disable rate limiting via feature flag:

```typescript
import flags from '@/config/flags.crux.json';

if (flags.rate_limit_api) {
  if (!rateLimit(key, 30, 10)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
}
```

## Testing

### Test Rate Limiting

```typescript
// In your test file
import { rateLimit } from '@/lib/utils/rate-limit';

describe('Rate Limiter', () => {
  it('should allow requests under limit', () => {
    const key = 'test-key';
    expect(rateLimit(key, 30, 10)).toBe(true);
  });

  it('should reject requests over limit', () => {
    const key = 'test-key-2';
    // Exhaust bucket
    for (let i = 0; i < 31; i++) {
      rateLimit(key, 30, 10);
    }
    expect(rateLimit(key, 30, 10)).toBe(false);
  });
});
```

## Troubleshooting

### Rate Limiter Not Working

1. Check feature flag: `flags.rate_limit_api` must be `true`
2. Verify key uniqueness: Use IP address or user ID
3. Check memory limits: In-memory limiter is per-instance

### KV Rate Limiter Issues

1. Check Redis connection: Verify `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`
2. Check fallback: KV limiter falls back to memory if Redis unavailable
3. Enable feature flag: Set `rate_limit_kv_enabled: true`

## Migration Guide

### From In-Memory to KV

1. Install dependencies:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. Initialize KV limiter:
   ```typescript
   import { initKVRateLimiter } from '@/lib/utils/rate-limit-kv';
   initKVRateLimiter(process.env.UPSTASH_REDIS_URL, process.env.UPSTASH_REDIS_TOKEN);
   ```

3. Update imports:
   ```typescript
   // Before
   import { rateLimit } from '@/lib/utils/rate-limit';
   
   // After
   import { rateLimitKV } from '@/lib/utils/rate-limit-kv';
   ```

4. Enable feature flag:
   ```json
   { "rate_limit_kv_enabled": true }
   ```

## Best Practices

1. **Use consistent keys**: IP address for anonymous, user ID for authenticated
2. **Set appropriate limits**: Balance between security and usability
3. **Monitor rate limit hits**: Track in metrics for capacity planning
4. **Return helpful errors**: Include retry-after headers
5. **Test limits**: Ensure they don't block legitimate users
