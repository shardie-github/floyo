# API Documentation

**Generated:** 2025-01-20  
**Agent:** Unified Background Agent v3.0  
**Status:** Complete

## API Overview

This application exposes APIs through two layers:
1. **Next.js API Routes** (`frontend/app/api/*`) - Server-side API handlers
2. **FastAPI Backend** (`backend/api/*`) - Python backend API

**Total Endpoints:** 95+ Next.js routes + 38+ FastAPI endpoints

## Authentication

All protected endpoints require authentication via Supabase JWT token.

**Header Format:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Token Source:**
- Obtained from Supabase Auth after login
- Stored in session/cookies
- Automatically included in API requests

## API Base URLs

**Development:**
- Frontend API: `http://localhost:3000/api`
- Backend API: `http://localhost:8000/api`

**Production:**
- Frontend API: `https://your-app.vercel.app/api`
- Backend API: `https://your-backend.vercel.app/api` (if deployed separately)

## Endpoint Categories

### Authentication (`/api/auth/*`)

**Next.js Routes:**
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/2fa/status` - Get 2FA status
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `POST /api/auth/2fa/disable` - Disable 2FA

**FastAPI Routes:**
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/refresh` - Refresh token

### Privacy (`/api/privacy/*`)

**Next.js Routes:**
- `GET /api/privacy/settings` - Get privacy settings
- `PUT /api/privacy/settings` - Update privacy settings
- `GET /api/privacy/apps` - Get app allowlist
- `POST /api/privacy/apps` - Add app to allowlist
- `DELETE /api/privacy/apps/:id` - Remove app from allowlist
- `GET /api/privacy/signals` - Get signal toggles
- `PUT /api/privacy/signals` - Update signal toggles
- `POST /api/privacy/consent` - Give/revoke consent
- `GET /api/privacy/score` - Get privacy score
- `GET /api/privacy/log` - Get privacy transparency log
- `POST /api/privacy/export` - Export user data
- `POST /api/privacy/delete` - Delete user data
- `POST /api/privacy/mfa/check` - Check MFA requirement
- `POST /api/privacy/mfa/verify` - Verify MFA
- `POST /api/privacy/cron/cleanup` - Cleanup expired data (cron)

### Telemetry (`/api/telemetry/*`)

**Next.js Routes:**
- `GET /api/telemetry` - Get telemetry events
- `POST /api/telemetry` - Create telemetry event
- `POST /api/telemetry/ingest` - Bulk ingest telemetry
- `GET /api/telemetry/tti` - Get Time to Interactive metrics
- `GET /api/telemetry/overlay-diagnostics` - Get overlay diagnostics
- `GET /api/telemetry/indirect-inputs` - Get indirect input events

**FastAPI Routes:**
- `GET /api/v1/telemetry` - Get telemetry events
- `POST /api/v1/telemetry` - Create telemetry event

### Events (`/api/events`)

**Next.js Routes:**
- `GET /api/events` - Get file events
- `POST /api/events` - Create file event

**FastAPI Routes:**
- `GET /api/v1/events` - Get events
- `POST /api/v1/events` - Create event

### Patterns (`/api/patterns`)

**Next.js Routes:**
- `GET /api/patterns` - Get usage patterns
- `POST /api/patterns` - Create pattern

**FastAPI Routes:**
- `GET /api/v1/patterns` - Get patterns
- `POST /api/v1/patterns` - Create pattern

### Insights (`/api/insights/*`)

**Next.js Routes:**
- `GET /api/insights` - Get insights
- `GET /api/insights/stats` - Get insight statistics
- `GET /api/insights/patterns` - Get pattern insights
- `GET /api/insights/time` - Get time-based insights
- `GET /api/insights/comparison` - Compare insights

**FastAPI Routes:**
- `GET /api/v1/insights` - Get insights

### Analytics (`/api/analytics/*`)

