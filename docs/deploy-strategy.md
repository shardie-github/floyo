# Deployment Strategy

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive deployment guide

## Overview

Floyo uses a **multi-environment deployment strategy** with:
- **Frontend:** Vercel (Preview + Production)
- **Database:** Supabase (managed PostgreSQL)
- **Backend:** Unknown (may be deployed separately or not deployed)

---

## Frontend Deployment

### Hosting Provider: Vercel

**Why Vercel:**
- Native Next.js support
- Automatic preview deployments
- Edge network (CDN)
- Serverless functions
- Environment variable management

### Environments

#### Preview Environment

**Trigger:** Pull requests to `main`

**Workflow:** `frontend-deploy.yml`

**Process:**
1. Build and test
2. Deploy to Vercel Preview
3. Comment PR with preview URL

**URL Format:** `https://<project>-<hash>.vercel.app`

**Environment Variables:** Vercel Dashboard → Preview environment

**Use Case:**
- Testing PR changes
- Stakeholder review
- QA testing

#### Production Environment

**Trigger:** Push to `main`

**Workflow:** `frontend-deploy.yml`

**Process:**
1. Build and test
2. Deploy to Vercel Production
3. Output deployment URL

**URL Format:** `https://<project>.vercel.app` (or custom domain)

**Environment Variables:** Vercel Dashboard → Production environment

**Use Case:**
- Live production site
- User-facing application

### Deployment Process

**Automated (CI/CD):**
- Pull request → Preview deployment
- Push to main → Production deployment

**Manual:**
```bash
# Preview
cd frontend
vercel deploy --prebuilt --token=$VERCEL_TOKEN

# Production
cd frontend
vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

### Vercel Configuration

**File:** `vercel.json`

**Configuration:**
- Build command: `cd frontend && npm ci && npm run build`
- Output directory: `frontend/.next`
- Framework: Next.js
- Edge functions: `api/**/*.js`
- Headers: Security headers, cache control
- Cron jobs: Privacy cleanup, metrics collection

---

## Database Deployment

### Hosting Provider: Supabase

**Why Supabase:**
- Managed PostgreSQL
- Built-in authentication
- Row Level Security (RLS)
- Edge functions
- Real-time subscriptions

### Migration Process

**Workflow:** `supabase-migrate.yml`

**Trigger:** Push to `main` (or manual)

**Process:**
1. Login to Supabase
2. Link project
3. Apply migrations (`supabase migration up`)
4. Validate schema

**Migration Files:** `supabase/migrations/`

**Master Schema:** `99999999999999_master_consolidated_schema.sql`

### Migration Strategy

**Approach:** Single consolidated master migration

**Benefits:**
- Idempotent operations
- Safe to run multiple times
- Clear schema state

**Creating Migrations:**
```bash
# Update master migration
vim supabase/migrations/99999999999999_master_consolidated_schema.sql

# Or create incremental migration
supabase migration new descriptive_name
```

**Applying Migrations:**
```bash
# Local
supabase start
supabase migration up

# Production (via CI)
# Automatically applied by supabase-migrate.yml
```

---

## Backend Deployment

### Current Status: ❓ Unknown

**Possible Scenarios:**
1. **Not Deployed:** Backend runs locally only
2. **Separate Deployment:** Deployed manually or via separate CI/CD
3. **Serverless:** Backend logic in Next.js API routes or Supabase Edge Functions

**Recommendation:** Document backend deployment process or create deployment workflow.

### Potential Hosting Options

**If Backend Needs Deployment:**

1. **Fly.io**
   - Docker-based
   - Global edge network
   - Good for Python/FastAPI

2. **Render**
   - Managed services
   - Auto-deploy from Git
   - Good for Python/FastAPI

3. **Railway**
   - Simple deployment
   - Auto-deploy from Git
   - Good for Python/FastAPI

4. **Supabase Edge Functions**
   - Serverless functions
   - Co-located with database
   - Good for lightweight APIs

---

## Deployment Workflow

### Pull Request Flow

```
Developer creates PR
  ↓
CI checks run (lint, test, build)
  ↓
Preview deployment (Vercel)
  ↓
PR comment with preview URL
  ↓
Review & approve
  ↓
