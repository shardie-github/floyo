# Environment Variables & Secrets Management

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive guide to environment variables and secrets

## Overview

This document describes all environment variables used in the Floyo application, how they're managed, and where they should be configured.

---

## Canonical Environment Template

**File:** `.env.example`

The `.env.example` file is the **single source of truth** for all environment variables. It contains:
- All required variables
- All optional variables
- Grouped by category
- Documented with comments

**Usage:**
```bash
# Copy template to local file
cp .env.example .env.local

# Fill in values from Supabase/Vercel dashboards
# DO NOT commit .env.local (it's gitignored)
```

---

## Environment Variable Categories

### 1. Database (Required)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | Supabase Dashboard → Settings → Database |
| `SUPABASE_URL` | ✅ Yes | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key (server-side) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key (server-only) | Supabase Dashboard → Settings → API |
| `SUPABASE_JWT_SECRET` | ⚠️ Optional | JWT secret for token validation | Supabase Dashboard → Settings → API |

**⚠️ Security:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It bypasses Row Level Security (RLS).

### 2. Supabase Public (Required)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL (public) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key (public) | Supabase Dashboard → Settings → API |

**Note:** `NEXT_PUBLIC_*` variables are exposed to the browser. Only include safe, public values.

### 3. Vercel Deployment (Optional - CI/CD)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `VERCEL_TOKEN` | ⚠️ CI Only | Vercel deployment token | Vercel Dashboard → Account → Tokens |
| `VERCEL_ORG_ID` | ⚠️ CI Only | Vercel organization ID | Vercel Dashboard → Settings |
| `VERCEL_PROJECT_ID` | ⚠️ CI Only | Vercel project ID | Vercel Dashboard → Settings |

**Usage:** Set as GitHub Secrets for CI/CD workflows.

### 4. Supabase CLI (Optional - CI/CD)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `SUPABASE_ACCESS_TOKEN` | ⚠️ CI Only | Supabase CLI access token | Supabase Dashboard → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | ⚠️ CI Only | Supabase project reference ID | Supabase Dashboard → Settings → General |

**Usage:** Set as GitHub Secrets for migration workflows.

### 5. Application Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ⚠️ Optional | `development` | Node environment (development/production/test) |
| `ENVIRONMENT` | ⚠️ Optional | `development` | Application environment |
| `FRONTEND_URL` | ⚠️ Optional | `http://localhost:3000` | Frontend URL (for email links, redirects) |
| `NEXT_PUBLIC_API_URL` | ⚠️ Optional | `http://localhost:8000` | Public API URL |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ Optional | `http://localhost:3000` | Public site URL |

### 6. Security & Secrets (Required in Production)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `SECRET_KEY` | ✅ Production | Application secret key (min 32 chars) | Generate: `openssl rand -hex 32` |
| `CRON_SECRET` | ⚠️ Optional | Secret for authenticated cron endpoints | Generate: `openssl rand -hex 32` |
| `VERCEL_CRON_SECRET` | ⚠️ Optional | Vercel-specific cron secret | Generate: `openssl rand -hex 32` |
| `ADMIN_BASIC_AUTH` | ⚠️ Optional | Admin basic auth (format: `username:password`) | Set manually |
| `SNAPSHOT_ENCRYPTION_KEY` | ⚠️ Optional | Encryption key for snapshots | Generate: `openssl rand -hex 32` |

**⚠️ Critical:** `SECRET_KEY` must be:
- At least 32 characters
- Random and unpredictable
- Different in each environment
- Never committed to git

### 7. Payment Processing (Optional)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `STRIPE_API_KEY` | ⚠️ Optional | Stripe API key | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Optional | Stripe webhook secret | Stripe Dashboard → Developers → Webhooks |

### 8. Monitoring & Observability (Optional)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `SENTRY_DSN` | ⚠️ Optional | Sentry DSN (server-side) | Sentry Dashboard → Settings → Projects |
| `NEXT_PUBLIC_SENTRY_DSN` | ⚠️ Optional | Sentry DSN (public) | Sentry Dashboard → Settings → Projects |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⚠️ Optional | PostHog API key | PostHog Dashboard → Project Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | ⚠️ Optional | `https://us.i.posthog.com` | PostHog Dashboard |

