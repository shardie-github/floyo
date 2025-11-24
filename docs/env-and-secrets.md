# Environment Variables & Secrets Management

**Last Updated:** 2025-01-XX  
**Purpose:** Complete mapping of environment variables across local, CI, and hosting environments

---

## Executive Summary

**Template:** `.env.example` (comprehensive, 235+ variables)  
**Local:** `.env.local` (gitignored)  
**CI:** GitHub Secrets  
**Hosting:** Vercel Environment Variables  
**Database:** Supabase Dashboard

**Strategy:** 
- Public variables (`NEXT_PUBLIC_*`) → Vercel Dashboard + GitHub Secrets
- Private variables → GitHub Secrets (CI) + Vercel Dashboard (hosting)
- Database secrets → Supabase Dashboard

---

## 1. Variable Categories

### Public Variables (Client-Safe)

**Naming:** `NEXT_PUBLIC_*` (exposed to browser)

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Yes | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes | - |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | ✅ Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | API base URL | ⚠️ Optional | `http://localhost:8000` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | ⚠️ Optional | - |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics | ⚠️ Optional | - |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host | ⚠️ Optional | `https://us.i.posthog.com` |
| `NEXT_PUBLIC_HCAPTCHA_SITEKEY` | hCaptcha site key | ⚠️ Optional | - |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary config | ⚠️ Optional | - |
| `NEXT_PUBLIC_PRIVACY_KILL_SWITCH` | Privacy kill switch | ⚠️ Optional | `false` |
| `NEXT_PUBLIC_TRUST_STATUS_PAGE` | Trust features | ⚠️ Optional | `false` |
| `NEXT_PUBLIC_CSP_ENABLED` | Content Security Policy | ⚠️ Optional | `false` |

**Where to Set:**
- ✅ Vercel Dashboard (Production, Preview, Development)
- ✅ GitHub Secrets (for CI builds)
- ✅ Local `.env.local`

### Private Variables (Server-Side Only)

**Naming:** No prefix (never exposed to browser)

#### Database
| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | Supabase Dashboard |
| `SUPABASE_URL` | Supabase project URL (server) | ✅ Yes | Supabase Dashboard |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (server) | ✅ Yes | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ Yes | Supabase Dashboard |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret | ⚠️ Optional | Supabase Dashboard |

#### Vercel Deployment
| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| `VERCEL_TOKEN` | Vercel deployment token | ✅ Yes (CI) | Vercel Dashboard |
| `VERCEL_ORG_ID` | Vercel organization ID | ✅ Yes (CI) | Vercel Dashboard |
| `VERCEL_PROJECT_ID` | Vercel project ID | ✅ Yes (CI) | Vercel Dashboard |

#### Supabase CLI
| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token | ✅ Yes (CI) | Supabase Dashboard |
| `SUPABASE_PROJECT_REF` | Supabase project reference | ✅ Yes (CI) | Supabase Dashboard |

#### Application Secrets
| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `SECRET_KEY` | Application secret (JWT, encryption) | ✅ Yes | - |
| `SNAPSHOT_ENCRYPTION_KEY` | Encryption key for snapshots | ⚠️ Optional | - |
| `CRON_SECRET` | Cron job authentication | ⚠️ Optional | - |
| `ADMIN_BASIC_AUTH` | Admin basic auth (username:password) | ⚠️ Optional | - |

#### Payment Processing
| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| `STRIPE_API_KEY` | Stripe API key | ⚠️ Optional | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ⚠️ Optional | Stripe Dashboard |

#### Monitoring & Observability
| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| `SENTRY_DSN` | Sentry error tracking (server) | ⚠️ Optional | Sentry Dashboard |
| `SLACK_WEBHOOK_URL` | Slack notifications | ⚠️ Optional | Slack App |

