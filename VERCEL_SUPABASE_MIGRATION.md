# Floyo Vercel & Supabase Migration Guide

This guide helps you configure Vercel (frontend) and Supabase (backend) for the Floyo project, ensuring all settings are migrated from the previous agentmeshcloud configuration.

## Overview

- **Frontend**: Deployed on Vercel (Next.js application)
- **Backend**: Database and API hosted on Supabase
- **Project Name**: Floyo (previously agentmeshcloud)

## Prerequisites

1. GitHub repository connected to Floyo
2. Vercel account (connected to GitHub)
3. Supabase account (connected to GitHub or manual setup)

---

## Part 1: Vercel Configuration

### 1.1 Connect GitHub Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Floyo GitHub repository
4. Select the repository: `your-org/floyo` (or your repo name)

### 1.2 Configure Project Settings

In Vercel project settings, configure:

**General Settings:**
- **Project Name**: `floyo` or `floyo-frontend`
- **Framework Preset**: Next.js
- **Root Directory**: `frontend` (IMPORTANT: Set this to `frontend`)

**Build & Development Settings:**
- **Build Command**: `cd frontend && npm ci && npm run build` (or use default)
- **Output Directory**: `frontend/.next` (or use default)
- **Install Command**: `npm ci` (or use default)
- **Development Command**: `cd frontend && npm run dev`

**Note**: The `vercel.json` in the root directory is already configured with these settings.

### 1.3 Environment Variables

Add the following environment variables in Vercel Dashboard:

**Required Variables:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
NEXT_PUBLIC_API_URL=https://your-project-ref.supabase.co

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

**Optional Variables (for production):**
```env
# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Monitoring
VERCEL_CRON_SECRET=your-vercel-cron-secret
```

**How to add:**
1. Go to Project Settings → Environment Variables
2. Add each variable for all environments (Production, Preview, Development)
3. For sensitive values, mark them as "Sensitive"

### 1.4 Vercel Cron Jobs

The `vercel.json` file includes a cron job for privacy cleanup:
- **Path**: `/api/privacy/cron/cleanup`
- **Schedule**: Daily at 2 AM UTC (`0 2 * * *`)

This is automatically configured via `vercel.json`. No additional setup needed.

### 1.5 Deploy Settings

1. **Production Branch**: Set to `main` (or your production branch)
2. **Preview Branches**: All branches (for PR previews)
3. **Ignored Build Step**: Leave empty (or add custom logic if needed)

### 1.6 Vercel Secrets

Add these secrets in Vercel (if using GitHub Actions integration):

- `VERCEL_TOKEN`: Get from Vercel Settings → Tokens
- `VERCEL_ORG_ID`: Found in project settings
- `VERCEL_PROJECT_ID`: Found in project settings

---

## Part 2: Supabase Configuration

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project:
   - **Name**: `floyo` or `floyo-production`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works for development

### 2.2 Get Connection Details

After project creation:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: (for client-side)
   - **service_role key**: (for server-side, keep secret!)

3. Go to **Settings** → **Database**
4. Copy the **Connection string** (for DATABASE_URL)

### 2.3 Run Database Migrations

#### Option A: Via Supabase Dashboard (Recommended for first-time setup)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. Run migrations in order:
   - `supabase/migrations/20240101000000_initial_schema.sql`
   - `supabase/migrations/20240101000001_validation_queries.sql`
   - `supabase/migrations/20240101000002_enhanced_policies.sql`
   - `supabase/migrations/20240101000003_privacy_monitoring.sql`
   - `supabase/migrations/2025-11-05_telemetry.sql`
   - `supabase/migrations/2025-11-05_trust_audit.sql`
   - `supabase/migrations/20251105_crux_hardening.sql`
   - `supabase/migrations/20251105_workflow_runs.sql`

4. Verify tables are created in **Table Editor**

#### Option B: Via Supabase CLI (Recommended for ongoing migrations)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
# Or with token: supabase login --token $SUPABASE_ACCESS_TOKEN

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

Or use the npm scripts:
```bash
npm run supa:login
npm run supa:link
npm run supa:migrate:apply
```

### 2.4 Configure Supabase Edge Functions

Deploy Supabase Edge Functions:

```bash
# Deploy all functions
supabase functions deploy analyze-patterns
supabase functions deploy generate-suggestions
supabase functions deploy ingest-telemetry
```

Or deploy all at once:
```bash
supabase functions deploy
```

### 2.5 Verify Setup

Run the validation script:

```bash
npm run ops sb-guard
```

Or manually verify:
- ✅ All tables exist (12 tables)
- ✅ RLS is enabled on all tables
- ✅ Policies exist for each table
- ✅ Indexes are created
- ✅ Edge functions are deployed

### 2.6 Supabase Secrets for GitHub Actions

Add these secrets to your GitHub repository:

- `SUPABASE_ACCESS_TOKEN`: Get from Supabase Dashboard → Account → Access Tokens
- `SUPABASE_PROJECT_REF`: Your project reference ID (found in project URL)
- `SUPABASE_DB_PASSWORD`: Your database password

