# Local Setup - Quick Start

**Purpose:** Get Floyo running locally in 5 minutes.

---

## Prerequisites

- Node.js 20.x (`node --version`)
- npm (`npm --version`)
- Python 3.11+ (`python --version`)
- Supabase account (free at [supabase.com](https://supabase.com))

---

## Setup Steps

### 1. Clone & Install

```bash
git clone <repo-url>
cd floyo-monorepo
npm ci
cd frontend && npm ci && cd ..
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

**Required values** (get from Supabase Dashboard → Settings → API):
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (from Settings → Database → Connection string)

### 3. Database Setup

**Option A: Supabase Dashboard (Easiest)**
1. Go to Supabase Dashboard → SQL Editor
2. Run migrations from `supabase/migrations/` (check latest file)

**Option B: Supabase CLI**
```bash
npm install -g supabase
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Start Dev Server

```bash
cd frontend
npm run dev
```

**Frontend:** http://localhost:3000

---

## Common Commands

```bash
# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Build
cd frontend && npm run build
```

---

## Troubleshooting

**Port 3000 in use?**
```bash
PORT=3001 npm run dev
```

**Database connection fails?**
- Verify `.env.local` has correct Supabase credentials
- Check Supabase Dashboard → Database → Status

**TypeScript errors?**
```bash
rm -rf frontend/.next
npm run prisma:generate
npm run type-check
```

---

## Next Steps

- See [docs/local-dev.md](./local-dev.md) for detailed guide
- See [README.md](../README.md) for full documentation

---

**Status:** ✅ Ready for local development