#### Integrations
| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| `OPENAI_API_KEY` | OpenAI API key | ⚠️ Optional | OpenAI Dashboard |
| `TIKTOK_ADS_API_KEY` | TikTok Ads API | ⚠️ Optional | TikTok Ads |
| `META_ADS_ACCESS_TOKEN` | Meta Ads API | ⚠️ Optional | Meta Ads |
| `ZAPIER_SECRET` | Zapier webhook secret | ⚠️ Optional | Zapier |

#### Infrastructure
| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `REDIS_URL` | Redis connection URL | ⚠️ Optional | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | Celery broker URL | ⚠️ Optional | `redis://localhost:6379/0` |
| `AWS_ACCESS_KEY_ID` | AWS S3 access | ⚠️ Optional | - |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret | ⚠️ Optional | - |
| `AWS_REGION` | AWS region | ⚠️ Optional | - |
| `AWS_S3_BUCKET` | S3 bucket name | ⚠️ Optional | - |

---

## 2. Environment Mapping

### Local Development

**File:** `.env.local` (gitignored)

**Setup:**
```bash
# Copy template
cp .env.example .env.local

# Fill in values from:
# - Supabase Dashboard (database, auth)
# - Vercel Dashboard (if testing deployments)
# - Third-party services (Stripe, Sentry, etc.)
```

**Required Variables:**
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (default: `http://localhost:3000`)

**Optional Variables:**
- All other variables from `.env.example`

### CI (GitHub Actions)

**Location:** GitHub Secrets

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `NEXT_PUBLIC_SUPABASE_URL` (for builds)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for builds)

**Optional Secrets:**
- `SENTRY_DSN`
- `SLACK_WEBHOOK_URL`
- Other integration secrets (if used in CI)

**Usage in Workflows:**
```yaml
env:
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
```

### Hosting (Vercel)

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

**Environment-Specific:**
- **Production:** Production values
- **Preview:** Preview/test values
- **Development:** Local development values (optional)

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if using server-side Supabase)
- `DATABASE_URL` (if using direct PostgreSQL)

**Optional Variables:**
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `STRIPE_API_KEY`
- `SENTRY_DSN`
- Other integration keys

**Setup:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variable for each environment (Production, Preview, Development)
3. CI workflow pulls via `vercel pull`

### Database (Supabase)

**Location:** Supabase Dashboard