---

## Part 3: GitHub Actions Integration

### 3.1 Required GitHub Secrets

Add these secrets in GitHub Repository Settings → Secrets and variables → Actions:

**Vercel Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Supabase Secrets:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

**Optional:**
- `SENTRY_DSN` (for error tracking)
- `POSTHOG_KEY` (for analytics)

### 3.2 Verify CI/CD Workflows

The following workflows are already configured:
- `.github/workflows/deploy-main.yml` - Production deployment
- `.github/workflows/cd.yml` - Docker builds
- `.github/workflows/preview-pr.yml` - Preview deployments

These should work automatically once secrets are configured.

---

## Part 4: Environment Variables Summary

### Local Development (.env)

Create a `.env` file in the root directory:

```env
# Environment
ENVIRONMENT=development
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Security
JWT_SECRET=your-strong-random-secret-key
ENCRYPTION_KEY=your-strong-random-encryption-key

# Vercel (for cron jobs)
VERCEL_CRON_SECRET=your-vercel-cron-secret
```

### Vercel Environment Variables

Add all variables with `NEXT_PUBLIC_` prefix for client-side access.

### Supabase Environment Variables

Supabase automatically provides these via Dashboard, but you can also set them in:
- **Settings** → **API** → Environment variables (for Edge Functions)
- **Settings** → **Database** → Connection pooling (for database connections)

---

## Part 5: Verification Checklist

### Vercel Setup ✅
- [ ] Project created and linked to GitHub
- [ ] Root directory set to `frontend`
- [ ] Build command configured correctly
- [ ] Environment variables added
- [ ] Production deployment successful
- [ ] Preview deployments working for PRs
- [ ] Cron job configured (verify in Vercel Dashboard → Cron Jobs)

### Supabase Setup ✅
- [ ] Project created with name `floyo`
- [ ] All migrations applied successfully
- [ ] Tables created (verify in Table Editor)
- [ ] RLS enabled on all tables
- [ ] Policies created and working
- [ ] Edge functions deployed
- [ ] Connection details saved securely

### GitHub Actions ✅
- [ ] All required secrets added
- [ ] Workflows running successfully
- [ ] Deployments triggering on push to main
- [ ] Preview deployments working for PRs

### Testing ✅
- [ ] Frontend loads on Vercel URL
- [ ] API routes responding correctly
- [ ] Database queries working
- [ ] Authentication working (if applicable)
- [ ] Edge functions callable
- [ ] Cron jobs executing (check logs)

---

## Part 6: Troubleshooting

### Vercel Issues

**Build Fails:**
- Check build logs in Vercel Dashboard
- Verify `vercel.json` configuration
- Ensure root directory is set to `frontend`
- Check environment variables are set correctly

**Environment Variables Not Available:**
- Verify variables are added for all environments
- Check variable names match exactly (case-sensitive)
- Restart deployment after adding variables

**Cron Jobs Not Running:**
- Verify `vercel.json` has correct cron configuration
- Check Vercel Dashboard → Cron Jobs to see scheduled jobs
- Verify endpoint `/api/privacy/cron/cleanup` exists and is accessible

### Supabase Issues

**Migration Fails:**
- Check SQL syntax in migration files
- Verify extensions are enabled (e.g., `uuid-ossp`)
- Check for conflicting table names
- Review Supabase logs for detailed errors

**RLS Policies Too Restrictive:**
- Verify `auth.uid()` function is available
- Check JWT claims are set correctly
- Review policy conditions in migration files
- Test with service role key to bypass RLS

**Connection Issues:**
- Verify connection string format
- Check network/firewall settings
- Verify project is not paused
- Check connection pooling settings

**Edge Functions Not Deploying:**
- Verify Supabase CLI is installed
- Check authentication token is valid
- Review function logs in Supabase Dashboard
- Verify function code is correct

---

## Part 7: Next Steps

1. **Set up monitoring**: Configure Sentry, PostHog, or your preferred monitoring tool
2. **Configure backups**: Set up automated Supabase backups (see `ops/automation-blueprints/github-ci-supabase-backup.yml`)
3. **Set up custom domain**: Configure custom domain in Vercel
4. **Configure SSL**: Vercel handles SSL automatically
5. **Set up staging environment**: Create separate Supabase project for staging
6. **Configure alerts**: Set up alerts for deployments and errors

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Setup Guide**: See `supabase/SETUP.md` for detailed Supabase setup
- **Security Checklist**: See `scripts/security-self-check.ts` for security validation

---

## Migration from agentmeshcloud

If migrating from agentmeshcloud:

1. **Update project names** in all configurations (✅ Already done)
2. **Update environment variables** in Vercel and Supabase
3. **Verify database migrations** are applied to new Supabase project
4. **Update connection strings** in all services
5. **Test all integrations** to ensure they work with new project

All code references have been updated to use "Floyo" instead of "nomad" or "agentmeshcloud".