**Next.js Routes:**
- `GET /api/analytics/dashboard` - Get analytics dashboard
- `POST /api/analytics/track` - Track analytics event
- `GET /api/analytics/activation-funnel` - Get activation funnel

**FastAPI Routes:**
- `GET /api/analytics/dashboard` - Get analytics dashboard

### Workflows (`/api/workflows`)

**Next.js Routes:**
- `GET /api/workflows` - Get workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow

**FastAPI Routes:**
- `GET /api/v1/workflows` - Get workflows
- `POST /api/v1/workflows` - Create workflow
- `PUT /api/v1/workflows/:id` - Update workflow
- `DELETE /api/v1/workflows/:id` - Delete workflow

### Integrations (`/api/integrations/*`)

**Next.js Routes:**
- `GET /api/integrations/status` - Get integration status
- `GET /api/integrations/zapier/status` - Get Zapier status
- `POST /api/integrations/zapier/connect` - Connect Zapier
- `DELETE /api/integrations/zapier/disconnect` - Disconnect Zapier
- `GET /api/integrations/mindstudio/status` - Get MindStudio status
- `POST /api/integrations/mindstudio/connect` - Connect MindStudio
- `POST /api/integrations/mindstudio/sync` - Sync MindStudio
- `DELETE /api/integrations/mindstudio/disconnect` - Disconnect MindStudio
- `GET /api/integrations/meta/campaigns` - Get Meta campaigns
- `POST /api/integrations/meta/oauth` - Meta OAuth
- `GET /api/integrations/tiktok/campaigns` - Get TikTok campaigns
- `POST /api/integrations/tiktok/oauth` - TikTok OAuth
- `POST /api/integrations/elevenlabs/synthesize` - Synthesize audio

**FastAPI Routes:**
- `GET /api/integrations/zapier` - Zapier webhook handler
- `POST /api/integrations/zapier` - Zapier webhook handler
- `GET /api/integrations/tiktok` - TikTok integration
- `POST /api/integrations/tiktok` - TikTok integration
- `GET /api/integrations/meta` - Meta integration
- `POST /api/integrations/meta` - Meta integration

### Billing (`/api/billing/*`)

**Next.js Routes:**
- `GET /api/billing/plans` - Get subscription plans
- `POST /api/billing/subscribe` - Subscribe to plan
- `POST /api/billing/cancel` - Cancel subscription

**FastAPI Routes:**
- `GET /api/v1/billing/plans` - Get plans
- `POST /api/v1/billing/subscribe` - Subscribe
- `POST /api/v1/billing/cancel` - Cancel

### Admin (`/api/admin/*`)

**Next.js Routes:**
- `GET /api/admin/nps` - Get NPS submissions
- `GET /api/admin/revenue` - Get revenue metrics

**FastAPI Routes:**
- `GET /api/admin/users` - Get users
- `GET /api/admin/stats` - Get admin stats

### Monitoring (`/api/monitoring/*`)

**Next.js Routes:**
- `GET /api/monitoring/health` - Health check
- `GET /api/monitoring/performance` - Performance metrics
- `GET /api/monitoring/errors` - Error logs
- `GET /api/monitoring/security` - Security events

### Health (`/api/health/*`)

**Next.js Routes:**
- `GET /api/health` - Basic health check
- `GET /api/health/comprehensive` - Comprehensive health check

### Metrics (`/api/metrics/*`)

**Next.js Routes:**
- `GET /api/metrics` - Get metrics
- `POST /api/metrics/collect` - Collect metrics (cron)

### Other Endpoints