**Secrets:**
- Project URL (used for `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`)
- Anonymous key (used for `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Service role key (used for `SUPABASE_SERVICE_ROLE_KEY`)
- Database password (used in `DATABASE_URL`)
- Project reference ID (used for `SUPABASE_PROJECT_REF`)
- Access token (used for `SUPABASE_ACCESS_TOKEN`)

**Where to Find:**
- **Project URL:** Settings → API → Project URL
- **Keys:** Settings → API → anon/public key, service_role key
- **Database Password:** Settings → Database → Connection string
- **Project Ref:** Settings → General → Reference ID
- **Access Token:** Account → Access Tokens

---

## 3. Secrets Management Best Practices

### Security Principles

1. **Never Commit Secrets:**
   - ✅ `.env.local` is gitignored
   - ✅ Use GitHub Secrets for CI
   - ✅ Use Vercel Environment Variables for hosting
   - ❌ Never hardcode secrets in code

2. **Rotate Secrets Regularly:**
   - Rotate Supabase keys if compromised
   - Rotate Vercel tokens if team member leaves
   - Rotate application secrets periodically

3. **Use Least Privilege:**
   - Use `SUPABASE_ANON_KEY` for client-side (respects RLS)
   - Use `SUPABASE_SERVICE_ROLE_KEY` only server-side (bypasses RLS)
   - Never expose service role key to client

4. **Separate Environments:**
   - Different values for Production vs Preview
   - Use test/development values for local dev
   - Never use production secrets in development

### Validation

**Script:** `scripts/env-validate.ts` (if exists)

**CI Integration:**
- `.github/workflows/env-validation.yml` - Validates env vars
- `.github/workflows/env-smoke-test.yml` - Smoke tests with env vars

**Manual Validation:**
```bash
# Check required variables are set
npm run env:validate
```

---

## 4. Variable Sources & Setup

### Supabase Variables

**Source:** Supabase Dashboard → Settings → API

**Variables:**
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

**Setup Steps:**
1. Go to Supabase Dashboard
2. Select your project
3. Settings → API
4. Copy values to `.env.local` or Vercel Dashboard

### Vercel Variables

**Source:** Vercel Dashboard → Account → Tokens

**Variables:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Setup Steps:**
1. Go to Vercel Dashboard
2. Account → Tokens → Create Token
3. Copy token to GitHub Secrets
4. Get Org ID and Project ID from project settings

### Stripe Variables

**Source:** Stripe Dashboard → Developers → API Keys

**Variables:**
- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Setup Steps:**
1. Go to Stripe Dashboard
2. Developers → API Keys
3. Copy keys to Vercel Dashboard or GitHub Secrets

### Sentry Variables

**Source:** Sentry Dashboard → Settings → Projects → Client Keys (DSN)

**Variables:**
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`

**Setup Steps:**
1. Go to Sentry Dashboard
2. Create project (if needed)
3. Settings → Projects → Client Keys (DSN)
4. Copy DSN to Vercel Dashboard

---

## 5. CI ↔ Hosting Mapping

### GitHub Secrets → Vercel Environment Variables

**Mapping Table:**

| GitHub Secret | Vercel Variable | Purpose | Required For |
|---------------|-----------------|---------|--------------|
| `VERCEL_TOKEN` | - | CI deployment | CI workflows |
| `VERCEL_ORG_ID` | - | CI deployment | CI workflows |
| `VERCEL_PROJECT_ID` | - | CI deployment | CI workflows |
| `SUPABASE_ACCESS_TOKEN` | - | CI migrations | CI workflows |
| `SUPABASE_PROJECT_REF` | - | CI migrations | CI workflows |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | Both |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + Runtime | Both |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | Runtime only | Vercel |
| `DATABASE_URL` | `DATABASE_URL` | Runtime only | Vercel |
| `SENTRY_DSN` | `SENTRY_DSN` | Runtime only | Vercel |
| `STRIPE_API_KEY` | `STRIPE_API_KEY` | Runtime only | Vercel |

**Notes:**
- GitHub Secrets used for **CI builds and deployments**
- Vercel Variables used for **runtime execution**
- Some variables needed in both (e.g., `NEXT_PUBLIC_*` for builds)

---

## 6. Troubleshooting

### Common Issues

**Issue:** Build fails with "Missing environment variable"
- **Solution:** Check GitHub Secrets are set for CI builds
- **Check:** `.github/workflows/frontend-deploy.yml` env vars

**Issue:** Runtime error "Supabase URL not found"
- **Solution:** Check Vercel Environment Variables are set
- **Check:** Vercel Dashboard → Project → Settings → Environment Variables

**Issue:** Database connection fails
- **Solution:** Verify `DATABASE_URL` is correct
- **Check:** Supabase Dashboard → Settings → Database → Connection string

**Issue:** Preview deployment uses wrong environment
- **Solution:** Check Vercel Preview environment variables
- **Check:** Vercel Dashboard → Environment Variables → Preview

### Validation Commands

```bash
# Validate environment variables (local)
npm run env:validate

# Check Supabase connection
npm run supa:status

# Check Vercel connection
vercel env ls
```

---

## 7. Action Items

### Immediate
- [x] Document environment variables mapping
- [ ] Verify all required secrets are set in GitHub
- [ ] Verify all required variables are set in Vercel
- [ ] Create validation script (if missing)

### Short-Term
- [ ] Add env var validation to CI
- [ ] Document secret rotation procedure
- [ ] Create setup checklist for new developers

### Long-Term
- [ ] Consider secrets management service (if scaling)
- [ ] Automate secret rotation (if needed)
- [ ] Add monitoring for missing secrets

---

## 8. References

- [`.env.example`](../.env.example) - Complete variable template
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Environment Variables Documented