### 9. Feature Flags (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVACY_KILL_SWITCH` | ⚠️ Optional | `false` | Privacy kill switch |
| `NEXT_PUBLIC_PRIVACY_KILL_SWITCH` | ⚠️ Optional | `false` | Public privacy kill switch |
| `NEXT_PUBLIC_TRUST_STATUS_PAGE` | ⚠️ Optional | `false` | Trust status page feature |
| `NEXT_PUBLIC_TRUST_HELP_CENTER` | ⚠️ Optional | `false` | Trust help center feature |
| `NEXT_PUBLIC_TRUST_EXPORT` | ⚠️ Optional | `false` | Trust export feature |
| `NEXT_PUBLIC_CSP_ENABLED` | ⚠️ Optional | `false` | Content Security Policy |
| `NEXT_PUBLIC_CSP_ALLOWLIST` | ⚠️ Optional | - | CSP allowlist |

### 10. Integrations (Optional)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `NEXT_PUBLIC_HCAPTCHA_SITEKEY` | ⚠️ Optional | hCaptcha site key | hCaptcha Dashboard |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ⚠️ Optional | Cloudinary cloud name | Cloudinary Dashboard |
| `AWS_ACCESS_KEY_ID` | ⚠️ Optional | AWS access key (for S3 exports) | AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | ⚠️ Optional | AWS secret key | AWS IAM |
| `AWS_REGION` | ⚠️ Optional | AWS region | AWS Console |
| `AWS_S3_BUCKET` | ⚠️ Optional | S3 bucket name | AWS S3 |

### 11. External API Integrations (Optional)

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `ZAPIER_SECRET` | ⚠️ Optional | Zapier webhook secret | Zapier Dashboard |
| `TIKTOK_ADS_API_KEY` | ⚠️ Optional | TikTok Ads API key | TikTok Ads Manager |
| `TIKTOK_ADS_API_SECRET` | ⚠️ Optional | TikTok Ads API secret | TikTok Ads Manager |
| `META_ADS_ACCESS_TOKEN` | ⚠️ Optional | Meta Ads access token | Meta Business Manager |
| `META_ADS_APP_ID` | ⚠️ Optional | Meta Ads app ID | Meta Developers |
| `META_ADS_APP_SECRET` | ⚠️ Optional | Meta Ads app secret | Meta Developers |
| `ELEVENLABS_API_KEY` | ⚠️ Optional | ElevenLabs API key | ElevenLabs Dashboard |
| `AUTODS_API_KEY` | ⚠️ Optional | AutoDS API key | AutoDS Dashboard |
| `CAPCUT_API_KEY` | ⚠️ Optional | CapCut API key | CapCut Dashboard |
| `MINSTUDIO_API_KEY` | ⚠️ Optional | MindStudio API key | MindStudio Dashboard |

### 12. Redis & Cache (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | ⚠️ Optional | `redis://localhost:6379/0` | Redis connection URL |
| `CELERY_BROKER_URL` | ⚠️ Optional | `redis://localhost:6379/0` | Celery broker URL |
| `CELERY_RESULT_BACKEND` | ⚠️ Optional | `redis://localhost:6379/0` | Celery result backend |

---

## Environment Variable Validation

### Frontend Validation

**File:** `frontend/lib/env.ts`

**Usage:**
```typescript
import { validatePublicEnv } from '@/lib/env';

// Validates public env vars at build time
validatePublicEnv();
```

**Schema:** Zod schemas for type-safe validation

### Backend Validation

**File:** `backend/config.py`

**Usage:**
```python
from backend.config import settings

# Validates settings on import
# Fails fast in production if invalid
```

**Validation:** Pydantic settings with production checks

### Doctor Script

**File:** `scripts/env-doctor.ts`

**Usage:**
```bash
npm run env:doctor
```

**Checks:**
- Env vars used but not in `.env.example`
- Env vars in `.env.example` but not used
- Inconsistent naming/casing
- Missing required variables

---

## Configuration by Environment

### Local Development

**File:** `.env.local` (gitignored)

**Setup:**
```bash
cp .env.example .env.local
# Fill in values from Supabase/Vercel dashboards
```

