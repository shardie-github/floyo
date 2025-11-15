# ⭐ Aurora Prime — Full Stack Autopilot

Aurora Prime is an autonomous full-stack orchestrator responsible for validating, healing, and deploying the entire application stack end-to-end. It operates across GitHub → Supabase → Vercel → Expo without requiring any local `.env` files. All secrets originate from GitHub repository secrets.

## Overview

Aurora Prime performs comprehensive system validation and self-healing across:

1. **Environment Verification** - Validates GitHub Secrets usage across all services
2. **Supabase Migration & Schema Health** - Checks migrations, schema alignment, RLS policies
3. **Vercel Frontend Deployment** - Validates deployment configuration and environment variables
4. **Expo Mobile App Deployment** - Validates mobile app configuration and OTA updates
5. **CI/CD Pipeline Autopilot** - Validates and fixes GitHub Actions workflows
6. **Self-Healing Logic** - Automatically fixes detected issues when possible
7. **Status Reporting** - Generates comprehensive system status reports

## Usage

### Via OPS CLI

```bash
# Run Aurora Prime validation
npm run ops:aurora-prime

# Run with auto-fix enabled
npm run ops:aurora-prime -- --fix

# Run with verbose output
npm run ops:aurora-prime -- --verbose
```

### Standalone Script

```bash
# Run directly
npm run aurora-prime

# With options
tsx scripts/aurora-prime.ts --fix --verbose
```

### GitHub Actions

Aurora Prime runs automatically:
- Daily at 2 AM UTC (scheduled)
- On push to `main` branch (when relevant files change)
- On workflow dispatch (manual trigger)

## Required GitHub Secrets

Aurora Prime expects these secrets to be configured in GitHub:

### Supabase
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anonymous key for client operations
- `SUPABASE_ACCESS_TOKEN` - Access token for CLI operations
- `SUPABASE_PROJECT_REF` - Project reference ID

### Vercel
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Expo
- `EXPO_TOKEN` - Expo/EAS API token

### GitHub
- `GITHUB_TOKEN` - GitHub API token (optional, uses default if not set)

### Environment Variables (Auto-synced)
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL for Next.js
- `EXPO_PUBLIC_SUPABASE_URL` - Public Supabase URL for Expo

## What Aurora Prime Checks

### 1. Environment Verification
- ✅ All required secrets are referenced in GitHub workflows
- ✅ No hardcoded secrets in workflow files
- ✅ Vercel environment variables sync from GitHub Secrets
- ✅ Expo configuration uses environment variables correctly

### 2. Supabase Health
- ✅ Migrations directory exists and contains valid migrations
- ✅ Prisma schema is valid and aligned with database
- ✅ Supabase config.toml exists and is properly configured
- ✅ Edge Functions are properly structured
- ✅ Database connection is healthy
- ✅ Schema drift detection (if credentials available)
- ✅ RLS policies validation

### 3. Vercel Deployment
- ✅ vercel.json configuration exists and is valid
- ✅ Frontend directory structure is correct
- ✅ Deployment workflow includes Vercel deployment step
- ✅ Environment variables are properly configured

### 4. Expo Mobile App
- ✅ eas.json configuration exists
- ✅ OTA updates are enabled
- ✅ Supabase URL is configured for mobile
- ✅ Mobile build workflow exists and is configured

### 5. CI/CD Pipelines
- ✅ Essential workflows exist (CI, deployment)
- ✅ Workflow syntax is valid
- ✅ Permissions are properly configured
- ✅ Automated Doctor job is present (recommended)

## Self-Healing

When run with `--fix`, Aurora Prime will automatically:

- Create missing configuration files (vercel.json, eas.json, config.toml)
- Add missing secret references to workflows
- Create missing directories (migrations, workflows)
- Fix common configuration issues
- Generate missing Edge Function structure

**Note:** Aurora Prime will never:
- Modify production data
- Delete existing configurations
- Overwrite user-created files without clear indication
- Make destructive changes without validation

## Status Report Format

Every run outputs a comprehensive status report:

```
⭐ AURORA PRIME — FULL SYSTEM STATUS
================================================================================

Supabase:              [Healthy / FIXED / Needs Attention]
Vercel Deployment:     [Healthy / FIXED / Needs Attention]
Expo (iOS/Android):    [Healthy / FIXED / Needs Attention]
GitHub Actions:        [Healthy / FIXED / Needs Attention]
Secrets Alignment:     [Healthy / FIXED / Needs Attention]
Schema Drift:          [None / Auto-repaired / Needs Manual Review]

🔧 Applied Fixes:
   ✓ Created supabase/migrations directory
   ✓ Added SUPABASE_URL to deploy-main.yml

💡 Recommended Next Actions:
   - Ensure Vercel environment variables sync from GitHub Secrets
   - Run "npx prisma generate" to generate Prisma client
```

## Integration with Existing Workflows

Aurora Prime integrates seamlessly with:

- **deploy-main.yml** - Validates and enhances production deployment
- **mobile.yml** - Validates Expo build configuration
- **supabase_delta_apply.yml** - Ensures schema migrations are applied
- **orchestrate.yml** - Complements existing orchestrator with full-stack focus

## Best Practices

1. **Run Aurora Prime before deployments** - Catch issues early
2. **Enable auto-fix in CI/CD** - Let Aurora Prime fix common issues automatically
3. **Review recommendations** - Address recommendations to improve system health
4. **Monitor status reports** - Track system health over time
5. **Keep secrets in GitHub** - Never commit secrets to repository

## Troubleshooting

### "Secrets Alignment: Needs Attention"
- Ensure all required secrets are set in GitHub repository settings
- Check that workflows reference secrets using `${{ secrets.SECRET_NAME }}`

### "Schema Drift: Needs Manual Review"
- Review pending migrations in `supabase/migrations/`
- Run `supabase db remote commit --dry-run` to see differences
- Apply migrations if needed

### "Vercel Deployment: Needs Attention"
- Verify `vercel.json` exists and is valid JSON
- Check that `VERCEL_TOKEN` is set in GitHub Secrets
- Ensure frontend directory structure is correct

### "Expo: Needs Attention"
- Verify `eas.json` exists and is valid JSON
- Check that `EXPO_TOKEN` is set in GitHub Secrets
- Ensure OTA updates are configured

## Architecture

Aurora Prime is built as a modular TypeScript system:

- **Core Orchestrator** (`ops/commands/aurora-prime.ts`) - Main validation logic
- **Standalone Script** (`scripts/aurora-prime.ts`) - Direct execution entry point
- **GitHub Actions Workflow** (`.github/workflows/aurora-prime.yml`) - CI/CD integration
- **OPS CLI Integration** (`ops/cli.ts`) - Command-line interface

## Contributing

When extending Aurora Prime:

1. Add new checks to the appropriate verification function
2. Implement self-healing logic in the `fix` parameter branches
3. Update status report format if adding new status types
4. Add tests for new validation logic
5. Update this documentation

## License

Part of the Floyo monorepo. See LICENSE file for details.
