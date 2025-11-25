# Environment Variables & Secrets Management

**Generated:** 2025-01-20  
**Agent:** Unified Background Agent v3.0  
**Status:** Complete

## Overview

This project uses **235+ environment variables** across multiple categories. All variables are documented in `.env.example` and validated via `scripts/env-doctor.ts`.

## Environment Variable Categories

### 1. Database (Required)

**Variables:**
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `SUPABASE_DB_URL` - Alternative Supabase DB URL format

**Usage:**
- Backend database connections
- Prisma client initialization
- Connection pooling

**Security:** ⚠️ Contains credentials - never commit to git

### 2. Supabase - Server-side (Required)

**Variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `SUPABASE_JWT_SECRET` - JWT secret for token validation

**Usage:**
- Backend API authentication
- Database operations
- Admin operations

**Security:** 🔒 Critical - service role key has admin access

### 3. Supabase - Public (Required)

**Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase anonymous key

**Usage:**
- Frontend client initialization
- Client-side authentication
- Public API calls

**Security:** ⚠️ Exposed to client - safe for public use

### 4. Supabase - CLI/Deployment (Optional)

**Variables:**
- `SUPABASE_ACCESS_TOKEN` - CLI access token
- `SUPABASE_PROJECT_REF` - Project reference ID

**Usage:**
- CI/CD migrations
- Supabase CLI operations
- Deployment automation

### 5. Vercel (Optional - CI/CD)

**Variables:**
- `VERCEL_TOKEN` - Deployment token
- `VERCEL_ORG_ID` - Organization ID
- `VERCEL_PROJECT_ID` - Project ID
- `VERCEL_CRON_SECRET` - Cron job secret

**Usage:**
- Vercel deployments
- Preview deployments
- Production deployments
- Cron job authentication

### 6. Application (Optional)

**Variables:**
- `NODE_ENV` - Node environment (development/production)
- `ENVIRONMENT` - Application environment
- `FRONTEND_URL` - Frontend URL (for redirects)
- `NEXT_PUBLIC_API_URL` - Public API URL
- `NEXT_PUBLIC_SITE_URL` - Public site URL

**Usage:**
- Environment detection
- URL generation
- API client configuration

### 7. Security & Secrets (Optional)

**Variables:**
- `SECRET_KEY` - Application secret key (JWT, encryption)
- `SNAPSHOT_ENCRYPTION_KEY` - Encryption key for snapshots
- `CRON_SECRET` - Cron job authentication secret
- `ADMIN_BASIC_AUTH` - Admin basic auth (username:password)

**Usage:**
- JWT signing
- Data encryption
- Cron job security
- Admin access

**Security:** 🔒 Critical - never expose

### 8. Payment Processing (Optional)

