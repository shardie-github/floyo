# Developer Onboarding Guide

**Purpose:** Get developers productive in under 30 minutes

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Node.js 20.x
- Python 3.11+
- Git
- Supabase account (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url>
cd floyo-monorepo
npm install
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Get Supabase credentials from dashboard
# Fill in .env.local with:
# - DATABASE_URL
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### 3. Database Setup

```bash
# Link to Supabase project
npx supabase link --project-ref <your-project-ref>

# Apply migrations
npx supabase migration up

# Generate Prisma client
npm run prisma:generate
```

### 4. Start Development

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend (if needed)
cd backend
uvicorn main:app --reload

# Terminal 3: Database (optional, for local dev)
npx supabase start
```

**✅ You're ready!** Visit `http://localhost:3000`

---

## 📚 Core Concepts

### Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Next.js    │────▶│   Supabase  │
│  (Next.js)  │     │  API Routes  │     │  PostgreSQL │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   FastAPI    │
                    │   Backend    │
                    └──────────────┘
```

### Key Technologies

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** FastAPI, Python, SQLAlchemy
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (frontend), Supabase (database)

### Data Flow

1. **User Action** → Frontend component
2. **API Call** → Next.js API route or FastAPI endpoint
3. **Database** → Supabase PostgreSQL via Prisma
4. **Response** → Frontend updates UI

---

## 🛠️ Development Workflow

### Making Changes

1. **Create Feature Branch**
```bash
git checkout -b feature/my-feature
```

2. **Make Changes**
- Frontend: `frontend/app/` or `frontend/components/`
- Backend: `backend/api/` or `backend/services/`
- Database: `supabase/migrations/`

3. **Test Locally**
```bash
npm run lint
npm run type-check
npm test
```

4. **Commit & Push**
```bash
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

5. **Create PR**
- PR automatically triggers CI/CD
- Preview deployment created
- Review and merge

### Database Changes

**Adding a New Table:**

1. **Update Prisma Schema**
```prisma
// prisma/schema.prisma
model MyTable {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

2. **Create Migration**
```bash
# Supabase migration
supabase migration new add_my_table

# Edit: supabase/migrations/TIMESTAMP_add_my_table.sql
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **Apply Migration**
```bash
supabase migration up
npm run prisma:generate
```

### API Changes

**Adding a New Endpoint:**

1. **Frontend API Route**
```typescript
// frontend/app/api/my-endpoint/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello' });
}
```

2. **Backend API Route**
```python
# backend/api/my_endpoint.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/my-endpoint", tags=["my"])

@router.get("")
async def my_endpoint():
    return {"message": "Hello"}
```

---

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest tests/unit/ -v

# E2E tests
npm run test:e2e
```

### Writing Tests

**Frontend Test Example:**
```typescript
// frontend/tests/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import Button from '@/components/Button';

test('renders button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

**Backend Test Example:**
```python
# backend/tests/unit/test_my_endpoint.py
import pytest
from backend.api.my_endpoint import my_endpoint

def test_my_endpoint():
    result = await my_endpoint()
    assert result["message"] == "Hello"
```

---

## 📖 Common Tasks

### Adding a New Page

1. **Create Page File**
```typescript
// frontend/app/my-page/page.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

2. **Add Navigation** (if needed)
```typescript
// frontend/components/Navigation.tsx
<Link href="/my-page">My Page</Link>
```

### Adding Authentication

```typescript
// frontend/app/api/protected/route.ts
import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({ user });
}
```

### Environment Variables

**Adding a New Variable:**

1. **Add to `.env.example`**
```bash
MY_NEW_VAR=value
```

2. **Use in Code**
```typescript
const value = process.env.MY_NEW_VAR;
```

3. **Validate** (if public)
```typescript
// frontend/lib/env.ts
NEXT_PUBLIC_MY_NEW_VAR: z.string().optional(),
```

---

## 🐛 Debugging

### Frontend Debugging

**Browser DevTools:**
- React DevTools extension
- Network tab for API calls
- Console for errors

**VS Code Debugging:**
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Next.js Debug",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"]
}
```

### Backend Debugging

**Logging:**
```python
from backend.logging_config import get_logger

logger = get_logger(__name__)
logger.info("Debug message")
logger.error("Error message", exc_info=True)
```

**VS Code Debugging:**
```json
// .vscode/launch.json
{
  "type": "python",
  "request": "launch",
  "program": "${workspaceFolder}/backend/main.py",
  "console": "integratedTerminal"
}
```

### Database Debugging

**Prisma Studio:**
```bash
npm run prisma:studio
```

**Supabase Dashboard:**
- Go to Supabase Dashboard
- SQL Editor for queries
- Table Editor for data

---

## 📚 Resources

### Documentation

- [Stack Discovery](./stack-discovery.md) - Architecture overview
- [API Documentation](./api.md) - API endpoints
- [Database Migrations](./db-migrations-and-schema.md) - Migration guide
- [Environment Variables](./env-and-secrets.md) - Configuration

### External Resources

- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)

### Getting Help

- **Slack:** #floyo-dev
- **GitHub Issues:** Create issue for bugs
- **Discussions:** For questions
- **Code Review:** Tag team for review

---

## ✅ Onboarding Checklist

- [ ] Environment set up
- [ ] Database migrations applied
- [ ] Can run frontend locally
- [ ] Can run backend locally (if needed)
- [ ] Can create a new page
- [ ] Can create a new API endpoint
- [ ] Can write a test
- [ ] Can create a database migration
- [ ] Understands code structure
- [ ] Knows where to get help

---

**Welcome to Floyo! 🚀**
