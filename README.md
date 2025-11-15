# Floyo - Autonomous Full-Stack Application

**File usage pattern tracking and integration suggestions**

[![Deployment Status](https://img.shields.io/badge/deployment-vercel-blue)](https://vercel.com)
[![Database](https://img.shields.io/badge/database-supabase-green)](https://supabase.com)
[![Framework](https://img.shields.io/badge/framework-nextjs-black)](https://nextjs.org)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for backend)
- PostgreSQL (via Supabase)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd floyo-monorepo
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in values from Supabase Dashboard
   ```

3. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

4. **Set up database**
   ```bash
   # Link Supabase project
   supabase link --project-ref <your-project-ref>
   
   # Run migrations
   supabase db push
   
   # Generate Prisma client
   npm run prisma:generate
   ```

5. **Start development servers**
   ```bash
   # Frontend (Next.js)
   cd frontend && npm run dev
   
   # Backend (Python)
   cd backend && python -m uvicorn main:app --reload
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## 📚 Documentation

- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Complete environment variables reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design
- **[API.md](./API.md)** - API endpoint documentation
- **[WORKFLOW.md](./WORKFLOW.md)** - Development workflow and guidelines

### Health Reports

- **[Schema Health Report](./reports/SCHEMA_HEALTH_REPORT.md)** - Database schema analysis
- **[Deployment Health Report](./reports/DEPLOYMENT_HEALTH_REPORT.md)** - Vercel deployment analysis
- **[Repo Integrity Report](./reports/REPO_INTEGRITY_REPORT.md)** - Code organization analysis
- **[Mesh Health Report](./reports/MESH_HEALTH_REPORT.md)** - Integration mesh analysis

---

## 🏗️ Architecture

### Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Python (FastAPI/Flask), SQLAlchemy
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel (frontend), Supabase (database)
- **CI/CD:** GitHub Actions

### Key Features

- ✅ File usage pattern tracking
- ✅ AI-powered integration suggestions
- ✅ Privacy-first monitoring
- ✅ Workflow automation
- ✅ Multi-agent orchestration
- ✅ Real-time analytics

---

## 🛠️ Development

### Available Scripts

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Testing
npm run test

# Build
npm run build

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for unit testing
- **Playwright** for E2E testing

---

## 🔐 Security

### Environment Variables

Never commit secrets to git. Use:
- `.env.local` for local development
- Vercel Environment Variables for production
- GitHub Secrets for CI/CD

See [ENVIRONMENT.md](./ENVIRONMENT.md) for complete variable reference.

### Security Best Practices

- ✅ All API routes authenticated
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Input validation on all endpoints
- ✅ Rate limiting configured
- ✅ CORS properly configured
- ✅ Security headers enabled

---

## 🚢 Deployment

### Vercel Deployment

1. **Connect repository to Vercel**
   - Go to Vercel Dashboard
   - Import repository
   - Configure build settings (already in `vercel.json`)

2. **Set environment variables**
   - Add all required variables from [ENVIRONMENT.md](./ENVIRONMENT.md)
   - Set different values for Production/Preview/Development

3. **Deploy**
   - Push to `main` branch for production
   - Create pull request for preview deployment

### Database Migrations

Migrations are managed via Supabase:

```bash
# Create new migration
supabase migration new <migration-name>

# Apply migrations
supabase db push

# Check migration status
supabase db remote commit --dry-run
```

---

## 🤖 Autonomous Systems

This repository includes autonomous orchestration systems:

- **Aurora Prime** - Full-stack orchestrator (see [AURORA_PRIME_README.md](./AURORA_PRIME_README.md))
- **Master Omega Prime** - Multi-system orchestrator (see [MASTER_OMEGA_PRIME_README.md](./MASTER_OMEGA_PRIME_README.md))
- **Autonomous Full-Stack Guardian** - Continuous health monitoring

These systems automatically:
- ✅ Detect and fix environment variable drift
- ✅ Validate schema alignment
- ✅ Monitor deployment health
- ✅ Maintain code integrity
- ✅ Orchestrate AI agent mesh

---

## 📊 Monitoring

### Health Checks

- `/api/health` - Application health
- `/api/monitoring/health` - Detailed health check
- `/api/metrics` - Application metrics

### Observability

- **Sentry** - Error tracking (if configured)
- **PostHog** - Analytics (if configured)
- **Vercel Analytics** - Performance monitoring

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Create a pull request
5. Ensure CI/CD passes

See [WORKFLOW.md](./WORKFLOW.md) for detailed workflow guidelines.

---

## 📝 License

See [LICENSE](./LICENSE) file for details.

---

## 🆘 Support

- **Documentation:** See `/docs` directory
- **Issues:** Create an issue on GitHub
- **Health Reports:** See `/reports` directory

---

## 🔄 Status

**Last Updated:** Auto-maintained by Autonomous Full-Stack Guardian

This repository is continuously monitored and maintained by autonomous systems to ensure:
- ✅ Environment variable alignment
- ✅ Schema accuracy
- ✅ Deployment success
- ✅ Code integrity
- ✅ Integration health

See health reports in `/reports` for current status.