**Next.js Routes:**
- `GET /api/stats` - Get statistics
- `GET /api/suggestions` - Get suggestions
- `GET /api/search` - Search
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/data/export` - Export data
- `GET /api/backup/list` - List backups
- `GET /api/audit/me` - Get audit log
- `POST /api/feedback` - Submit feedback
- `GET /api/flags` - Get feature flags
- `GET /api/docs` - API documentation
- `GET /api/env/validate` - Validate environment
- `GET /api/env-test` - Test environment
- `GET /api/wiring-status` - Get wiring status
- `GET /api/gamification/achievements` - Get achievements
- `GET /api/gamification/stats` - Get gamification stats
- `POST /api/reco/floyo` - Floyo recommendations
- `GET /api/marketplace/financial` - Marketplace financial data
- `GET /api/marketplace/moderate` - Marketplace moderation
- `POST /api/nps/submit` - Submit NPS survey
- `GET /api/team/invite` - Invite team member
- `GET /api/team/members` - Get team members
- `POST /api/etl/meta` - Meta ETL
- `POST /api/etl/tiktok` - TikTok ETL
- `POST /api/etl/shopify` - Shopify ETL
- `POST /api/etl/metrics` - Metrics ETL
- `GET /api/ai/predictions` - AI predictions
- `GET /api/ai/insights` - AI insights
- `POST /api/ai/chat` - AI chat
- `GET /api/ai/recommendations` - AI recommendations

## Request/Response Formats

### Standard Request Format

**JSON Body:**
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Query Parameters:**
```
?limit=100&offset=0&sort=createdAt&order=desc
```

### Standard Response Format

**Success (200):**
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

**Error (4xx/5xx):**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## Error Codes

**Authentication:**
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `TOKEN_EXPIRED` - Token expired

**Validation:**
- `VALIDATION_ERROR` - Request validation failed
- `MISSING_FIELD` - Required field missing
- `INVALID_FORMAT` - Invalid data format

**Business Logic:**
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMITED` - Rate limit exceeded

**Server:**
- `INTERNAL_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service unavailable

## Rate Limiting

**Default Limits:**
- Authenticated: 100 requests/minute
- Unauthenticated: 10 requests/minute
- Webhooks: 1000 requests/minute

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Pagination

**Query Parameters:**
- `limit` - Number of items per page (default: 20, max: 100)
- `offset` - Number of items to skip (default: 0)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100,
    "hasMore": true
  }
}
```

## Webhooks

**Supported Webhooks:**
- Zapier
- Stripe (payment events)
- Custom integrations

**Webhook Format:**
```json
{
  "event": "event_type",
  "timestamp": "2025-01-20T00:00:00Z",
  "data": { ... }
}
```

## OpenAPI Specification

**Location:** `openapi.json` (generated)

**Generate:**
```bash
npm run openapi:generate
```

**View:** Use Swagger UI or Redoc to view the OpenAPI spec

## API Versioning

**Current Version:** v1

**Versioning Strategy:**
- URL-based: `/api/v1/...`
- Header-based: `Accept: application/vnd.api+json;version=1`

**Deprecation Policy:**
- Deprecated endpoints marked in OpenAPI spec
- Deprecation notice in response headers
- 6-month deprecation period

## Testing

**Test Endpoints:**
- Health check: `GET /api/health`
- Environment test: `GET /api/env-test`

**Test Scripts:**
```bash
npm run api:audit  # Audit all endpoints
npm run test:e2e   # E2E API tests
```

## Security

**Authentication:**
- JWT tokens via Supabase Auth
- Token expiration: 1 hour (configurable)
- Refresh tokens: 7 days

**Authorization:**
- Row Level Security (RLS) at database level
- Role-based access control (RBAC)
- Organization-based permissions

**Security Headers:**
- CORS configured
- CSRF protection
- Rate limiting
- Input validation

## Performance

**Caching:**
- Redis cache for frequent queries
- CDN caching for static assets
- Browser caching via headers

**Optimization:**
- Database query optimization
- Connection pooling
- Background job processing

## Monitoring

**Metrics:**
- Request latency
- Error rates
- Throughput
- Database query performance

**Logging:**
- Structured logging
- Error tracking (Sentry)
- Performance monitoring

---

**Generated by Unified Background Agent v3.0**  
**Last Updated:** 2025-01-20
