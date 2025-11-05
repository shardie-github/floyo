# Observability Guide

## Overview

The CRUX+HARDEN upgrade includes comprehensive observability tools: structured logging, metrics collection, and optional Sentry integration.

## Structured Logging

### Basic Usage

```typescript
import { log } from '@/lib/obs/log';

log.info('Event processed', { eventId: '123', userId: 'abc' });
log.warn('Rate limit approaching', { usage: 80, limit: 100 });
log.error('Processing failed', { error: err.message, stack: err.stack });
```

### Log Levels

- **info**: Informational messages
- **warn**: Warning messages (non-critical issues)
- **error**: Error messages (requires attention)

### Best Practices

1. **Include context**: Always include relevant metadata
2. **Use structured data**: Pass objects, not strings
3. **Avoid sensitive data**: Don't log passwords, tokens, etc.
4. **Consistent format**: Use consistent keys across logs

## Metrics Collection

### Basic Usage

```typescript
import { metrics, metricNames } from '@/lib/obs/metrics';

// Increment counter
metrics.increment(metricNames.EVENTS_INGESTED, 1, { 
  source: 'api' 
});

// Record gauge
metrics.gauge('active_users', 150);

// Record histogram (timing)
const start = Date.now();
await processEvent();
metrics.histogram('event_processing_time', Date.now() - start);
```

### Predefined Metrics

- `events.ingested` - Events ingested count
- `workflows.run` - Workflows executed
- `workflows.failed` - Failed workflows
- `api.requests` - API requests
- `api.errors` - API errors
- `rate_limit.hits` - Rate limit hits
- `db.queries` - Database queries
- `db.query_time` - Query execution time

### Custom Metrics

```typescript
metrics.increment('custom.metric', 1, { 
  category: 'custom',
  environment: 'production'
});
```

### Accessing Metrics

```typescript
// Get all counters
const counters = metrics.getCounters();

// Get all metrics
const allMetrics = metrics.getMetrics();

// Export for external systems
const exported = metrics.export();
```

## Sentry Integration

### Setup

1. Install Sentry (already in dependencies):
   ```bash
   npm install @sentry/nextjs
   ```

2. Initialize Sentry:
   ```typescript
   import { initSentry } from '@/lib/obs/sentry';

   initSentry(process.env.SENTRY_DSN);
   ```

3. Set environment variable:
   ```bash
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

### Usage

```typescript
import { sentry } from '@/lib/obs/sentry';

try {
  await riskyOperation();
} catch (error) {
  sentry.captureException(error, {
    context: { userId: '123', operation: 'process' }
  });
}

// Set user context
sentry.setUser({ id: '123', email: 'user@example.com' });

// Capture message
sentry.captureMessage('Important event', 'info');
```

### Feature Flag

Enable Sentry via feature flag:

```json
{
  "sentry_enabled": true
}
```

## Performance Monitoring

### Track API Response Times

```typescript
import { metrics } from '@/lib/obs/metrics';

export async function GET(req: Request) {
  const start = Date.now();
  
  try {
    const result = await fetchData();
    metrics.histogram('api.response_time', Date.now() - start, {
      endpoint: '/api/data',
      status: '200'
    });
    return Response.json(result);
  } catch (error) {
    metrics.histogram('api.response_time', Date.now() - start, {
      endpoint: '/api/data',
      status: '500'
    });
    throw error;
  }
}
```

### Track Database Queries

```typescript
const queryStart = Date.now();
const result = await db.query('SELECT * FROM users');
metrics.histogram('db.query_time', Date.now() - queryStart, {
  table: 'users',
  operation: 'select'
});
metrics.increment('db.queries', 1);
```

## Dashboard Integration

### View Metrics in Dashboard

Access the performance dashboard at `/admin/performance`:

```typescript
// Metrics are automatically displayed
// Updates every 5 seconds
```

### Export Metrics

```typescript
import { metrics } from '@/lib/obs/metrics';

// Export for Prometheus, DataDog, etc.
app.get('/metrics', (req, res) => {
  const exported = metrics.export();
  res.json(exported);
});
```

## Best Practices

### Logging

1. **Log at appropriate levels**: Use info/warn/error appropriately
2. **Include request IDs**: Track requests across services
3. **Avoid over-logging**: Don't log in tight loops
4. **Use structured logs**: JSON format for easy parsing

### Metrics

1. **Use consistent naming**: Follow naming conventions
2. **Include tags**: Add context via tags
3. **Monitor key metrics**: Track business-critical metrics
4. **Set up alerts**: Alert on error rate spikes

### Sentry

1. **Capture exceptions**: Use for unexpected errors
2. **Set user context**: Helpful for debugging
3. **Filter sensitive data**: Configure beforeSend
4. **Monitor performance**: Track slow operations

## Configuration

### Environment Variables

```bash
# Sentry
SENTRY_DSN=https://...

# Logging
LOG_LEVEL=info  # info, warn, error

# Metrics
METRICS_ENABLED=true
```

### Feature Flags

```json
{
  "observability_min": true,
  "sentry_enabled": false,
  "metrics_collection": true
}
```

## Troubleshooting

### Logs Not Appearing

1. Check log level configuration
2. Verify import path
3. Check browser console (client-side)
4. Check server logs (server-side)

### Metrics Not Updating

1. Verify metrics collection is enabled
2. Check feature flag: `metrics_collection`
3. Verify metrics are being called
4. Check dashboard refresh interval

### Sentry Not Working

1. Verify DSN is set correctly
2. Check network connectivity
3. Verify feature flag: `sentry_enabled`
4. Check Sentry dashboard for errors

## Integration Examples

### Express Middleware

```typescript
import { metrics, metricNames } from '@/lib/obs/metrics';
import { log } from '@/lib/obs/log';

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.histogram('api.response_time', duration, {
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
    
    log.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration
    });
  });
  
  next();
});
```

### Error Handler

```typescript
import { sentry } from '@/lib/obs/sentry';
import { metrics, metricNames } from '@/lib/obs/metrics';
import { log } from '@/lib/obs/log';

app.use((err, req, res, next) => {
  metrics.increment(metricNames.API_ERRORS, 1, {
    route: req.path,
    status: err.status || 500
  });
  
  log.error('Request failed', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  sentry.captureException(err, {
    context: { path: req.path, method: req.method }
  });
  
  res.status(err.status || 500).json({ error: err.message });
});
```