**Variables:**
- `STRIPE_API_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

**Usage:**
- Payment processing
- Subscription management
- Webhook verification

**Security:** 🔒 Critical - financial data

### 9. Monitoring & Observability (Optional)

**Variables:**
- `SENTRY_DSN` - Sentry error tracking DSN
- `NEXT_PUBLIC_SENTRY_DSN` - Public Sentry DSN
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL

**Usage:**
- Error tracking
- Performance monitoring
- User analytics

### 10. Feature Flags (Optional)

**Variables:**
- `PRIVACY_KILL_SWITCH` - Privacy kill switch (server)
- `NEXT_PUBLIC_PRIVACY_KILL_SWITCH` - Privacy kill switch (client)
- `NEXT_PUBLIC_TRUST_STATUS_PAGE` - Trust status page flag
- `NEXT_PUBLIC_TRUST_HELP_CENTER` - Trust help center flag
- `NEXT_PUBLIC_TRUST_EXPORT` - Trust export flag
- `NEXT_PUBLIC_CSP_ENABLED` - Content Security Policy flag
- `NEXT_PUBLIC_CSP_ALLOWLIST` - CSP allowlist

**Usage:**
- Feature toggles
- Privacy controls
- Security features

### 11. Integrations (Optional)

**Variables:**
- `NEXT_PUBLIC_HCAPTCHA_SITEKEY` - hCaptcha site key
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region
- `AWS_S3_BUCKET` - S3 bucket name

**Usage:**
- CAPTCHA verification
- Image uploads
- File storage

**Security:** 🔒 AWS credentials - critical

### 12. Redis (Optional)

**Variables:**
- `REDIS_URL` - Redis connection URL
- `CELERY_BROKER_URL` - Celery broker URL
- `CELERY_RESULT_BACKEND` - Celery result backend

**Usage:**
- Caching
- Rate limiting
- Background job queue

### 13. External Integrations (Optional - Not Yet Configured)

**Variables:**
- `OPENAI_API_KEY` - OpenAI API key
- `TIKTOK_ADS_API_KEY` - TikTok Ads API key
- `TIKTOK_ADS_API_SECRET` - TikTok Ads API secret
- `META_ADS_ACCESS_TOKEN` - Meta Ads access token
- `META_ADS_APP_ID` - Meta Ads app ID
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `AUTODS_API_KEY` - AutoDS API key
- `CAPCUT_API_KEY` - CapCut API key
- `ZAPIER_SECRET` - Zapier webhook secret
- `MINSTUDIO_API_KEY` - MindStudio API key

**Usage:**
- AI features
- Marketing integrations
- Workflow automation

### 14. Infrastructure / CI/CD (Optional)

**Variables:**
- `GENERIC_SOURCE_A_TOKEN` - Generic source A token
- `GENERIC_SOURCE_B_TOKEN` - Generic source B token
- `SLACK_WEBHOOK_URL` - Slack webhook URL
- `TZ` - Timezone
- `API_BASE_URL` - API base URL
- `PROD_URL` - Production URL
- `PARTNER_HMAC_KEY` - Partner HMAC key

**Usage:**
- CI/CD automation
- Notifications
- External integrations

### 15. Next.js Configuration (Optional)

**Variables:**
- `REVALIDATE_SECONDS` - ISR revalidation default
- `ANALYZE` - Bundle analyzer flag

**Usage:**
- Next.js configuration
- Build optimization

## Environment Setup

### Local Development

1. **Copy .env.example:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in values:**
   - Get Supabase credentials from Supabase Dashboard
   - Get Vercel credentials from Vercel Dashboard
   - Add optional integrations as needed

3. **Validate:**
   ```bash
   npm run env:validate
   npm run env:doctor
   ```

### Production (Vercel)

1. **Set in Vercel Dashboard:**
   - Go to Project → Settings → Environment Variables
   - Add all required variables
   - Set for Production, Preview, and Development

2. **Pull locally:**
   ```bash
   vercel env pull .env.local
   ```

### CI/CD (GitHub Actions)

1. **Set secrets:**
   - Go to Repository → Settings → Secrets and variables → Actions
   - Add required secrets
   - Use environment-specific secrets

2. **Reference in workflows:**
   ```yaml
   env:
     SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
   ```

## Validation

### Environment Doctor

**Script:** `scripts/env-doctor.ts`

**Checks:**
- ✅ Variables used but not documented
- ✅ Variables documented but never used
- ✅ Inconsistent naming (casing, spelling)
- ✅ Missing required variables

**Usage:**
```bash
npm run env:doctor
```

### Environment Validator

**Script:** `frontend/lib/env.ts` (validatePublicEnv)

**Checks:**
- ✅ Required public variables present
- ✅ Variable format validation
- ✅ Type validation

**Usage:**
```bash
npm run env:validate
```

## Security Best Practices

### ✅ Do's

1. **Never commit .env files** - Use .gitignore
2. **Use .env.example** - Document all variables
3. **Rotate secrets regularly** - Especially API keys
4. **Use different values** - Dev/staging/prod
5. **Limit access** - Only grant necessary permissions
6. **Monitor usage** - Track secret access

### ❌ Don'ts

1. **Don't hardcode secrets** - Use environment variables
2. **Don't share secrets** - Use secure channels
3. **Don't log secrets** - Filter from logs
4. **Don't expose in client** - Only NEXT_PUBLIC_ vars
5. **Don't use production secrets** - In development

## Secret Rotation

### Automated Rotation

**Script:** `npm run ops:rotate-secrets`

**Process:**
1. Generate new secrets
2. Update in hosting provider
3. Update in CI/CD secrets
4. Deploy with new secrets
5. Verify functionality
6. Remove old secrets

### Manual Rotation

1. Generate new secret
2. Update in all environments
3. Deploy
4. Verify
5. Remove old secret

## Environment Parity

### Dev = Staging = Prod

**Checklist:**
- ✅ Same environment variables (different values)
- ✅ Same database schema
- ✅ Same API versions
- ✅ Same feature flags (different states)

**Validation:**
```bash
npm run env:doctor  # Check variable consistency
npm run schema:validate  # Check schema alignment
```

## Troubleshooting

### Missing Variables

**Symptoms:** Application errors about missing env vars

**Solutions:**
1. Check .env.local exists
2. Run `npm run env:doctor`
3. Verify variable names match
4. Check for typos

### Wrong Values

**Symptoms:** Authentication errors, connection failures

**Solutions:**
1. Verify Supabase credentials
2. Check DATABASE_URL format
3. Verify API keys are correct
4. Check environment (dev vs prod)

### Variable Not Loading

**Symptoms:** Variables undefined in code

**Solutions:**
1. Restart dev server
2. Check .env.local location
3. Verify NEXT_PUBLIC_ prefix for client vars
4. Check variable name casing

## Required vs Optional

### Required (Production)

**Must be set for production:**
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Optional (Features)

**Enable features:**
- Payment: `STRIPE_API_KEY`
- Analytics: `NEXT_PUBLIC_POSTHOG_KEY`
- Error tracking: `SENTRY_DSN`
- Storage: `AWS_ACCESS_KEY_ID`
- Integrations: Various API keys

## Documentation

**Complete List:** See `.env.example` for all 235+ variables

**Categories:**
- Database (2 variables)
- Supabase (7 variables)
- Vercel (4 variables)
- Application (5 variables)
- Security (4 variables)
- Payment (2 variables)
- Monitoring (4 variables)
- Feature Flags (7 variables)
- Integrations (15+ variables)
- Infrastructure (10+ variables)
- External APIs (10+ variables)

---

**Generated by Unified Background Agent v3.0**  
**Last Updated:** 2025-01-20
