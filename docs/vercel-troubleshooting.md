# Vercel Troubleshooting Guide

**Last Updated:** 2025-01-XX  
**Purpose:** Step-by-step troubleshooting for Vercel deployment issues

---

## Quick Diagnosis

Run the deploy doctor script:
```bash
npm run deploy:doctor
```

This will check for common configuration issues.

---

## Common Issues & Solutions

### 1. No Preview Deployment Appears for PRs

#### Symptoms
- PR created/updated but no preview URL in comments
- `frontend-deploy.yml` workflow runs but deploy job is skipped or fails

#### Diagnosis Steps

1. **Check GitHub Actions Logs:**
   - Go to GitHub → Actions → `frontend-deploy.yml`
   - Check if workflow triggered (should show on PR)
   - Check if `build-and-test` job passed
   - Check if `deploy` job ran (not skipped)

2. **Check Workflow Conditions:**
   - Verify PR is targeting `main` branch
   - Check if `deploy` job has correct `if:` condition
   - Ensure `build-and-test` job succeeded (deploy depends on it)

3. **Check Required Secrets:**
   ```bash
   # Run deploy doctor
   npm run deploy:doctor
   ```
   - Verify `VERCEL_TOKEN` is set in GitHub Secrets
   - Verify `VERCEL_ORG_ID` is set
   - Verify `VERCEL_PROJECT_ID` is set

4. **Check Vercel Configuration:**
   - Vercel Dashboard → Project → Settings → Git
   - **IMPORTANT:** Ensure Vercel Git Integration is **DISABLED**
   - If enabled, it conflicts with GitHub Actions deployments

#### Solutions

**Missing Secrets:**
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add missing secrets:
   - `VERCEL_TOKEN` - Get from Vercel Dashboard → Account → Tokens
   - `VERCEL_ORG_ID` - Get from Vercel Dashboard → Project → Settings → General
   - `VERCEL_PROJECT_ID` - Get from Vercel Dashboard → Project → Settings → General

**Vercel Git Integration Conflict:**
1. Vercel Dashboard → Project → Settings → Git
2. Disconnect repository or disable automatic deployments
3. Keep manual deployments disabled
4. Rely solely on GitHub Actions for deployments

**Deploy Job Skipped:**
- Check workflow logs for `if:` condition failures
- Ensure `build-and-test` job passed (deploy depends on it)
- Check that PR is not closed (closed PRs skip deploy)

---

### 2. No Production Deployment on Push to Main

#### Symptoms
- Push to `main` branch but no production deployment
- `frontend-deploy.yml` workflow doesn't trigger or fails

#### Diagnosis Steps

1. **Check Workflow Trigger:**
   - GitHub → Actions → `frontend-deploy.yml`
   - Verify workflow triggered on push to `main`
   - Check branch name matches exactly (`main`, not `master`)

2. **Check Required Secrets:**
   - Same as Preview (see above)
   - Verify all Vercel secrets are set

3. **Check Vercel Project Configuration:**
   - Vercel Dashboard → Project → Settings → General
   - Verify `VERCEL_ORG_ID` matches your organization
   - Verify `VERCEL_PROJECT_ID` matches your project

