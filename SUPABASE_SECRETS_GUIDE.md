# Supabase Secrets Guide: GitHub Actions & Vercel

This guide explains exactly which Supabase credentials you need and where to put them.

## 📋 Quick Reference

### GitHub Actions Secrets (Repository Secrets)
- `SUPABASE_ACCESS_TOKEN` ⭐
- `SUPABASE_PROJECT_REF` ⭐
- `SUPABASE_DB_PASSWORD` ⭐

### Vercel Environment Variables (Public - Client-Side)
- `NEXT_PUBLIC_SUPABASE_URL` ⭐
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⭐

### Vercel Environment Variables (Private - Server-Side Only)
- `SUPABASE_SERVICE_ROLE_KEY` ⭐ (Mark as Sensitive)
- `SUPABASE_URL` (optional, usually same as NEXT_PUBLIC_SUPABASE_URL)
- `DATABASE_URL` (optional, for direct Postgres connections)

---

## 🔐 Part 1: GitHub Actions Secrets

These are used by GitHub Actions workflows to deploy and manage Supabase.

### Required Secrets

#### 1. SUPABASE_ACCESS_TOKEN ⭐

**What it is:** Authentication token for Supabase CLI

**How to get it:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click your profile icon (top right) → **Account Settings**
3. Navigate to **Access Tokens** (left sidebar)
4. Click **Generate New Token**
5. Give it a name (e.g., "floyo-github-actions")
6. Click **Generate Token**
7. **⚠️ IMPORTANT:** Copy it immediately - you won't see it again!

**Where to add:**
- GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**
- Name: `SUPABASE_ACCESS_TOKEN`
- Value: Paste your token
- Click **Add secret**

**Used for:**
- `npm run supa:login` (in GitHub Actions)
- Running Supabase CLI commands in CI/CD
- Applying migrations via GitHub Actions

---

#### 2. SUPABASE_PROJECT_REF ⭐

**What it is:** Your Supabase project reference ID

**How to get it:**
1. Go to your Supabase project dashboard
2. Go to **Settings** → **General**
3. Look for **Reference ID** or **Project ID**
   - Format: `xxxxxxxxxxxxx` (alphanumeric string)
   - Example: `abcdefghijklmnop`
4. Or extract from your Supabase URL:
   - URL: `https://abcdefghijklmnop.supabase.co`
   - Project Ref: `abcdefghijklmnop` (the part before `.supabase.co`)

**Where to add:**
- GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**
- Name: `SUPABASE_PROJECT_REF`
- Value: Your project reference ID
- Click **Add secret**

**Used for:**
- `npm run supa:link` (linking to your project)
- Database migrations in CI/CD

---

#### 3. SUPABASE_DB_PASSWORD ⭐

**What it is:** Your Supabase database password

**How to get it:**
1. Go to your Supabase project dashboard
2. Go to **Settings** → **Database**
3. Look for **Database Password**
4. If you don't remember it:
   - Click **Reset Database Password**
   - Generate a new strong password
   - **⚠️ Save it securely** - you'll need it for connections

**Where to add:**
- GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**
- Name: `SUPABASE_DB_PASSWORD`
- Value: Your database password
- Click **Add secret**

**Used for:**
- Database migrations requiring direct connection
- Connection string generation
- Backup operations

---

## 🌐 Part 2: Vercel Environment Variables

These are used by your Next.js application running on Vercel.

### Public Variables (Client-Side - Safe to expose)

These start with `NEXT_PUBLIC_` and are accessible in the browser. They're safe to expose because they use Row Level Security (RLS).

#### 1. NEXT_PUBLIC_SUPABASE_URL ⭐

**What it is:** Your Supabase project URL (public)

**How to get it:**
1. Go to your Supabase project dashboard
2. Go to **Settings** → **API**
3. Find **Project URL**
   - Format: `https://xxxxxxxxxxxxx.supabase.co`
   - Example: `https://abcdefghijklmnop.supabase.co`

**Where to add:**
- Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
- Click **Add New**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Your Supabase URL (e.g., `https://abcdefghijklmnop.supabase.co`)
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

**Used for:**
- Client-side Supabase client initialization
- Browser-based database queries
- Public API access

---

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY ⭐

**What it is:** Your Supabase anonymous/public key (safe to expose)

**How to get it:**
1. Go to your Supabase project dashboard
2. Go to **Settings** → **API**
3. Find **anon public** key (or **Project API keys** → **anon**)
   - Format: Long JWT token string
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Where to add:**
- Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
- Click **Add New**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Your anon key
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

**⚠️ Important:** This key is safe to expose because:
- It's used with Row Level Security (RLS)
- Users can only access their own data
- RLS policies enforce security

**Used for:**
- Client-side Supabase authentication
- Browser-based queries (enforced by RLS)
- Public API access

---

### Private Variables (Server-Side Only - Keep Secret!)

These are **NOT** prefixed with `NEXT_PUBLIC_` and should be marked as **Sensitive** in Vercel.

#### 3. SUPABASE_SERVICE_ROLE_KEY ⭐

**What it is:** Your Supabase service role key (bypasses RLS - keep secret!)

