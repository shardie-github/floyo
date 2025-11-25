# Developer Onboarding Guide

**Generated:** 2025-01-20  
**Agent:** Unified Background Agent v3.0  
**Status:** Complete

## Welcome!

This guide will help you get started with the Floyo codebase. Follow these steps to set up your development environment and start contributing.

## Prerequisites

### Required Tools

- **Node.js:** v20.x (LTS)
- **Python:** 3.11+
- **Git:** Latest version
- **Supabase CLI:** For local database development
- **Vercel CLI:** For deployment (optional)

### Recommended Tools

- **VS Code:** With extensions:
  - ESLint
  - Prettier
  - TypeScript
  - Python
- **Docker:** For local Supabase (optional)

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd floyo-monorepo
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm ci

# Install frontend dependencies
cd frontend
npm ci
cd ..

# Install backend dependencies (if needed)
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Fill in values from:
# - Supabase Dashboard → Settings → API
# - Vercel Dashboard → Project → Settings → Environment Variables
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### 4. Start Local Supabase

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase migration up
```

### 5. Start Development Server

```bash
# Start frontend dev server
npm run dev

# Frontend will be available at http://localhost:3000
# Supabase will be available at http://localhost:54321
```

## Project Structure

```
floyo-monorepo/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js App Router pages and API routes
│   ├── components/   # React components
│   ├── lib/          # Utility functions and libraries
│   └── hooks/        # React hooks
├── backend/          # FastAPI backend (if separate)
│   ├── api/         # API endpoints
│   ├── services/    # Business logic
│   └── jobs/       # Background jobs
├── supabase/        # Supabase configuration
│   ├── migrations/  # Database migrations
│   └── functions/  # Edge functions
├── scripts/         # Utility scripts
└── docs/           # Documentation
```

## Development Workflow

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes:**
   - Write code
   - Add tests
   - Update documentation

3. **Test locally:**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check

# Full hygiene check
npm run hygiene
```

## Key Concepts

### Architecture

- **Frontend:** Next.js 14 with App Router
- **Backend:** FastAPI (Python) + Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)

### API Structure

- **Next.js Routes:** `frontend/app/api/*`
- **FastAPI Routes:** `backend/api/*`
- **Authentication:** JWT tokens via Supabase

### Database

- **ORM:** Prisma (TypeScript) + SQLAlchemy (Python)
- **Migrations:** Supabase migrations + Prisma migrations
- **Schema:** Defined in `prisma/schema.prisma`

## Common Tasks

### Adding a New API Endpoint

1. **Create route file:**
   ```typescript
   // frontend/app/api/your-endpoint/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   
   export async function GET(req: NextRequest) {
     // Your implementation
     return NextResponse.json({ data: 'result' })
   }
   ```

2. **Add to OpenAPI spec:**
   ```bash
   npm run openapi:generate
   ```

### Adding a Database Migration

1. **Create migration:**
   ```bash
   supabase migration new your_migration_name
   ```

2. **Write SQL:**
   ```sql
   -- supabase/migrations/YYYYMMDDHHMMSS_your_migration_name.sql
   CREATE TABLE IF NOT EXISTS your_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     -- your columns
   );
   ```

3. **Update Prisma schema:**
   ```prisma
   // prisma/schema.prisma
   model YourTable {
     id String @id @default(uuid())
     // your fields
   }
   ```

4. **Apply migration:**
   ```bash
   supabase migration up
   npm run prisma:generate
   ```

### Adding Environment Variables

1. **Add to `.env.example`:**
   ```bash
   # Your variable description
   YOUR_VARIABLE_NAME=
   ```

2. **Add to code:**
   ```typescript
   const value = process.env.YOUR_VARIABLE_NAME
   ```

3. **Validate:**
   ```bash
   npm run env:doctor
   ```

## Debugging

### Local Debugging

```bash
# Health check
curl http://localhost:3000/api/health

# Check logs
# Frontend: Check terminal output
# Backend: Check terminal output
# Database: Check Supabase logs
```

### Common Issues

See `docs/troubleshooting.md` for common issues and solutions.

## Resources

### Documentation

- **Architecture:** `docs/stack-discovery.md`
- **API:** `docs/api.md`
- **Database:** `docs/db-migrations-and-schema.md`
- **Deployment:** `docs/deploy-strategy.md`
- **Environment:** `docs/env-and-secrets.md`

### External Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

## Getting Help

1. **Check documentation:** Start with `docs/README.md`
2. **Search issues:** Check GitHub issues
3. **Ask questions:** Create GitHub discussion
4. **Contact team:** Reach out to team lead

## Next Steps

1. ✅ Set up development environment
2. ✅ Read architecture documentation
3. ✅ Explore codebase
4. ✅ Make your first contribution
5. ✅ Join team discussions

Welcome to the team! 🚀

---

**Generated by Unified Background Agent v3.0**  
**Last Updated:** 2025-01-20