4. **Check for Conflicting Workflows:**
   - Ensure `deploy-main.yml` is disabled (it's deprecated)
   - Multiple workflows deploying can cause conflicts

#### Solutions

**Workflow Not Triggering:**
- Verify branch name is exactly `main` (case-sensitive)
- Check if workflow file exists: `.github/workflows/frontend-deploy.yml`
- Check GitHub Actions is enabled for repository

**Wrong Vercel Project:**
1. Vercel Dashboard → Project → Settings → General
2. Copy correct `Project ID` and `Organization ID`
3. Update GitHub Secrets:
   - `VERCEL_PROJECT_ID`
   - `VERCEL_ORG_ID`

**Conflicting Workflows:**
- Disable `deploy-main.yml` (already done - it's marked as deprecated)
- Ensure only `frontend-deploy.yml` handles deployments

---

### 3. Build Fails During Deployment

#### Symptoms
- Workflow runs but build step fails
- Error messages about missing environment variables
- Next.js build errors

#### Diagnosis Steps

1. **Check Build Logs:**
   - GitHub Actions → `frontend-deploy.yml` → `build-and-test` job
   - Look for specific error messages
   - Check if missing env vars are mentioned

2. **Check Environment Variables:**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set in GitHub Secrets (for CI builds)
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in GitHub Secrets
   - Check Vercel Dashboard → Environment Variables (for runtime)

3. **Check Build Command:**
   - Verify `frontend/package.json` has `build` script
   - Check `vercel.json` buildCommand matches

#### Solutions

**Missing Build Environment Variables:**
1. GitHub → Settings → Secrets and variables → Actions
2. Add secrets:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
3. These are needed for CI builds (even if also in Vercel Dashboard)

**Build Command Issues:**
- Verify `frontend/package.json` has: `"build": "next build"`
- Check `vercel.json` buildCommand is correct
- Ensure Node version matches (should be 20.x)

**Next.js Build Errors:**
- Check for TypeScript errors: `npm run typecheck` locally
- Check for lint errors: `npm run lint` locally
- Fix code errors before pushing

---

### 4. Vercel Pull Fails

#### Symptoms
- `vercel pull` command fails in workflow
- Error: "Project not found" or "Authentication failed"

#### Diagnosis Steps

1. **Check Vercel Token:**
   - Verify `VERCEL_TOKEN` is valid
   - Token may have expired or been revoked
   - Check Vercel Dashboard → Account → Tokens

2. **Check Project IDs:**
   - Verify `VERCEL_ORG_ID` matches your organization
   - Verify `VERCEL_PROJECT_ID` matches your project
   - IDs are case-sensitive

3. **Check Project Linking:**
   - Vercel Dashboard → Project → Settings → General
   - Verify project is linked to correct repository (if Git Integration was used)
   - Note: Git Integration should be disabled for GitHub Actions

#### Solutions

**Invalid Token:**
1. Vercel Dashboard → Account → Tokens
2. Create new token (or verify existing token is valid)
3. Update GitHub Secret: `VERCEL_TOKEN`

**Wrong Project IDs:**
1. Vercel Dashboard → Project → Settings → General
2. Copy correct IDs:
   - Organization ID (under Organization name)
   - Project ID (under Project name)
3. Update GitHub Secrets:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

**Project Not Linked:**
- If using GitHub Actions, project doesn't need to be linked to Git
- Git Integration should be disabled
- GitHub Actions handles deployments independently

---

### 5. Deployment Succeeds But URL Not Accessible

#### Symptoms
- Workflow completes successfully
- Preview/production URL is generated
- But URL returns 404 or error page

#### Diagnosis Steps

1. **Check Vercel Dashboard:**
   - Vercel Dashboard → Deployments
   - Verify deployment exists and is successful
   - Check deployment logs for errors

2. **Check Environment Variables:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Verify Preview/Production env vars are set
   - Check if `NEXT_PUBLIC_SUPABASE_URL` is set correctly

3. **Check Build Output:**
   - Verify `frontend/.next` directory exists after build
   - Check `vercel.json` outputDirectory matches

#### Solutions

**Missing Environment Variables:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables for Preview and Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if needed)
   - `DATABASE_URL` (if needed)

**Build Output Issues:**
- Verify `vercel.json` outputDirectory is `frontend/.next`
- Check build command produces `.next` directory
- Ensure Next.js build completes successfully

**Deployment Failed in Vercel:**
- Check Vercel Dashboard → Deployments for error messages
- Review deployment logs for specific errors
- Common issues: missing env vars, build errors, timeout

---

## Verification Checklist

### Before Creating PR (Preview Deployment)

- [ ] Run `npm run deploy:doctor` locally
- [ ] Verify all required secrets are set in GitHub
- [ ] Check that Vercel Git Integration is disabled
- [ ] Ensure `frontend-deploy.yml` workflow exists
- [ ] Test build locally: `cd frontend && npm run build`

### Before Merging to Main (Production Deployment)

- [ ] Verify Preview deployment worked for PR
- [ ] Check that `deploy-main.yml` is disabled (deprecated)
- [ ] Ensure `frontend-deploy.yml` is the only active deploy workflow
- [ ] Verify Production environment variables in Vercel Dashboard
- [ ] Check that database migrations are handled separately (`supabase-migrate.yml`)

---

## Getting Help

### Documentation
- `docs/deploy-strategy.md` - Deployment strategy overview
- `docs/env-and-secrets.md` - Environment variables guide
- `docs/deploy-reliability-plan.md` - Complete troubleshooting plan

### Diagnostic Tools
- `npm run deploy:doctor` - Run diagnostic checks
- GitHub Actions logs - Check workflow execution
- Vercel Dashboard → Deployments - Check deployment status

### Common Commands
```bash
# Run diagnostic checks
npm run deploy:doctor

# Test build locally
cd frontend && npm run build

# Check environment variables
npm run env:validate

# Verify Vercel configuration
vercel env ls
```

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Troubleshooting Guide Complete
