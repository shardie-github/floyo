# Environment Variables Configuration Guide

This document explains how environment variables are managed across Supabase, GitHub Actions, Vercel, and local development.

## Overview

Environment variables are the **single source of truth** for application configuration. This guide ensures consistency across all environments.

## Source of Truth: Supabase

Supabase Dashboard holds the canonical values for:

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `SUPABASE_JWT_SECRET` - JWT secret for token validation

### Where to Find These Values

1. **DATABASE_URL**: 
   - Supabase Dashboard → Settings → Database → Connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

2. **SUPABASE_URL**:
   - Supabase Dashboard → Settings → API → Project URL
   - Format: `https://[PROJECT_REF].supabase.co`

3. **SUPABASE_ANON_KEY**:
   - Supabase Dashboard → Settings → API → anon/public key
   - Safe to expose to client-side code

4. **SUPABASE_SERVICE_ROLE_KEY**:
   - Supabase Dashboard → Settings → API → service_role key
   - ⚠️ **NEVER expose to client-side code** - bypasses Row Level Security

5. **SUPABASE_JWT_SECRET**:
   - Supabase Dashboard → Settings → API → JWT Secret
   - Used for token validation

## GitHub Actions Secrets

GitHub Actions workflows require access to server-side secrets for CI/CD.

### Required Secrets

Add these in: **GitHub Repository → Settings → Secrets and variables → Actions**

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL` (for build-time)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for build-time)

### Optional Secrets (for deployment)

- `VERCEL_TOKEN` - For Vercel deployments
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `SUPABASE_ACCESS_TOKEN` - For Supabase CLI operations
- `SUPABASE_PROJECT_REF` - Supabase project reference

### How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add each secret name and value (copy from Supabase)
5. Save

## Vercel Environment Variables

Vercel requires environment variables for all deployment environments (Production, Preview, Development).

### Required Variables

Add these in: **Vercel Dashboard → Project → Settings → Environment Variables**

#### Server-side (all environments):
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

#### Public (all environments):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Environment-Specific Configuration

Vercel supports three environments:
- **Production** - Live production site
- **Preview** - Preview deployments (PRs, branches)
- **Development** - Local development (via `vercel dev`)

**Best Practice**: Set all required variables for all three environments. You can use different values per environment if needed.

### How to Add Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click **Add New**
3. Enter variable name
4. Enter variable value (copy from Supabase)
5. Select which environments to apply to (Production, Preview, Development)
6. Save

### Pulling Variables Locally

To sync Vercel environment variables to your local `.env.local`:

```bash
cd frontend
vercel env pull .env.local
```

This will create/update `.env.local` with values from Vercel.

## Local Development Setup

### Step 1: Create `.env.local`

```bash
cp .env.example .env.local
```

### Step 2: Fill Values from Supabase

Copy values from Supabase Dashboard (see "Source of Truth" section above) into `.env.local`:

```bash
# Edit .env.local
nano .env.local  # or use your preferred editor
```

### Step 3: Verify Setup

Run the environment test:

```bash
npm run dev
# Then visit: http://localhost:3000/api/env-test
```

Or use the health check:

```bash
curl http://localhost:3000/api/health
```

### File Structure

- `.env.example` - Template file (committed to git, no secrets)
- `.env.local` - Local development values (gitignored, never commit)
- `.env.*.local` - Additional local overrides (gitignored)

## Setup Checklist

Use this checklist to ensure all environments are configured:

- [ ] **Supabase Dashboard**
  - [ ] All required values documented/accessible
  - [ ] Service role key secured (never exposed to client)

- [ ] **GitHub Secrets**
  - [ ] `DATABASE_URL` added
  - [ ] `SUPABASE_URL` added
  - [ ] `SUPABASE_ANON_KEY` added
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` added
  - [ ] `SUPABASE_JWT_SECRET` added
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` added
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added

- [ ] **Vercel Environment Variables**
  - [ ] All server-side vars added (Production, Preview, Development)
  - [ ] All public vars added (Production, Preview, Development)
  - [ ] Variables verified in Vercel dashboard

- [ ] **Local Development**
  - [ ] `.env.local` created from `.env.example`
  - [ ] All values filled from Supabase
  - [ ] Local health check passes: `curl http://localhost:3000/api/health`

- [ ] **CI/CD**
  - [ ] GitHub Actions env-smoke-test workflow passes
  - [ ] Vercel deployment succeeds
  - [ ] Production health check passes: `curl https://your-domain.com/api/health`

## Validation & Health Checks

### Environment Smoke Test (GitHub Actions)

The `.github/workflows/env-smoke-test.yml` workflow validates:
- All required environment variables are present
- Prisma can connect to database
- Next.js build succeeds with env vars

**Run manually**: GitHub Actions → env-smoke-test → Run workflow

### Health Check Endpoint

The `/api/health` endpoint validates:
- Required environment variables are present
- Database connectivity
- Supabase connectivity

**Local**: `curl http://localhost:3000/api/health`  
**Production**: `curl https://your-domain.com/api/health`

Expected response:
```json
{
  "ok": true,
  "missing": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Environment Test Endpoint

The `/api/env-test` endpoint shows which variables are present (without exposing values):

**Local**: `curl http://localhost:3000/api/env-test`

## Troubleshooting

### Missing Environment Variables

**Symptom**: Application fails with "Missing environment variable" error

**Solution**:
1. Check `.env.local` exists and has the variable
2. Restart development server (`npm run dev`)
3. Verify variable name matches exactly (case-sensitive)
4. Check for typos or extra spaces

### Vercel Deployment Fails

**Symptom**: Build fails with "Environment variable not found"

**Solution**:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify variable exists for the correct environment (Production/Preview/Development)
3. Check variable name matches code (case-sensitive)
4. Redeploy

### GitHub Actions Fails

**Symptom**: CI workflow fails with "Missing secret"

**Solution**:
1. Go to GitHub → Repository → Settings → Secrets and variables → Actions
2. Verify secret exists with exact name
3. Check secret value is not empty
4. Re-run workflow

### Database Connection Fails

**Symptom**: "Database connection error" or Prisma errors

**Solution**:
1. Verify `DATABASE_URL` is correct format
2. Check Supabase project is active
3. Verify IP allowlist in Supabase (if applicable)
4. Test connection: `psql $DATABASE_URL`

## Security Best Practices

1. **Never commit secrets**: `.env.local` is gitignored - never commit it
2. **Use service role key carefully**: Only use `SUPABASE_SERVICE_ROLE_KEY` server-side
3. **Rotate secrets regularly**: Update secrets in Supabase, then sync to GitHub/Vercel
4. **Limit access**: Only grant access to secrets to authorized team members
5. **Audit regularly**: Review who has access to secrets in GitHub/Vercel

## Related Files

- `.env.example` - Template for local development
- `.github/workflows/env-smoke-test.yml` - CI validation workflow
- `frontend/app/api/health/route.ts` - Health check endpoint
- `frontend/app/api/env-test/route.ts` - Environment test endpoint
- `ops/utils/env.ts` - Environment validation utilities

## Support

If you encounter issues:
1. Check this documentation
2. Review error messages carefully
3. Verify all checklist items are complete
4. Check Supabase, GitHub, and Vercel dashboards for configuration