**Required:**
- Database connection (Supabase)
- Supabase keys
- Frontend URL (localhost:3000)

### CI/CD (GitHub Actions)

**Location:** GitHub Secrets

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `DATABASE_URL` (for migrations)
- `SUPABASE_SERVICE_ROLE_KEY` (for migrations)

**Optional Secrets:**
- `NEXT_PUBLIC_SUPABASE_URL` (for builds)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for builds)

### Vercel (Production/Preview)

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

**Required:**
- All `NEXT_PUBLIC_*` variables (for builds)
- `DATABASE_URL` (for API routes)
- `SUPABASE_*` variables (for API routes)
- `SECRET_KEY` (for production)

**Environment-specific:**
- **Production:** All production secrets
- **Preview:** Preview/test secrets
- **Development:** Local development (not used)

**Setup:**
```bash
# Pull env vars from Vercel
vercel env pull .env.local
```

### Supabase (Database)

**Location:** Supabase Dashboard → Settings → Database

**Configuration:**
- Connection pooling
- Row Level Security (RLS)
- Database extensions

**Note:** Database connection string (`DATABASE_URL`) is managed by Supabase.

---

## Secrets Management Best Practices

### 1. Never Commit Secrets

**Gitignored Files:**
- `.env.local`
- `.env`
- `*.key`
- `*.pem`
- `secrets/`

### 2. Use Strong Secrets

**Generate Secrets:**
```bash
# Generate random secret (32+ characters)
openssl rand -hex 32

# Generate UUID
uuidgen
```

### 3. Rotate Secrets Regularly

**Rotation Schedule:**
- **Production secrets:** Every 90 days
- **API keys:** When compromised or quarterly
- **Database passwords:** Every 180 days

### 4. Use Environment-Specific Values

**Different Secrets Per Environment:**
- Development: Local/test values
- Staging: Staging/test values
- Production: Production values

**Never reuse production secrets in development.**

### 5. Document All Secrets

**Documentation:**
- Add to `.env.example` with comments
- Document in this file
- Update when adding new secrets

---

## Troubleshooting

### Missing Environment Variable

**Symptoms:**
- Application fails to start
- Runtime errors about undefined variables
- Build failures

**Steps:**
1. Check `.env.local` exists and has the variable
2. Verify variable name matches exactly (case-sensitive)
3. Check for typos or extra spaces
4. Run `npm run env:doctor` to detect drift

### Environment Variable Not Loading

**Symptoms:**
- Variable defined but `undefined` at runtime
- Build succeeds but runtime fails

**Steps:**
1. **Frontend:** Ensure `NEXT_PUBLIC_*` prefix for client-side vars
2. **Backend:** Check `backend/config.py` includes the variable
3. **Restart:** Restart dev server after adding variables
4. **Vercel:** Rebuild after adding variables in dashboard

### Secret Exposure

**Symptoms:**
- Secret appears in logs
- Secret in git history
- Secret exposed to client

**Steps:**
1. **Immediate:** Rotate the exposed secret
2. **Git:** Remove from history: `git filter-branch` or BFG Repo-Cleaner
3. **Logs:** Check Sentry/logs for exposure
4. **Prevent:** Add to `.gitignore`, use secrets manager

---

## Environment Variable Doctor

**Script:** `scripts/env-doctor.ts`

**Purpose:** Detect environment variable drift

**Usage:**
```bash
npm run env:doctor
```

**Output:**
- Lists env vars used but not documented
- Lists env vars documented but not used
- Detects inconsistent naming
- Validates required variables

**CI Integration:**
- Can be added to CI workflow
- Non-blocking (informational)
- Can be made blocking if needed

---

## Related Documentation

- [Stack Discovery](./stack-discovery.md) - Overall architecture
- [Backend Strategy](./backend-strategy.md) - Backend configuration
- [CI/CD Overview](./ci-overview.md) - CI/CD secrets
- [Deploy Strategy](./deploy-strategy.md) - Deployment configuration

---

## Quick Reference

### Required for Local Development
```bash
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Required for Production
```bash
# All local dev vars +
SECRET_KEY=  # Min 32 chars, random
NODE_ENV=production
ENVIRONMENT=production
```

### Required for CI/CD
```bash
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
```

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent
