# Environment Variables Setup Guide

This document describes all environment variables used in the Supabase-backed application, their sources, and how to configure them.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in values from your Supabase Dashboard (see sections below)

3. Never commit `.env.local` to git (it's gitignored)

---

## Required Environment Variables

### Supabase Configuration

#### `SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Source**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Usage**: Server-side Supabase client initialization
- **Security**: Can be public (URL only)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key (bypasses RLS - keep secret!)
- **Source**: Supabase Dashboard → Settings → API → service_role key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Usage**: Server-side operations that need to bypass RLS
- **Security**: ⚠️ **SECRET** - Never expose to client, never commit to git
- **Where to set**: 
  - Local: `.env.local`
  - Vercel: Project Settings → Environment Variables (Mark as Sensitive)
  - GitHub Actions: Repository Settings → Secrets

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Supabase project URL (public, exposed to client)
- **Source**: Same as `SUPABASE_URL`
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Usage**: Client-side Supabase client initialization
- **Security**: Safe to expose (public URL)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous/public key (safe to expose)
- **Source**: Supabase Dashboard → Settings → API → anon/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Usage**: Client-side Supabase operations (respects RLS)
- **Security**: Safe to expose (public key)

#### `SUPABASE_PROJECT_REF`
- **Description**: Supabase project reference ID
- **Source**: Supabase Dashboard → Settings → General → Reference ID
- **Example**: `abcdefghijklmnop`
- **Usage**: Supabase CLI operations, migration scripts
- **Security**: Can be public (identifier only)

#### `SUPABASE_ACCESS_TOKEN`
- **Description**: Supabase CLI access token
- **Source**: Supabase Dashboard → Account → Access Tokens
- **Usage**: Supabase CLI authentication (`supabase login`)
- **Security**: ⚠️ **SECRET** - Keep private
- **Note**: Usually stored by `supabase login` command, not needed in `.env`

#### `DATABASE_URL` (Optional)
- **Description**: Direct PostgreSQL connection string
- **Source**: Supabase Dashboard → Settings → Database → Connection string
- **Example**: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- **Usage**: Direct database connections (Prisma, migrations, etc.)
- **Security**: ⚠️ **SECRET** - Contains password
- **Alternative**: Use `SUPABASE_DB_URL` if available

---

## Optional Environment Variables

### Application Configuration

#### `NODE_ENV`
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Usage**: Node.js environment detection

#### `ENVIRONMENT`
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Usage**: Application environment detection

#### `FRONTEND_URL`
- **Description**: Frontend application URL
- **Default**: `http://localhost:3000`
- **Usage**: Email links, redirects

#### `NEXT_PUBLIC_SITE_URL`
- **Description**: Public site URL
- **Default**: `http://localhost:3000`
- **Usage**: Public links, SEO

### Security & Secrets

#### `SECRET_KEY`
- **Description**: Application secret key (for JWT, encryption)
- **Usage**: Token signing, encryption
- **Security**: ⚠️ **SECRET** - Generate strong random string

#### `SNAPSHOT_ENCRYPTION_KEY`
- **Description**: Encryption key for snapshots
- **Usage**: Data encryption
- **Security**: ⚠️ **SECRET** - Generate strong random string

#### `CRON_SECRET`
- **Description**: Secret for authenticated cron endpoints
- **Usage**: Cron job authentication
- **Security**: ⚠️ **SECRET**

### External Integrations

#### `OPENAI_API_KEY`
- **Description**: OpenAI API key for AI features
- **Source**: https://platform.openai.com/api-keys
- **Usage**: AI-powered features
- **Security**: ⚠️ **SECRET** - Keep private
- **Where to set**:
  - Local: `.env.local`
  - Vercel: Project Settings → Environment Variables (Mark as Sensitive)
  - GitHub Actions: Repository Settings → Secrets

#### `STRIPE_API_KEY`
- **Description**: Stripe API key for payments
- **Source**: Stripe Dashboard → Developers → API keys
- **Security**: ⚠️ **SECRET**

#### `STRIPE_WEBHOOK_SECRET`
- **Description**: Stripe webhook signing secret
- **Source**: Stripe Dashboard → Developers → Webhooks
- **Security**: ⚠️ **SECRET**

### Monitoring & Observability

#### `SENTRY_DSN`
- **Description**: Sentry DSN for error tracking (server-side)
- **Source**: Sentry Dashboard → Settings → Client Keys
- **Security**: Can be public (DSN only)

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Description**: Sentry DSN for error tracking (client-side)
- **Source**: Same as `SENTRY_DSN`
- **Security**: Safe to expose (public DSN)

---

## Environment Variable Mapping

### Frontend (Client-Side)
These variables are exposed to the browser via `NEXT_PUBLIC_*` prefix:

- `NEXT_PUBLIC_SUPABASE_URL` ✅ Safe to expose
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ Safe to expose
- `NEXT_PUBLIC_SITE_URL` ✅ Safe to expose
- `NEXT_PUBLIC_SENTRY_DSN` ✅ Safe to expose
- `NEXT_PUBLIC_POSTHOG_KEY` ✅ Safe to expose

### Backend (Server-Side)
These variables are **never** exposed to the client:

- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRET**
- `DATABASE_URL` ⚠️ **SECRET**
- `OPENAI_API_KEY` ⚠️ **SECRET**
- `SECRET_KEY` ⚠️ **SECRET**
- `STRIPE_API_KEY` ⚠️ **SECRET**

---

## Setup Instructions by Platform

### Local Development

1. Copy example file:
   ```bash
   cp .env.example .env.local
   ```

2. Get values from Supabase Dashboard:
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to Settings → API
   - Copy values to `.env.local`

3. Get OpenAI API key:
   - Go to https://platform.openai.com/api-keys
   - Create new secret key
   - Add to `.env.local` as `OPENAI_API_KEY`

4. Verify setup:
   ```bash
   # Check that required vars are set
   grep -E "SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE" .env.local
   ```

### Vercel Deployment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add variables:
   - `SUPABASE_URL` (Production, Preview, Development)
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Mark as **Sensitive**
   - `NEXT_PUBLIC_SUPABASE_URL` (Production, Preview, Development)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production, Preview, Development)
   - `OPENAI_API_KEY` ⚠️ Mark as **Sensitive**
   - `DATABASE_URL` ⚠️ Mark as **Sensitive** (if using)

