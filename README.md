# Floyo

**Discover hidden connections in your workflow. Automate what you didn't know could be automated.**

[![Deployment Status](https://img.shields.io/badge/deployment-vercel-blue)](https://vercel.com)
[![Database](https://img.shields.io/badge/database-supabase-green)](https://supabase.com)
[![Framework](https://img.shields.io/badge/framework-nextjs-black)](https://nextjs.org)

---

## What is Floyo?

Floyo watches how you work—the files you open, the scripts you run, the tools you use—and finds patterns you didn't notice. Then it suggests concrete, actionable integrations that can automate the repetitive parts of your workflow.

Think of it as a personal assistant that learns your habits and proposes smart connections between the tools you already use.

### The Problem

You're juggling multiple tools, scripts, and files every day. You know there's probably a way to automate some of it, but:

- You don't have time to research every possible integration
- You're not sure which automations would actually help
- You don't want to set up complex workflows that break
- You want suggestions based on *your actual work*, not generic examples

### The Solution

Floyo runs quietly in the background, learning your patterns. When it spots an opportunity—like "you always run this Python script and then manually upload the output to Dropbox"—it suggests a simple integration with actual code you can use.

**No guessing. No generic advice. Just real suggestions based on what you actually do.**

---

## Key Features

### 🎯 Pattern Recognition
Floyo tracks file usage, script executions, and tool interactions to identify your unique workflow patterns.

### 💡 Intelligent Suggestions
Get concrete integration suggestions with sample code tailored to your actual files and workflows.

### 🔒 Privacy-First
All tracking happens locally. Your data stays on your machine unless you choose to sync it.

### ⚡ Real-Time Monitoring
Watch your file system in real-time and get instant insights into how you work.

### 🔗 Relationship Mapping
See how files, scripts, and tools connect in your workflow—discover dependencies you didn't know existed.

### 📊 Usage Analytics
Understand your work patterns with temporal analysis and usage statistics.

---

## Real-World Use Cases

### The Data Analyst
Sarah runs Python scripts to process CSV files, then manually emails the results. Floyo detects this pattern and suggests automating the email step with a simple integration.

**Outcome:** Sarah saves 30 minutes per day and never forgets to send reports.

### The Developer
Mike frequently edits TypeScript files, runs tests, and then checks deployment logs. Floyo suggests connecting these steps into an automated workflow.

**Outcome:** Mike catches deployment issues faster and reduces context switching.

### The Content Creator
Emma writes markdown files, converts them to PDFs, and uploads to a cloud service. Floyo spots this pattern and suggests a one-click automation.

**Outcome:** Emma publishes content 3x faster with zero manual steps.

### The Researcher
David analyzes data files, generates visualizations, and shares them via Slack. Floyo proposes connecting these tools automatically.

**Outcome:** David's team gets insights faster, and he focuses on analysis instead of file management.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Floyo System                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Frontend   │◄─────►│   Backend    │◄─────►│ Database │ │
│  │  (Next.js)   │      │  (FastAPI)   │      │(Supabase) │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                     │                            │
│         │                     │                            │
│         ▼                     ▼                            │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │ File Watcher │      │  Pattern     │                  │
│  │  (Local)     │      │  Analyzer    │                  │
│  └──────────────┘      └──────────────┘                  │
│         │                     │                            │
│         └─────────────────────┘                            │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                          │
│         │ Integration Suggester │                          │
│         └──────────────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Python (FastAPI), SQLAlchemy
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel (frontend), Supabase (database)
- **CI/CD:** GitHub Actions

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for backend)
- PostgreSQL (via Supabase)
- Vercel account (for deployment)

### Installation

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
   cd ../backend && pip install -r requirements.txt
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
   # Frontend (Next.js) - Terminal 1
   cd frontend && npm run dev
   
   # Backend (Python) - Terminal 2
   cd backend && python -m uvicorn main:app --reload
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## Project Structure

```
floyo-monorepo/
├── frontend/              # Next.js frontend application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   └── public/           # Static assets
│
├── backend/              # Python FastAPI backend
│   ├── api/              # API route handlers
│   ├── services/         # Business logic
│   ├── models/           # Database models
│   └── jobs/             # Background jobs
│
├── floyo/                # Core tracking library (CLI tool)
│   ├── tracker.py        # Usage pattern tracking
│   ├── suggester.py      # Integration suggestions
│   ├── watcher.py        # File system monitoring
│   └── cli.py            # Command-line interface
│
├── supabase/             # Database migrations and functions
│   ├── migrations/       # SQL migration files
│   └── functions/        # Edge functions
│
├── tests/                # Test suite
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
│
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── infra/                # Infrastructure as code
```

---

## Screenshots & Demos

> **Coming Soon:** Screenshots of the dashboard, suggestion interface, and workflow visualization.

**Want to see Floyo in action?** Check out our [demo video](#) (coming soon) or [try it yourself](#quick-start).

---

## Development

### Available Scripts

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Testing
npm run test              # Run all tests
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run end-to-end tests

# Build
npm run build

# Database
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open Prisma Studio
```

### Running Tests Locally

```bash
# Python tests
cd backend
pytest tests/unit/ -v

# TypeScript tests
cd frontend
npm test

# End-to-end tests
npm run test:e2e
```

See [CI Configuration](.github/workflows/ci.yml) for the full test suite that runs on every commit.

---

## Documentation

- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Complete environment variables reference
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture and design
- **[API.md](./docs/API.md)** - API endpoint documentation
- **[WORKFLOW.md](./docs/WORKFLOW.md)** - Development workflow and guidelines
- **[VALUE_PROPOSITION.md](./VALUE_PROPOSITION.md)** - Why Floyo exists
- **[USE_CASES.md](./USE_CASES.md)** - Detailed use cases and examples

### Health Reports

- **[Schema Health Report](./reports/SCHEMA_HEALTH_REPORT.md)** - Database schema analysis
- **[Deployment Health Report](./reports/DEPLOYMENT_HEALTH_REPORT.md)** - Vercel deployment analysis
- **[Repo Integrity Report](./reports/REPO_INTEGRITY_REPORT.md)** - Code organization analysis

---

## Security

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

## Deployment

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

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run test
   npm run lint
   npm run format
   ```
5. **Create a pull request**
6. **Ensure CI/CD passes**

See [WORKFLOW.md](./docs/WORKFLOW.md) for detailed workflow guidelines.

---

## License

See [LICENSE](./LICENSE) file for details.

---

## Support

- **Documentation:** See `/docs` directory
- **Issues:** Create an issue on [GitHub Issues](#)
- **Health Reports:** See `/reports` directory
- **Questions?** Open a discussion on [GitHub Discussions](#)

---

## Status

**Last Updated:** Auto-maintained by Autonomous Full-Stack Guardian

This repository is continuously monitored and maintained by autonomous systems to ensure:
- ✅ Environment variable alignment
- ✅ Schema accuracy
- ✅ Deployment success
- ✅ Code integrity
- ✅ Integration health

See health reports in `/reports` for current status.

---

## Star This Repo ⭐

If Floyo helps you discover and automate your workflow patterns, please consider giving us a star! It helps others discover the project and motivates us to keep improving.

---

**Built with ❤️ for developers who want to work smarter, not harder.**
