# Environment Variable Inventory

Generated: ${new Date().toISOString()}

## Required Variables

| Variable | Consumer | Purpose | Status |
|----------|----------|---------|--------|
| `DATABASE_URL` | Backend | PostgreSQL connection string | ? |
| `SECRET_KEY` | Backend | JWT signing key | ? |
| `API_BASE_URL` | Frontend/Backend | Base API URL | ? |

## Optional Variables (with Fallbacks)

| Variable | Consumer | Purpose | Fallback | Status |
|----------|----------|---------|----------|--------|
| `SUPABASE_URL` | Backend | Supabase project URL | Mock Supabase | ?? |
| `SUPABASE_KEY` | Backend | Supabase anon key | Mock auth | ?? |
| `REDIS_URL` | Backend | Redis connection | In-memory cache | ?? |
| `STRIPE_SECRET_KEY` | Backend | Stripe API key | stripe-mock | ?? |
| `POSTHOG_API_KEY` | Frontend | PostHog analytics | noop analytics | ?? |
| `SENDGRID_API_KEY` | Backend | SendGrid email | Console logging | ?? |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Backend | OpenTelemetry | Disabled | ?? |

## Detection of Dead/Unused Secrets

Run `grep -r "process.env\." frontend/` and `grep -r "os.getenv" backend/` to find actual usage.

## Recommendations

1. **Critical**: Set `SECRET_KEY` in production (never use default)
2. **Important**: Configure `REDIS_URL` for production caching
3. **Optional**: Add Supabase if using Supabase Auth/RLS
4. **Optional**: Add Stripe for real payments (use stripe-mock for tests)
