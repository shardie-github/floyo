# Manual Verification Guide for Full-Stack Smoke Test

This guide provides step-by-step instructions for manually verifying environment variables and secrets that cannot be automatically tested.

## Prerequisites

- GitHub Personal Access Token with `repo` scope (for checking secrets)
- Vercel account access
- Supabase project access
- Terminal access

## 1. GitHub Secrets Verification

### Option A: Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# brew install gh  # macOS
# apt install gh   # Linux

# Authenticate
gh auth login

# List all secrets (requires repo admin access)
gh secret list

# Check specific secret (will show if it exists, not the value)
gh secret list | grep DATABASE_URL
gh secret list | grep SUPABASE_URL
gh secret list | grep SUPABASE_ANON_KEY
gh secret list | grep SUPABASE_SERVICE_ROLE_KEY
gh secret list | grep VERCEL_TOKEN
```

### Option B: Using GitHub API

```bash
# Set your GitHub token
export GITHUB_TOKEN="your_personal_access_token"

# Get repository secrets (requires admin access)
curl -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_ORG/YOUR_REPO/actions/secrets

# Check if specific secret exists
curl -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_ORG/YOUR_REPO/actions/secrets/DATABASE_URL
```

### Option C: Manual Dashboard Check

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Verify the following secrets exist:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF`
   - `SUPABASE_DB_PASSWORD`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `VERCEL_PROJECT_DOMAIN`

## 2. Vercel Environment Variables Verification

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd frontend
vercel link

# Pull environment variables
vercel env pull .env.vercel

# Check the file
cat .env.vercel | grep -E "DATABASE_URL|SUPABASE|VERCEL"
```

### Option B: Using Vercel API

```bash
# Set your Vercel token
export VERCEL_TOKEN="your_vercel_token"

# Get project ID (if not known)
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects

# Get environment variables for a project
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/YOUR_PROJECT_ID/env"

# Filter for specific variables
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/YOUR_PROJECT_ID/env" | \
  jq '.envs[] | select(.key | contains("SUPABASE"))'
```

### Option C: Manual Dashboard Check

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify variables exist for all three environments:
   - **Production**
   - **Preview**
   - **Development**
5. Check these variables:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF`

## 3. Supabase Configuration Verification

### Option A: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Get project info
supabase projects list

# Get API keys (requires dashboard access)
# Note: CLI doesn't expose secrets, but can verify connection
supabase status
```

### Option B: Manual Dashboard Check

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Verify and copy:
   - **Project URL** → Should match `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Should match `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → Should match `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings** → **Database**
   - Copy **Connection string** → Should match `DATABASE_URL`
   - Verify **Connection pooling** settings
6. Go to **Settings** → **Auth** → **JWT Settings**
   - Copy **JWT Secret** → Should match `SUPABASE_JWT_SECRET` (if used)

## 4. Deployed Vercel Runtime Verification

### Test Environment Test Endpoint

```bash
# Replace with your actual Vercel deployment URL
export VERCEL_URL="https://your-project.vercel.app"

# Test the environment endpoint
curl "$VERCEL_URL/api/env-test" | jq

# Expected response:
# {
#   "timestamp": "...",
#   "environment": "production",
#   "variables": [
#     { "name": "DATABASE_URL", "present": true, "length": 123 },
#     ...
#   ],
#   "checks": {
#     "database": true,
#     "supabase": true,
#     "vercel": true
#   }
# }
```

### Test Health Endpoint

```bash
# Test health endpoint
curl "$VERCEL_URL/api/health" | jq

# Should return:
# {
#   "status": "healthy",
#   "checks": {
#     "database": { "status": "healthy", "latencyMs": ... },
#     "supabase": { "status": "healthy", "latencyMs": ... }
#   }
# }
```

### Test API Routes

```bash
# Test a few key API routes
curl "$VERCEL_URL/api/health"
curl "$VERCEL_URL/api/metrics"
curl "$VERCEL_URL/api/flags"

# All should return 200 OK (or appropriate status codes)
```

## 5. GitHub Actions Runtime Verification

### Create a Test Workflow

Create `.github/workflows/test-env.yml`:

