# Frontend Deployment via GitHub Actions to Vercel

This document explains how frontend deployments are handled automatically via GitHub Actions, with **zero reliance on local CLI tools**.

## Overview

The **Frontend CI/CD** workflow (`.github/workflows/frontend-deploy.yml`) automatically:
- Runs quality checks (lint, test, typecheck, build) on every PR and push to `main`
- Deploys preview environments for pull requests
- Deploys to production when code is merged to `main`
- Provides deployment URLs in PR comments and workflow logs

## Workflow Structure

### Triggers

The workflow runs automatically on:
- **Pull Requests** to `main` branch → Creates preview deployments
- **Pushes** to `main` branch → Creates production deployments
- **Manual trigger** via `workflow_dispatch` from GitHub Actions UI

### Jobs

#### 1. `build-and-test`
Runs before any deployment to ensure code quality:
- ✅ **Lint**: TypeScript/ESLint checks
- ✅ **Tests**: Jest unit tests
- ✅ **Typecheck**: TypeScript type checking
- ✅ **Build**: Next.js production build

**If any step fails, the deployment is blocked.**

#### 2. `deploy`
Runs only if `build-and-test` succeeds:
- **For PRs**: Deploys to Vercel Preview environment
- **For `main`**: Deploys to Vercel Production environment
- Comments on PRs with preview URL
- Outputs deployment URL in workflow logs

## Required GitHub Secrets

The workflow requires these secrets to be configured in your GitHub repository:

### Vercel Secrets

1. **`VERCEL_TOKEN`**
   - **How to get**: 
     - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
     - Click "Create Token"
     - Give it a name (e.g., "GitHub Actions CI/CD")
     - Copy the token
   - **Where to add**: GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret

2. **`VERCEL_ORG_ID`**
   - **How to get**:
     - Go to [Vercel Dashboard](https://vercel.com/account)
     - Open your organization settings
     - The Org ID is in the URL or under Settings → General
     - Alternatively, run `vercel whoami` locally (if you have CLI) or check `.vercel/project.json` if it exists
   - **Where to add**: Same as above

3. **`VERCEL_PROJECT_ID`**
   - **How to get**:
     - Go to your project in Vercel Dashboard
     - Open Project Settings → General
     - The Project ID is listed there
     - Alternatively, check `.vercel/project.json` if it exists
   - **Where to add**: Same as above

### Optional (for build-time environment variables)

- **`NEXT_PUBLIC_SUPABASE_URL`**: Supabase project URL (if not set, uses placeholder)
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase anonymous key (if not set, uses placeholder)

**Note**: These are only used during the build step. Production environment variables should be configured directly in Vercel Dashboard.

## How It Works

### For Pull Requests

1. Developer opens a PR to `main`
2. GitHub Actions triggers `frontend-deploy.yml`
3. `build-and-test` job runs:
   - Installs dependencies (`npm ci`)
   - Runs lint, tests, typecheck
   - Builds Next.js app
4. If all checks pass, `deploy` job runs:
   - Pulls Vercel config for preview environment
   - Builds the app with Vercel CLI
   - Deploys to Vercel Preview
   - Comments on PR with preview URL

### For Production (`main` branch)

1. Code is merged to `main` (or pushed directly)
2. GitHub Actions triggers `frontend-deploy.yml`
3. `build-and-test` job runs (same as PRs)
4. If all checks pass, `deploy` job runs:
   - Pulls Vercel config for production environment
   - Builds the app with Vercel CLI
   - Deploys to Vercel Production
   - Outputs production URL in logs

## Finding Deployment URLs

### Preview Deployments (PRs)
- **In PR comments**: A sticky comment is automatically added/updated with the preview URL
- **In workflow logs**: Check the "Deploy to Vercel (Preview)" step output
- **In Vercel Dashboard**: Go to your project → Deployments → Find the deployment for the PR

### Production Deployments
- **In workflow logs**: Check the "Deploy to Vercel (Production)" step output
- **In Vercel Dashboard**: Go to your project → Deployments → Latest production deployment

## Manual Trigger

To manually trigger a deployment:

1. Go to GitHub → Actions tab
2. Select "Frontend CI/CD" workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

## Troubleshooting

### Deployment Fails: "VERCEL_TOKEN not set"
- Ensure the secret is added in GitHub → Settings → Secrets and variables → Actions
- Check that the secret name matches exactly: `VERCEL_TOKEN`

### Build Fails: Missing Environment Variables
- For build-time variables: Add them as GitHub Secrets
- For runtime variables: Configure them in Vercel Dashboard → Project Settings → Environment Variables

### Preview URL Not Appearing in PR
- Check workflow logs for errors in the "Comment PR with Preview URL" step
- Ensure the workflow has `pull-requests: write` permission (it does by default)

### Deployment Succeeds But Site Doesn't Work
- Check Vercel Dashboard for deployment logs
- Verify environment variables are set correctly in Vercel
- Check that Supabase URLs/keys are correct

## Separation of Concerns

### Frontend Deployments
- **Handled by**: `frontend-deploy.yml` workflow
- **Scope**: Vercel deployments only
- **No database changes**: This workflow does not touch Supabase

### Database Migrations
- **Handled by**: `supabase-migrate.yml` workflow
- **Scope**: Supabase migrations only
- **Runs independently**: Can be triggered separately or on merge to `main`

**Important**: Frontend deployments and database migrations are **decoupled**. This means:
- You can deploy frontend changes without running migrations
- You can run migrations without deploying frontend
- Both can run in parallel without conflicts

## No Local CLI Required

✅ **Everything runs in GitHub Actions**
- No need to install Vercel CLI locally
- No need to run `vercel login` locally
- No need to manually deploy from your machine

The workflow handles:
- Authentication with Vercel
- Pulling Vercel configuration
- Building the application
- Deploying to the correct environment

## Related Documentation

- [CI/CD Overview](./ci-overview.md) - Complete CI/CD pipeline documentation
- [Supabase Migrations CI](./supabase-migrations-ci.md) - Database migration workflow
- [README.md](../README.md) - Project overview and setup

## Workflow File

The workflow is defined in: `.github/workflows/frontend-deploy.yml`

You can view and modify it directly in the repository.
