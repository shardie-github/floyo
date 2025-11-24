# Secrets Checklist

**Date:** 2025-01-XX  
**Purpose:** Complete checklist of required secrets for CI/CD and deployment

---

## Executive Summary

**GitHub Secrets:** 8 required, 5 optional  
**Vercel Environment Variables:** 6 required, 10+ optional  
**Supabase Dashboard:** 5 required values

**Status:** ✅ All required secrets documented

---

## 1. GitHub Secrets (Required)

### Vercel Deployment

| Secret | Purpose | Source | Required For |
|--------|---------|--------|---------------|
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard → Account → Tokens | `frontend-deploy.yml`, `preview-pr.yml` |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel Dashboard → Settings → General | `frontend-deploy.yml`, `preview-pr.yml` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel Dashboard → Settings → General | `frontend-deploy.yml`, `preview-pr.yml` |

**How to Get:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Account → Tokens → Create Token → Copy token
3. Project → Settings → General → Copy Org ID and Project ID

**Status:** ⚠️ **VERIFY THESE ARE SET**

---

### Supabase Migrations

| Secret | Purpose | Source | Required For |
|--------|---------|--------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token | Supabase Dashboard → Account → Access Tokens | `supabase-migrate.yml` |
| `SUPABASE_PROJECT_REF` | Supabase project reference | Supabase Dashboard → Settings → General | `supabase-migrate.yml` |

**How to Get:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Account → Access Tokens → Create Token → Copy token
3. Project → Settings → General → Copy Reference ID

**Status:** ⚠️ **VERIFY THESE ARE SET**

---

### Build Environment Variables

| Secret | Purpose | Source | Required For |
|--------|---------|--------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (public) | Supabase Dashboard → Settings → API | `ci.yml`, `frontend-deploy.yml` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | Supabase Dashboard → Settings → API | `ci.yml`, `frontend-deploy.yml` |

**How to Get:**
1. Go to Supabase Dashboard → Settings → API
2. Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Status:** ⚠️ **VERIFY THESE ARE SET**

---

## 2. GitHub Secrets (Optional)

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | `env-smoke-test.yml` (if used) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `env-smoke-test.yml` (if used) |
| `SENTRY_DSN` | Sentry error tracking | Various workflows (if used) |
| `SLACK_WEBHOOK_URL` | Slack notifications | Various workflows (if used) |
| `AWS_ACCESS_KEY_ID` | AWS S3 access | Backup workflows (if used) |

**Status:** ⚠️ **SET IF NEEDED**

---

## 3. Vercel Environment Variables (Required)

### Production Environment

| Variable | Purpose | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (public) | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard |
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `https://[project].vercel.app` |
| `NODE_ENV` | Node environment | `production` |

**How to Set:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable for Production environment
3. Repeat for Preview and Development environments

**Status:** ⚠️ **VERIFY THESE ARE SET**

---

## 4. Vercel Environment Variables (Optional)

| Variable | Purpose | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | Sentry Dashboard |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics | PostHog Dashboard |
| `STRIPE_API_KEY` | Stripe API key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Stripe Dashboard |
| `SENTRY_DSN` | Sentry DSN (server) | Sentry Dashboard |
| `SECRET_KEY` | Application secret | Generate |
| `CRON_SECRET` | Cron job secret | Generate |
| `AWS_ACCESS_KEY_ID` | AWS S3 access | AWS Dashboard |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret | AWS Dashboard |
| `AWS_REGION` | AWS region | AWS Dashboard |
| `AWS_S3_BUCKET` | S3 bucket name | AWS Dashboard |

**Status:** ⚠️ **SET IF NEEDED**

---

## 5. Supabase Dashboard Values

### Required Values

| Value | Location | Purpose |
|-------|----------|---------|
| Project URL | Settings → API → Project URL | `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` |
| Anon Key | Settings → API → anon/public key | `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service Role Key | Settings → API → service_role key | `SUPABASE_SERVICE_ROLE_KEY` |
| Database Password | Settings → Database → Connection string | `DATABASE_URL` |
| Project Reference ID | Settings → General → Reference ID | `SUPABASE_PROJECT_REF` |

**Status:** ✅ **Available in Supabase Dashboard**

---

## 6. Verification Checklist

### GitHub Secrets

- [ ] `VERCEL_TOKEN` - Set in GitHub Secrets
- [ ] `VERCEL_ORG_ID` - Set in GitHub Secrets
- [ ] `VERCEL_PROJECT_ID` - Set in GitHub Secrets
- [ ] `SUPABASE_ACCESS_TOKEN` - Set in GitHub Secrets
- [ ] `SUPABASE_PROJECT_REF` - Set in GitHub Secrets
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set in GitHub Secrets
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set in GitHub Secrets

### Vercel Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set in Vercel (Production, Preview, Development)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set in Vercel (Production, Preview, Development)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set in Vercel (Production, Preview)
- [ ] `DATABASE_URL` - Set in Vercel (Production, Preview)
- [ ] `NEXT_PUBLIC_SITE_URL` - Set in Vercel (Production)
- [ ] `NODE_ENV` - Set in Vercel (Production: `production`, Preview: `preview`)

### Supabase Dashboard

- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Service role key copied
- [ ] Database password available
- [ ] Project reference ID copied

---

## 7. How to Verify Secrets

### GitHub Secrets

```bash
# Check if secrets are set (requires GitHub CLI)
gh secret list

# Or check in GitHub UI:
# Settings → Secrets and variables → Actions → Secrets
```

### Vercel Environment Variables

```bash
# Check via Vercel CLI
vercel env ls

# Or check in Vercel Dashboard:
# Project → Settings → Environment Variables
```

### Test Secrets

```bash
# Run env smoke test workflow
# GitHub Actions → env-smoke-test.yml → Run workflow

# Or manually test:
npm run env:validate
```

---

## 8. Troubleshooting

### Issue: Build fails with "Missing environment variable"

**Solution:**
1. Check GitHub Secrets are set
2. Check Vercel Environment Variables are set
3. Verify variable names match exactly (case-sensitive)

### Issue: Deployment fails

**Solution:**
1. Verify `VERCEL_TOKEN` is valid
2. Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
3. Check Vercel Dashboard for deployment errors

### Issue: Migrations fail

**Solution:**
1. Verify `SUPABASE_ACCESS_TOKEN` is valid
2. Verify `SUPABASE_PROJECT_REF` is correct
3. Check Supabase Dashboard for migration errors

---

## 9. Security Best Practices

### Secrets Management

- ✅ Never commit secrets to git
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use Vercel Environment Variables for hosting
- ✅ Rotate secrets regularly
- ✅ Use least privilege (anon key for client, service role for server)

### Secret Rotation

**When to Rotate:**
- If secret is compromised
- If team member leaves
- Periodically (every 90 days)

**How to Rotate:**
1. Generate new secret
2. Update in GitHub Secrets / Vercel
3. Test deployment
4. Remove old secret

---

## 10. Action Items

### Immediate
- [x] Document all required secrets
- [ ] Verify GitHub Secrets are set
- [ ] Verify Vercel Environment Variables are set
- [ ] Test deployments with secrets

### Short-Term
- [ ] Set up secret rotation schedule
- [ ] Document secret rotation procedure
- [ ] Add secret validation to CI

### Long-Term
- [ ] Consider secrets management service (if scaling)
- [ ] Automate secret rotation (if needed)
- [ ] Add monitoring for missing secrets

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Secrets Checklist Complete
