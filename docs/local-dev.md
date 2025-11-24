# Local Development Guide

**Last Updated:** 2025-01-XX  
**Purpose:** Complete guide for setting up and running Floyo locally

---

## Prerequisites

### Required Software

- **Node.js:** 20.x (use `nvm` or download from [nodejs.org](https://nodejs.org))
- **npm:** Comes with Node.js (verify with `npm --version`)
- **Python:** 3.11+ (for backend, if using FastAPI)
- **Git:** Latest version
- **Supabase Account:** Free account at [supabase.com](https://supabase.com)

### Optional Software

- **Supabase CLI:** For local Supabase development (optional)
- **Docker:** For local PostgreSQL (if not using Supabase)
- **VS Code:** Recommended IDE with extensions (ESLint, Prettier, Python)

---

## 1. Initial Setup

### Clone Repository

```bash
git clone <repository-url>
cd floyo-monorepo
```

### Install Dependencies

```bash
# Install root dependencies
npm ci

# Install frontend dependencies
cd frontend
npm ci
cd ..

# Install backend dependencies (if using FastAPI)
cd backend
pip install -r requirements.txt
cd ..
```

### Verify Installation

```bash
# Check Node version (should be 20.x)
node --version

# Check npm version
npm --version

# Check Python version (should be 3.11+)
python --version
```

---

## 2. Environment Variables Setup

### Create `.env.local` File

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
# Use your preferred editor (VS Code, nano, vim, etc.)
```

### Required Variables

**Minimum required for local development:**

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Public (Client-side)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Application
NODE_ENV=development
ENVIRONMENT=development
```

### Get Supabase Credentials

1. **Go to Supabase Dashboard:** [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project** (or create a new one)
3. **Settings → API:**
   - Copy **Project URL** → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon/public key** → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. **Settings → Database:**
   - Copy **Connection string** → `DATABASE_URL`

### Optional Variables

See `.env.example` for complete list of optional variables (Sentry, PostHog, Stripe, etc.).

---

## 3. Database Setup

### Apply Migrations

**Option 1: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [YOUR_PROJECT_REF]

# Apply migrations
supabase migration up
```

**Option 2: Using Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/99999999999999_master_consolidated_schema.sql`
3. Paste and run in SQL Editor

### Generate Prisma Client (If Using Prisma Types)

```bash
npm run prisma:generate
```

**Note:** Prisma is secondary to Supabase migrations. Use Supabase migrations as canonical.

### Verify Database Connection

```bash
# Test connection (if script exists)
npm run db:test

# Or manually test via Supabase Dashboard → Table Editor
```

---

## 4. Running Development Servers

### Frontend (Next.js)

```bash
# From root directory
cd frontend
npm run dev

# Or from root (if script configured)
npm run dev
```

**Frontend will be available at:** http://localhost:3000

### Backend (FastAPI) - Optional

**Note:** Most API routes are in Next.js API routes. FastAPI backend may not be needed.

```bash
# From backend directory
cd backend
python -m uvicorn main:app --reload

# Or if main file is different
python -m uvicorn api.main:app --reload --port 8000
```

**Backend will be available at:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

### Running Both

**Terminal 1 (Frontend):**
```bash
cd frontend
npm run dev
```

**Terminal 2 (Backend - if needed):**
```bash
cd backend
python -m uvicorn main:app --reload
```

---

## 5. Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Frontend: Edit files in `frontend/`
   - Backend: Edit files in `backend/`
   - Database: Create new migration in `supabase/migrations/`

3. **Run tests locally:**
   ```bash
   # Frontend tests
   cd frontend
   npm test

   # Backend tests
   cd backend
   pytest tests/unit/ -v

   # Type checking
   npm run typecheck
   ```

4. **Lint and format:**
   ```bash
   # Lint
   npm run lint

   # Format (auto-fix)
   npm run format
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request:**
   - PR will trigger CI/CD workflows
   - Preview deployment will be created automatically
   - Review preview URL in PR comments

---

## 6. Common Development Tasks

### Running Tests

```bash
# Frontend unit tests
cd frontend
npm test

# Frontend E2E tests
npm run test:e2e

# Backend tests
cd backend
pytest tests/unit/ -v

# All tests (from root)
npm run test
```

### Type Checking

```bash
# Frontend TypeScript
cd frontend
npm run typecheck

# Backend Python (mypy)
cd backend
mypy backend/

# Both (from root)
npm run type-check
```

### Linting

```bash
# Frontend ESLint
cd frontend
npm run lint

# Backend Python (ruff, black)
cd backend
ruff check .
black --check .

# Both (from root)
npm run lint
```

### Building

```bash
# Frontend build
cd frontend
npm run build

# Test production build locally
npm run start
```

### Database Operations

```bash
# Create new migration
supabase migration new <descriptive_name>

# Apply migrations
supabase migration up

# Check migration status
supabase db remote commit --dry-run

# Open Prisma Studio (if using Prisma)
npm run prisma:studio
```

---

## 7. Troubleshooting

### Common Issues

#### Issue: `npm ci` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lockfile
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: Database connection fails

**Solution:**
1. Verify `DATABASE_URL` is correct in `.env.local`
2. Check Supabase Dashboard → Settings → Database → Connection string
3. Verify database is running (Supabase Dashboard → Database → Status)
4. Check firewall/network settings

#### Issue: Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process (replace PID with actual process ID)
kill -9 [PID]

# Or use different port
cd frontend
PORT=3001 npm run dev
```

#### Issue: TypeScript errors

**Solution:**
```bash
# Clear TypeScript cache
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache

# Regenerate types
npm run prisma:generate  # If using Prisma
npm run typecheck
```

#### Issue: Supabase migrations fail

**Solution:**
1. Verify `SUPABASE_ACCESS_TOKEN` is set (if using CLI)
2. Verify `SUPABASE_PROJECT_REF` is correct
3. Check Supabase Dashboard → Database → Migrations for errors
4. Try applying migrations via Supabase Dashboard SQL Editor

---

## 8. Development Tools

### VS Code Extensions (Recommended)

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Python** - Python language support
- **Prisma** - Prisma schema support
- **GitLens** - Git integration
- **Thunder Client** - API testing (alternative to Postman)

### Browser Extensions

- **React Developer Tools** - React debugging
- **Redux DevTools** - State management debugging (if using Redux)

### API Testing

**Option 1: Thunder Client (VS Code)**
- Install Thunder Client extension
- Create requests in VS Code

**Option 2: Postman**
- Import API collection (if available)
- Test API endpoints

**Option 3: curl**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test with authentication
curl -H "Authorization: Bearer [TOKEN]" http://localhost:3000/api/insights
```

---

## 9. Project Structure

```
floyo-monorepo/
├── frontend/              # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   └── public/           # Static assets
│
├── backend/              # Python FastAPI backend (optional)
│   ├── api/              # API route handlers
│   ├── services/         # Business logic
│   └── jobs/             # Background jobs
│
├── supabase/             # Database migrations and functions
│   ├── migrations/       # SQL migration files
│   └── functions/        # Edge functions
│
├── prisma/               # Prisma schema (secondary to Supabase)
│   └── schema.prisma     # Database schema
│
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── .env.local            # Local environment variables (gitignored)
```

---

## 10. Next Steps

### After Setup

1. ✅ Verify frontend runs at http://localhost:3000
2. ✅ Verify database connection works
3. ✅ Run tests to ensure everything works
4. ✅ Create a test user via signup flow
5. ✅ Explore the dashboard and features

### Learning Resources

- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **TypeScript:** [typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **React:** [react.dev](https://react.dev)

### Getting Help

- **Documentation:** See `/docs` directory
- **Issues:** Create GitHub issue
- **Discussions:** GitHub Discussions (if enabled)

---

## 11. CI-First Development

### No Local CLI Required

**Key Point:** You don't need to install Vercel CLI or Supabase CLI locally for deployments!

**Deployments:**
- ✅ Handled by GitHub Actions (`frontend-deploy.yml`)
- ✅ Preview deployments on PRs
- ✅ Production deployments on `main` merge

**Migrations:**
- ✅ Handled by GitHub Actions (`supabase-migrate.yml`)
- ✅ Runs automatically on `main` push

**Local Development:**
- ✅ Use Supabase CLI only for local testing (optional)
- ✅ Use Vercel CLI only for local testing (optional)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Local Development Guide Complete
