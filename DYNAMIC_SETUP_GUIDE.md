# Dynamic Configuration and Migration Guide

This guide explains how all configuration is pulled dynamically from environment variables at runtime, ensuring no hardcoded values exist in the codebase.

## Overview

All configuration values are loaded from:
1. **GitHub Secrets** (for CI/CD pipelines)
2. **Vercel Environment Variables** (for Vercel deployments)
3. **Supabase Environment Variables** (for Supabase services)
4. **Local `.env` file** (for local development)

Priority order: Process env → GitHub → Vercel → Supabase → Local .env

## Environment Variables

### Required Variables

#### Backend
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_USER=floyo
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=floyo
POSTGRES_PORT=5432

# Security
SECRET_KEY=<generate-strong-random-32-plus-chars>
ENCRYPTION_KEY=<generate-strong-random-32-plus-chars>
ENCRYPTION_SALT=<generate-strong-random-16-plus-chars>

# Redis
REDIS_URL=redis://host:port/0
REDIS_PASSWORD=<optional>

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=production
CORS_ORIGINS=https://app.floyo.com,https://www.floyo.com
```

#### Supabase
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=<optional-for-api-access>
```

#### Frontend
```bash
NEXT_PUBLIC_API_URL=https://api.floyo.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SENTRY_DSN=<optional>
NEXT_PUBLIC_POSTHOG_KEY=<optional>
NEXT_PUBLIC_POSTHOG_HOST=<optional>
NEXT_PUBLIC_HCAPTCHA_SITEKEY=<optional>
```

### Optional Variables

```bash
# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=<same-as-above>

# Payments
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=<optional>
EMAIL_FROM=noreply@floyo.com

# Celery
CELERY_BROKER_URL=redis://host:port/0
CELERY_RESULT_BACKEND=redis://host:port/0

# Supabase Configuration
SUPABASE_SITE_URL=https://app.floyo.com
SUPABASE_ENABLE_SIGNUP=true
SUPABASE_REALTIME_ENABLED=true
SUPABASE_STORAGE_ENABLED=true
```

## Setup Process

### 1. Local Development Setup

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
nano .env

# Load environment variables
source .env

# Run migrations
./scripts/supabase-setup-complete.sh

# Start services
docker-compose up -d
```

### 2. GitHub Actions Setup

Add secrets in GitHub repository settings:
- Go to Settings → Secrets and variables → Actions
- Add all required environment variables

The CI/CD pipeline will automatically load these.

### 3. Vercel Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add SECRET_KEY
# ... add all required variables

# Or via Dashboard:
# Project Settings → Environment Variables
```

### 4. Supabase Setup

#### Via Supabase Dashboard:
1. Go to Project Settings → API
2. Copy `URL` and `service_role` key
3. Set as environment variables

#### Via Supabase CLI:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Set environment variables
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

## Migration Process

### Apply All Migrations

```bash
# Using the comprehensive setup script
./scripts/supabase-setup-complete.sh

# Or manually with Supabase CLI
supabase db push

# Or using TypeScript script
tsx scripts/supabase-migrate-all.ts
```

### Verify Migrations

```bash
# Run verification script
tsx scripts/verify-migrations.ts
```

This will check:
- ✅ All tables exist
- ✅ RLS policies are enabled
- ✅ Indexes are created
- ✅ Edge functions are deployed
- ✅ Auth is configured
- ✅ Realtime is enabled

## Database Migrations

All migrations are in `supabase/migrations/`:

1. **20240101000000_initial_schema.sql** - Initial tables and RLS
2. **20240101000001_validation_queries.sql** - Validation queries
3. **20240101000002_enhanced_policies.sql** - Enhanced RLS policies
4. **20240101000003_privacy_monitoring.sql** - Privacy monitoring
5. **2025-11-05_telemetry.sql** - Telemetry events table
6. **2025-11-05_trust_audit.sql** - Trust audit log
7. **20251105_crux_hardening.sql** - Performance indexes
8. **20251105_workflow_runs.sql** - Workflow runs table

Migrations are applied automatically in order.

## RLS Policies

All tables have Row Level Security (RLS) enabled with policies:
- Users can only access their own data
- Service role has full access for background jobs
- Public read access for feature flags and offers

## Edge Functions

Edge functions are deployed to Supabase and use environment variables:

- **ingest-telemetry** - Ingests telemetry events
- **analyze-patterns** - Analyzes user patterns
- **generate-suggestions** - Generates integration suggestions

Deploy with:
```bash
supabase functions deploy ingest-telemetry
supabase functions deploy analyze-patterns
supabase functions deploy generate-suggestions
```

## Docker Compose

All Docker Compose values are now environment variables:

```yaml
# No hardcoded values - all use ${VAR_NAME:-default}
services:
  postgres:
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-floyo}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      # ...
```

## Frontend Configuration

Frontend uses `NEXT_PUBLIC_*` prefixed environment variables:

```typescript
// All values pulled from process.env at build time
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

## Backend Configuration

Backend uses `backend/config.py` which loads from environment:

```python
from backend.config import settings

# All values come from environment variables
database_url = settings.database_url
secret_key = settings.secret_key
```

## Verification Checklist

- [ ] All environment variables set
- [ ] Migrations applied successfully
- [ ] RLS policies enabled on all tables
- [ ] Edge functions deployed
- [ ] Auth configured in Supabase Dashboard
- [ ] Realtime enabled for required tables
- [ ] Docker Compose uses environment variables
- [ ] Frontend uses `NEXT_PUBLIC_*` variables
- [ ] Backend uses `settings` from config.py
- [ ] No hardcoded values in codebase

## Troubleshooting

### Migration Fails

```bash
# Check Supabase connection
supabase status

# Verify environment variables
tsx scripts/load-env-dynamic.ts

# Run migrations manually via Dashboard
# Supabase Dashboard → SQL Editor → Paste migration SQL
```

### Edge Functions Not Working

```bash
# Check function logs
supabase functions logs ingest-telemetry

# Verify environment variables are set
supabase secrets list

# Redeploy function
supabase functions deploy ingest-telemetry
```

### RLS Policies Blocking Access

```bash
# Check policies
supabase db inspect

# Verify user authentication
# Check JWT token in request headers
```

## Security Notes

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use different keys for each environment** - Don't reuse production keys
3. **Rotate keys regularly** - Especially if compromised
4. **Use secrets management** - AWS Secrets Manager, HashiCorp Vault, etc.
5. **Minimum key lengths**:
   - `SECRET_KEY`: 32+ characters
   - `ENCRYPTION_KEY`: 32+ characters
   - `ENCRYPTION_SALT`: 16+ characters

## Scripts Reference

- `scripts/supabase-setup-complete.sh` - Complete setup script
- `scripts/supabase-migrate-all.ts` - Apply all migrations
- `scripts/verify-migrations.ts` - Verify setup
- `scripts/load-env-dynamic.ts` - Load env vars from all sources

## Support

For issues or questions:
1. Check this guide
2. Run verification script: `tsx scripts/verify-migrations.ts`
3. Check Supabase Dashboard logs
4. Review migration files in `supabase/migrations/`