```yaml
name: Test Environment Variables

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check Environment Variables
        run: |
          echo "Checking required environment variables..."
          [ -n "$DATABASE_URL" ] && echo "✅ DATABASE_URL set" || echo "❌ DATABASE_URL missing"
          [ -n "$SUPABASE_URL" ] && echo "✅ SUPABASE_URL set" || echo "❌ SUPABASE_URL missing"
          [ -n "$SUPABASE_ANON_KEY" ] && echo "✅ SUPABASE_ANON_KEY set" || echo "❌ SUPABASE_ANON_KEY missing"
          [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "✅ SUPABASE_SERVICE_ROLE_KEY set" || echo "❌ SUPABASE_SERVICE_ROLE_KEY missing"
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Test Supabase Connection
        run: |
          npm ci
          npx prisma generate
          npx prisma migrate status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Test Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Link Supabase Project
        run: |
          echo "${{ secrets.SUPABASE_ACCESS_TOKEN }}" | supabase login --token -
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

Then run it manually from GitHub Actions tab.

## 6. Secret Parity Verification

### Compare Values Across Sources

Create a comparison script:

```bash
#!/bin/bash
# compare-secrets.sh

echo "=== Secret Parity Check ==="
echo ""

# Get from .env.local
echo "From .env.local:"
grep -E "DATABASE_URL|SUPABASE_URL|SUPABASE_ANON_KEY" .env.local 2>/dev/null || echo "No .env.local"

echo ""
echo "From Vercel (.env.vercel):"
grep -E "DATABASE_URL|SUPABASE_URL|SUPABASE_ANON_KEY" .env.vercel 2>/dev/null || echo "No .env.vercel"

echo ""
echo "From Supabase Dashboard:"
echo "  - Go to Settings → API and copy values"
echo "  - Go to Settings → Database and copy connection string"

echo ""
echo "From GitHub Secrets:"
echo "  - Use: gh secret list"
echo "  - Or check dashboard: Settings → Secrets → Actions"

echo ""
echo "Compare values and ensure they match!"
```

## 7. Edge Functions Verification

### Test Supabase Edge Functions

```bash
# Deploy edge function (dry-run)
supabase functions deploy YOUR_FUNCTION_NAME --dry-run

# Verify function can access environment variables
# Check function code for process.env usage
```

### Test Vercel Edge Functions

Edge functions in Vercel automatically have access to environment variables.
Test by deploying and checking logs:

```bash
# Deploy to preview
vercel deploy --prebuilt

# Check function logs
vercel logs YOUR_DEPLOYMENT_URL --follow
```

## 8. RLS (Row Level Security) Verification

```bash
# Run RLS verification script
npm run verify:rls

# Or manually:
tsx scripts/verify-rls.ts
```

## 9. Database Schema Verification

```bash
# Check migrations status
npx prisma migrate status

# Verify schema matches Prisma schema
npx prisma db pull --force
# Compare with prisma/schema.prisma

# Check for missing tables/functions
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "\df"  # List functions
```

## 10. Final Checklist

- [ ] All GitHub Secrets are set
- [ ] All Vercel environment variables are set (Production, Preview, Development)
- [ ] Supabase API keys match across all sources
- [ ] DATABASE_URL matches Supabase connection string
- [ ] Deployed Vercel functions can access environment variables
- [ ] GitHub Actions can access secrets during CI runs
- [ ] Local development can connect to Supabase
- [ ] RLS policies are enabled and working
- [ ] Edge functions can access required secrets
- [ ] No mismatches between sources

## Troubleshooting

### Secret Mismatch Found

1. Identify authoritative source (Supabase for DB vars)
2. Update all other sources to match
3. Re-run smoke test
4. Verify deployed functions still work

### Missing Secret

1. Get value from authoritative source
2. Add to GitHub Secrets: `gh secret set VAR_NAME`
3. Add to Vercel: `vercel env add VAR_NAME production`
4. Add to .env.local for local development
5. Re-run smoke test

### Connection Failures

1. Verify DATABASE_URL format is correct
2. Check Supabase project is active
3. Verify network/firewall rules
4. Check service role key has correct permissions
5. Verify RLS policies allow access

## Next Steps

After completing manual verification:

1. Update `.cursor/fixes/env_sync.md` with actual values (securely)
2. Re-run automated smoke test: `npx tsx scripts/smoke-test-fullstack.ts`
3. Verify all tests pass
4. Document any remaining issues
5. Set up automated monitoring for secret drift