Merge to main
```

### Production Flow

```
Push to main
  ↓
CI checks run (lint, test, build)
  ↓
Database migrations (Supabase)
  ↓
Production deployment (Vercel)
  ↓
Deployment complete
```

### Deployment Order

**Critical:** Migrations must run **before** code deployment if schema changes are included.

**Current:** Migrations run independently (may cause issues)

**Recommendation:** 
1. Run migrations first
2. Wait for migration completion
3. Then deploy code

**Or:** Use feature flags to handle schema changes gracefully.

---

## Environment Variables

### Vercel Environment Variables

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

**Environments:**
- **Production:** Live production site
- **Preview:** PR preview deployments
- **Development:** Local development (not used)

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` (for API routes)
- `SUPABASE_SERVICE_ROLE_KEY` (for API routes)
- `SECRET_KEY` (for production)

**Setup:**
```bash
# Pull from Vercel
vercel env pull .env.local
```

### Supabase Environment Variables

**Location:** Supabase Dashboard → Settings → API

**Variables:**
- Project URL
- API keys (anon, service_role)
- Database connection string

**Note:** Database connection managed by Supabase.

---

## Rollback Strategy

### Frontend Rollback

**Vercel:**
1. Go to Vercel Dashboard → Deployments
2. Find previous deployment
3. Click "Promote to Production"

**Or via CLI:**
```bash
vercel rollback <deployment-url>
```

### Database Rollback

**Supabase:**
1. Create rollback migration
2. Apply rollback migration
3. Verify schema state

**Note:** Supabase doesn't support automatic rollback - create manual rollback migrations.

---

## Monitoring & Health Checks

### Deployment Health

**Vercel:**
- Automatic health checks
- Deployment status in dashboard
- Build logs available

**Supabase:**
- Migration status in dashboard
- Database connection monitoring
- Query performance monitoring

### Post-Deployment Verification

**Checklist:**
1. ✅ Frontend loads correctly
2. ✅ API routes respond
3. ✅ Database migrations applied
4. ✅ Environment variables loaded
5. ✅ Authentication works
6. ✅ Core features functional

**Automated Checks:**
- Health check endpoint: `/api/health`
- Comprehensive health: `/api/health/comprehensive`

---

## Troubleshooting

### Deployment Fails

**Symptoms:**
- Build errors
- Deployment timeout
- Environment variable errors

**Steps:**
1. Check Vercel build logs
2. Verify environment variables
3. Test build locally: `cd frontend && npm run build`
4. Check for recent changes

### Migration Fails

**Symptoms:**
- Migration errors
- Schema validation fails
- Application errors after migration

**Steps:**
1. Check Supabase migration logs
2. Test migrations locally
3. Verify migration syntax
4. Check for schema conflicts

### Preview Not Working

**Symptoms:**
- Preview URL not generated
- Preview deployment fails
- Preview shows errors

**Steps:**
1. Check `frontend-deploy.yml` logs
2. Verify Vercel secrets
3. Check PR comment for errors
4. Test preview deployment manually

---

## Best Practices

### 1. Test Before Deploy

- Run CI locally: `npm run ci`
- Test migrations locally: `supabase start && supabase migration up`
- Verify build: `cd frontend && npm run build`

### 2. Small, Incremental Changes

- Small PRs are easier to review
- Easier to rollback if needed
- Faster deployments

### 3. Monitor Deployments

- Check deployment status
- Monitor error rates
- Track deployment frequency

### 4. Document Changes

- Document breaking changes
- Update migration comments
- Changelog for major changes

### 5. Use Feature Flags

- Gradual rollouts
- Easy rollback
- A/B testing

---

## Related Documentation

- [CI/CD Overview](./ci-overview.md) - CI/CD workflows
- [Environment Variables](./env-and-secrets.md) - Secrets management
- [Database Migrations](./db-migrations-and-schema.md) - Migration strategy

---

## Quick Reference

### Deploy Preview

```bash
cd frontend
vercel deploy --prebuilt --token=$VERCEL_TOKEN
```

### Deploy Production

```bash
cd frontend
vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

### Apply Migrations

```bash
supabase migration up
```

### Check Deployment Status

```bash
# Vercel
vercel ls

# Supabase
supabase migration list
```

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent
