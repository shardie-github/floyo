# Deployment Runbook

**Floyo - Complete Deployment Guide**

This document provides step-by-step instructions for deploying Floyo to production.

---

## Prerequisites

### Required Accounts
- ✅ Vercel account (for frontend deployment)
- ✅ Supabase account (for database)
- ✅ GitHub account (for CI/CD)

### Required Tools
- Node.js 18+ installed
- Python 3.9+ installed
- Git installed
- Supabase CLI installed (`npm install -g supabase`)
- Vercel CLI installed (`npm install -g vercel`)

### Required Secrets
- Supabase project URL and keys
- Vercel deployment token
- GitHub secrets configured

---

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] No critical TODOs remaining
- [ ] Code review completed

### 2. Database
- [ ] All migrations tested locally
- [ ] Database schema up to date
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Backup strategy in place

### 3. Environment Variables
- [ ] All required variables documented
- [ ] `.env.example` updated
- [ ] Production values secured
- [ ] Vercel environment variables set
- [ ] Supabase environment variables set

### 4. Security
- [ ] Security headers configured
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Authentication tested
- [ ] Authorization tested

---

## Step-by-Step Deployment

### Phase 1: Database Setup

#### Step 1.1: Link Supabase Project
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

#### Step 1.2: Run Migrations
```bash
# Check migration status
supabase db remote commit --dry-run

# Apply migrations
supabase db push

# Verify migrations
supabase db remote commit --dry-run
```

#### Step 1.3: Verify Database Setup
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Verify tables exist
psql $DATABASE_URL -c "\dt"

# Verify indexes
psql $DATABASE_URL -c "\di"
```

### Phase 2: Backend Deployment

#### Step 2.1: Prepare Backend
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run tests
pytest tests/ -v

# Type check
mypy backend/
```

#### Step 2.2: Configure Environment
```bash
# Set environment variables (if deploying separately)
export DATABASE_URL="postgresql://..."
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```

#### Step 2.3: Deploy Backend
```bash
# If using Vercel for API routes, this is handled automatically
# If deploying separately, use your deployment method:
# - Docker: docker build -t floyo-backend .
# - Cloud Run: gcloud run deploy floyo-backend
# - etc.
```

### Phase 3: Frontend Deployment

#### Step 3.1: Prepare Frontend
```bash
# Install dependencies
cd frontend
npm ci

# Run tests
npm test

# Build locally to verify
npm run build
```

#### Step 3.2: Configure Vercel
```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local
```

#### Step 3.3: Set Environment Variables in Vercel
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

#### Step 3.4: Deploy to Preview
```bash
# Deploy preview
vercel

# Or push to branch for automatic preview
git push origin feature-branch
```

#### Step 3.5: Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or merge to main branch for automatic production deploy
git push origin main
```

### Phase 4: Post-Deployment Verification

#### Step 4.1: Health Checks
```bash
# Frontend health
curl https://your-app.vercel.app/api/health

# Backend health (if separate)
curl https://your-api.vercel.app/api/health

# Database health
curl https://your-app.vercel.app/api/health/comprehensive
```

#### Step 4.2: Functional Tests
- [ ] Sign up flow works
- [ ] Login works
- [ ] Onboarding completes
- [ ] Dashboard loads
- [ ] API endpoints respond
- [ ] Database queries work

#### Step 4.3: Performance Checks
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Database queries < 100ms
- [ ] No N+1 queries

#### Step 4.4: Security Checks
- [ ] Security headers present
- [ ] HTTPS enforced
- [ ] Authentication required
- [ ] Rate limiting works
- [ ] CSRF protection active

---

## Rollback Procedure

### If Deployment Fails

#### Step 1: Identify Issue
```bash
# Check Vercel deployment logs
vercel logs

# Check database logs
supabase logs
```

#### Step 2: Rollback Frontend
```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy previous version
vercel --prod --force
```

#### Step 3: Rollback Database (if needed)
```bash
# List migrations
supabase migration list

# Rollback to specific migration
supabase db reset --version MIGRATION_VERSION
```

#### Step 4: Verify Rollback
- [ ] Health checks pass
- [ ] Critical features work
- [ ] No errors in logs

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Error rate < 1%
- [ ] Uptime > 99.5%
- [ ] Response times normal
- [ ] No critical alerts

### Weekly Tasks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Review security alerts
- [ ] Update dependencies

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Database optimization
- [ ] Backup verification

---

## Troubleshooting

### Common Issues

#### Issue: Build Fails
**Solution:**
1. Check Node.js version matches `.nvmrc`
2. Clear `.next` cache: `rm -rf frontend/.next`
3. Clear node_modules: `rm -rf node_modules && npm ci`
4. Check environment variables

#### Issue: Database Connection Fails
**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check Supabase project is active
3. Verify IP allowlist (if applicable)
4. Check connection pool limits

#### Issue: Environment Variables Missing
**Solution:**
1. Verify all variables set in Vercel
2. Check variable names match code
3. Ensure `NEXT_PUBLIC_` prefix for client vars
4. Redeploy after adding variables

#### Issue: Migrations Fail
**Solution:**
1. Check migration syntax
2. Verify database permissions
3. Check for conflicting migrations
4. Review migration logs

---

## Emergency Contacts

- **DevOps:** [Contact Info]
- **Database Admin:** [Contact Info]
- **Security Team:** [Contact Info]

---

## Appendix

### Environment Variables Reference
See `ENVIRONMENT.md` for complete list.

### Database Schema
See `prisma/schema.prisma` for schema definition.

### API Documentation
See `docs/API.md` for API reference.

---

**Last Updated:** 2025-01-XX  
**Maintained By:** DevOps Team