3. Deploy:
   ```bash
   vercel --prod
   ```

### GitHub Actions CI/CD

1. Go to Repository → Settings → Secrets and variables → Actions

2. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️
   - `SUPABASE_PROJECT_REF`
   - `OPENAI_API_KEY` ⚠️
   - `DATABASE_URL` ⚠️ (if using)

3. Use in workflow:
   ```yaml
   env:
     SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
     SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
   ```

### Supabase Edge Functions

Edge functions have their own environment variables:

1. Go to Supabase Dashboard → Edge Functions → Settings

2. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️
   - `OPENAI_API_KEY` ⚠️

3. Access in function:
   ```typescript
   const apiKey = Deno.env.get('OPENAI_API_KEY');
   ```

---

## Security Checklist

- [ ] No secrets committed to git (check `.gitignore` includes `.env.local`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` marked as sensitive in Vercel
- [ ] `OPENAI_API_KEY` marked as sensitive in Vercel
- [ ] Only `NEXT_PUBLIC_*` vars exposed to client
- [ ] Service role key never used in client-side code
- [ ] Database URL never exposed to client
- [ ] All secrets stored in secure vault (Vercel/GitHub Secrets)

---

## Troubleshooting

### "Missing Supabase configuration"
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify `.env.local` exists and is loaded (Next.js loads it automatically)

### "Missing OpenAI API key"
- Check that `OPENAI_API_KEY` is set
- Verify key is valid at https://platform.openai.com/api-keys

### "RLS policy violation"
- Ensure using `NEXT_PUBLIC_SUPABASE_ANON_KEY` on client-side
- Use `SUPABASE_SERVICE_ROLE_KEY` only on server-side when needed

### "Migration failed"
- Check `SUPABASE_PROJECT_REF` is set
- Verify `supabase login` has been run
- Check Supabase CLI is installed: `supabase --version`

---

## Related Documentation

- [Database Overview](./db-overview.md) - Database schema documentation
- [Database Gaps](./db-gaps.md) - Known schema issues
- [Migration Guide](../supabase/migrations/README.md) - How to apply migrations
