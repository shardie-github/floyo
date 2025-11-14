# Full-Stack Smoke Test

Comprehensive smoke test for validating environment variables and secrets across all layers of the application stack.

## Quick Start

```bash
# Run the smoke test
npx tsx scripts/smoke-test-fullstack.ts

# View the report
cat reports/smoke-test-report.md

# View fix guide
cat .cursor/fixes/env_sync.md

# View manual verification guide
cat .cursor/fixes/manual-verification-guide.md
```

## What It Tests

### Automated Checks

1. **Environment Variables**
   - Cursor runtime environment
   - `.env.local` files (root and frontend)
   - Supabase configuration
   - GitHub Secrets (workflow analysis)
   - Vercel environment variables
   - Deployed Vercel runtime

2. **Connectivity**
   - Supabase database connection
   - Supabase schema validation
   - Supabase service role key
   - Supabase JWT secret
   - Vercel API routes
   - Vercel configuration

3. **Development Environment**
   - Node.js version
   - Prisma configuration
   - Prisma migrations status
   - Build scripts
   - Supabase CLI availability

### Manual Verification Required

- GitHub Secrets (requires API access)
- Vercel environment variables (requires API access)
- Supabase dashboard configuration
- Deployed Vercel functions
- GitHub Actions runtime environment

## Output Files

1. **`reports/smoke-test-report.md`** - Detailed test results
2. **`.cursor/fixes/env_sync.md`** - Environment synchronization guide
3. **`.cursor/fixes/manual-verification-guide.md`** - Manual verification steps

## Expected Environment Variables

The test checks for these critical variables:

- `DATABASE_URL` - Supabase database connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - JWT secret (optional)
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI token
- `SUPABASE_PROJECT_REF` - Supabase project reference
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run Smoke Test
  run: npx tsx scripts/smoke-test-fullstack.ts
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Troubleshooting

### "DATABASE_URL not found"

Set up your `.env.local` file or export the variable:
```bash
export DATABASE_URL="postgresql://..."
```

### "Cannot connect to Supabase"

1. Verify DATABASE_URL is correct
2. Check Supabase project is active
3. Verify network connectivity
4. Check service role key permissions

### "Vercel CLI not found"

Install Vercel CLI:
```bash
npm install -g vercel
```

### "Supabase CLI not found"

Install Supabase CLI:
```bash
npm install -g supabase
```

## Continuous Monitoring

For ongoing monitoring, consider:

1. **Scheduled Runs**: Add to cron or GitHub Actions schedule
2. **Alerts**: Set up notifications for failures
3. **Secret Drift Detection**: Compare values across sources regularly
4. **Automated Remediation**: Auto-sync from authoritative sources

## See Also

- [Manual Verification Guide](../.cursor/fixes/manual-verification-guide.md)
- [Environment Sync Guide](../.cursor/fixes/env_sync.md)
- [Full Test Report](../reports/smoke-test-report.md)