**How to get it:**
1. Go to your Supabase project dashboard
2. Go to **Settings** → **API**
3. Find **service_role** key (or **Project API keys** → **service_role**)
   - Format: Long JWT token string
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **⚠️ WARNING:** This key bypasses RLS - keep it secret!

**Where to add:**
- Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
- Click **Add New**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: Your service role key
- **Mark as Sensitive** ✅ (important!)
- Environments: ✅ Production, ✅ Preview (optional for dev)
- Click **Save**

**⚠️ Security Warning:**
- This key bypasses Row Level Security
- Only use it in server-side code (API routes, Server Components)
- Never expose it to the client
- Never commit it to git

**Used for:**
- Admin operations
- Server-side API routes
- Bypassing RLS for system operations
- Backend operations requiring full access

---

### Optional Variables

#### 4. SUPABASE_URL

**What it is:** Same as `NEXT_PUBLIC_SUPABASE_URL` but for server-side use

**Where to add:**
- Usually same value as `NEXT_PUBLIC_SUPABASE_URL`
- Only needed if you have separate server-side code that doesn't use the `NEXT_PUBLIC_` prefix

---

#### 5. DATABASE_URL

**What it is:** Direct PostgreSQL connection string

**How to get it:**
1. Go to your Supabase project dashboard
2. Go to **Settings** → **Database**
3. Find **Connection string** or **Connection pooling**
4. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
5. Replace `[PASSWORD]` with your database password
6. Replace `[PROJECT-REF]` with your project reference ID

**Where to add:**
- Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
- Click **Add New**
- Name: `DATABASE_URL`
- Value: Your connection string
- **Mark as Sensitive** ✅
- Environments: ✅ Production, ✅ Preview (optional for dev)
- Click **Save**

**Used for:**
- Direct Postgres connections (bypassing Supabase API)
- Prisma, Drizzle, or other ORMs
- Database migrations (if not using Supabase CLI)

---

## 📝 Summary Checklist

### GitHub Actions Secrets ✅
- [ ] `SUPABASE_ACCESS_TOKEN` - From Account Settings → Access Tokens
- [ ] `SUPABASE_PROJECT_REF` - From Settings → General (or extract from URL)
- [ ] `SUPABASE_DB_PASSWORD` - From Settings → Database

### Vercel Environment Variables ✅

**Public (Client-Side):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - From Settings → API
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Settings → API

**Private (Server-Side):**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Settings → API (Mark as Sensitive!)
- [ ] `DATABASE_URL` - Optional, from Settings → Database

---

## 🔍 Where to Find Everything in Supabase Dashboard

### Settings → API
- ✅ Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- ✅ anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Settings → General
- ✅ Reference ID → `SUPABASE_PROJECT_REF`

### Settings → Database
- ✅ Database Password → `SUPABASE_DB_PASSWORD`
- ✅ Connection string → `DATABASE_URL` (optional)

### Account Settings → Access Tokens
- ✅ Personal Access Token → `SUPABASE_ACCESS_TOKEN` (for GitHub)

---

## 🧪 Testing Your Setup

### Test GitHub Actions
```bash
# In your GitHub Actions workflow, these should work:
npm run supa:login        # Uses SUPABASE_ACCESS_TOKEN
npm run supa:link         # Uses SUPABASE_PROJECT_REF
npm run supa:migrate:apply # Uses SUPABASE_DB_PASSWORD
```

### Test Vercel Environment Variables
```typescript
// In your Next.js code (client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// In API routes (server-side)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

---

## ⚠️ Security Best Practices

1. **Never commit secrets to git**
   - Use GitHub Secrets for CI/CD
   - Use Vercel Environment Variables for deployments
   - Add `.env` to `.gitignore`

2. **Mark sensitive variables as Sensitive in Vercel**
   - `SUPABASE_SERVICE_ROLE_KEY` → Mark as Sensitive ✅
   - `DATABASE_URL` → Mark as Sensitive ✅

3. **Use anon key for client-side**
   - RLS will protect your data
   - Only use service role key server-side

4. **Rotate keys regularly**
   - Generate new access tokens periodically
   - Rotate database passwords if compromised

5. **Different environments**
   - Use separate Supabase projects for dev/staging/prod (recommended)
   - Or use different environment variables per environment in Vercel

---

## 📚 Related Documentation

- **Complete Setup Guide**: See `VERCEL_SUPABASE_MIGRATION.md`
- **Supabase Setup**: See `supabase/SETUP.md`
- **Environment Variables**: See `.env.example`

---

## 🆘 Troubleshooting

### "Invalid API key" error
- Verify you copied the full key (no truncation)
- Check for extra spaces before/after
- Ensure you're using the correct key (anon vs service_role)

### "Project not found" error
- Verify `SUPABASE_PROJECT_REF` is correct
- Check it matches your project URL
- Ensure your access token has permissions

### RLS errors
- Client-side: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-side admin: Use `SUPABASE_SERVICE_ROLE_KEY`
- Verify RLS policies are enabled in Supabase

### Connection timeout
- Verify `DATABASE_URL` is correct
- Check firewall/network settings
- Ensure project is not paused in Supabase
