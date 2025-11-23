# Floyo Architecture Documentation

**Last Updated:** 2025-01-XX  
**Status:** ✅ Complete  
**Purpose:** Comprehensive architecture overview for developers, operators, and stakeholders

---

## Executive Summary

Floyo is a **workflow automation platform** that learns from user behavior and suggests intelligent integrations. The system is built as a **modern monorepo** with clear separation between frontend, backend, and infrastructure.

**Architecture Style:** Monolithic backend with microservice-ready boundaries  
**Deployment:** Vercel (frontend) + Supabase (database) + Python backend (API)  
**Scalability:** Horizontal scaling ready, database connection pooling, caching layer

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Floyo Platform                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐         ┌────────┐ │
│  │   Frontend    │◄───────►│   Backend    │◄───────►│Database│ │
│  │  (Next.js)    │  HTTP   │  (FastAPI)   │  SQL    │(Supabase│ │
│  │  Port: 3000  │         │  Port: 8000   │         │Postgres)│ │
│  └──────────────┘         └──────────────┘         └────────┘ │
│         │                      │                                │
│         │                      │                                │
│         ▼                      ▼                                │
│  ┌──────────────┐      ┌──────────────┐                        │
│  │ File Watcher │      │  Background  │                        │
│  │  (Local CLI) │      │    Jobs      │                        │
│  │              │      │  (Celery)    │                        │
│  └──────────────┘      └──────────────┘                        │
│         │                      │                                │
│         └──────────────────────┘                              │
│                    │                                             │
│                    ▼                                             │
│         ┌──────────────────────┐                                │
│         │ Integration Suggester │                                │
│         │   (Pattern Analysis)  │                                │
│         └──────────────────────┘                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend (Next.js 14+)

**Technology Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand + React Context
- **API Client:** Custom fetch wrapper with retry logic
- **Authentication:** Supabase Auth (JWT)

**Key Features:**
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes for server-side logic
- Middleware for authentication/routing
- Service worker for offline support

**Directory Structure:**
```
frontend/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (server-side)
│   ├── dashboard/    # Dashboard pages
│   └── ...
├── components/       # React components
├── lib/              # Utilities and helpers
│   ├── api/          # API client
│   ├── auth/         # Authentication utilities
│   └── ...
├── hooks/            # React hooks
└── public/           # Static assets
```

**Design Principles:**
- **Component-driven:** Reusable, composable components
- **Type-safe:** Full TypeScript coverage
- **Performance:** Code splitting, lazy loading, image optimization
- **Accessibility:** WCAG 2.1 AA compliance

---

### 2. Backend (FastAPI)

**Technology Stack:**
- **Framework:** FastAPI (Python 3.9+)
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL (via Supabase)
- **Cache:** Redis (optional, falls back to memory)
- **Background Jobs:** Celery
- **Authentication:** JWT (Supabase)

**Key Features:**
- RESTful API with OpenAPI documentation
- Database connection pooling
- Circuit breaker pattern for resilience
- Structured logging (JSON)
- Rate limiting
- Input validation (Pydantic)

**Directory Structure:**
```
backend/
├── api/              # API route handlers
│   ├── v1/           # Versioned endpoints
│   └── ...
├── services/         # Business logic layer
├── models/           # Database models
├── jobs/              # Background jobs (Celery)
├── middleware/        # Custom middleware
├── auth/              # Authentication utilities
└── ...
```

**Design Principles:**
- **Service Layer:** Business logic separated from API handlers
- **Dependency Injection:** FastAPI's dependency system
- **Error Handling:** Consistent error responses
- **Observability:** Structured logging, metrics, health checks

---

### 3. Database (Supabase/PostgreSQL)

**Schema Design:**
- **Users:** Authentication and user profiles
- **Events:** File usage events and telemetry
- **Patterns:** Detected usage patterns
- **Workflows:** User-defined automation workflows
- **Integrations:** Integration configurations

**Key Features:**
- Row Level Security (RLS) enabled
- Automatic backups
- Connection pooling
- Real-time subscriptions (Supabase)

**Migration Strategy:**
- Alembic for schema migrations
- Version-controlled migration files
- Rollback support

---

### 4. Infrastructure

**Deployment:**
- **Frontend:** Vercel (edge network)
- **Backend:** Self-hosted or cloud (Docker-ready)
- **Database:** Supabase (managed PostgreSQL)
- **Cache:** Redis (optional)
- **CDN:** Vercel Edge Network

**CI/CD:**
- GitHub Actions for testing and deployment
- Automated migrations
- Environment-specific configurations

---

## Data Flow

### Event Tracking Flow

```
1. User Action (file open/edit/run)
   ↓
2. File Watcher (CLI tool)
   ↓
3. Event Ingestion API (/api/v1/telemetry)
   ↓
4. Event Storage (PostgreSQL)
   ↓
5. Pattern Detection Job (Celery, every 30min)
   ↓
6. Pattern Analysis & Storage
   ↓
7. Integration Suggestions Generated
   ↓
8. User Dashboard Display
```

### Authentication Flow

```
1. User Login Request
   ↓
2. Supabase Auth (email/password or OAuth)
   ↓
3. JWT Token Issued
   ↓
4. Token Stored (httpOnly cookie or localStorage)
   ↓
5. API Requests Include Token
   ↓
6. Backend Validates Token
   ↓
7. User Context Available in Request
```

---

## Security Architecture

### Authentication & Authorization
- **JWT-based authentication** via Supabase
- **Row Level Security (RLS)** on all database tables
- **API route protection** via middleware
- **Role-based access control (RBAC)** for admin features

### Data Protection
- **Encryption at rest:** Database encryption (Supabase)
- **Encryption in transit:** HTTPS/TLS everywhere
- **PII sanitization:** Logs sanitized before storage
- **Input validation:** All inputs validated (Pydantic/Zod)

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options
- Referrer-Policy

---

## Performance Architecture

### Caching Strategy
- **Redis cache** for frequently accessed data
- **In-memory fallback** if Redis unavailable
- **Cache invalidation** on data updates
- **TTL-based expiration**

### Database Optimization
- **Connection pooling** (10-30 connections)
- **Query optimization** (indexes, query limits)
- **N+1 query prevention** (eager loading)
- **Read replicas** (future: for read-heavy workloads)

### Frontend Optimization
- **Code splitting** (route-based)
- **Image optimization** (Next.js Image component)
- **Static generation** where possible
- **Service worker** for offline support

---

## Scalability Considerations

### Horizontal Scaling
- **Stateless API:** Backend can scale horizontally
- **Database pooling:** Handles connection limits
- **CDN:** Static assets served from edge

### Vertical Scaling
- **Connection pool sizing:** Configurable pool size
- **Worker processes:** Celery workers scale independently
- **Cache sizing:** Redis memory limits

### Future Scaling
- **Read replicas:** For database read scaling
- **Microservices:** Extract services as needed
- **Message queue:** For async processing
- **Event sourcing:** For audit trail

---

## Error Handling & Resilience

### Error Handling Strategy
- **Structured errors:** Consistent error format
- **Error boundaries:** React error boundaries
- **Circuit breakers:** For external service calls
- **Retry logic:** Exponential backoff

### Resilience Patterns
- **Graceful degradation:** Fallback to cached data
- **Health checks:** Liveness and readiness probes
- **Graceful shutdown:** Clean connection closure
- **Rate limiting:** Prevent abuse

---

## Monitoring & Observability

### Logging
- **Structured logging:** JSON format
- **Log levels:** DEBUG, INFO, WARNING, ERROR
- **Correlation IDs:** Request tracing
- **PII sanitization:** Before logging

### Metrics
- **Health endpoints:** `/health`, `/health/readiness`
- **Performance metrics:** Response times, throughput
- **Business metrics:** User actions, patterns detected

### Error Tracking
- **Sentry integration:** Error aggregation
- **Error boundaries:** Frontend error catching
- **Alerting:** Critical error notifications

---

## Development Workflow

### Local Development
1. **Clone repository**
2. **Run onboarding script:** `./scripts/onboard.sh`
3. **Configure environment:** Edit `.env.local`
4. **Start services:**
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && python -m uvicorn main:app --reload`

### Testing
- **Unit tests:** Jest (frontend), pytest (backend)
- **Integration tests:** API endpoint testing
- **E2E tests:** Playwright
- **CI/CD:** Automated test runs on PR

### Deployment
- **Frontend:** Automatic via Vercel (on push to main)
- **Backend:** Manual or CI/CD pipeline
- **Database:** Migrations via Alembic
- **Rollback:** Version-controlled migrations

---

## Architecture Decisions

### Why Monolithic Backend?
- **Simplicity:** Easier to develop and deploy
- **Performance:** No network overhead between services
- **Future-ready:** Can extract microservices when needed

### Why Next.js?
- **Full-stack:** API routes + frontend in one framework
- **Performance:** SSR, SSG, edge functions
- **Developer Experience:** Great TypeScript support

### Why Supabase?
- **Managed:** No database administration
- **Features:** Auth, RLS, real-time built-in
- **PostgreSQL:** Powerful, reliable database

---

## Future Architecture Considerations

### Potential Microservices
- **Pattern Detection Service:** Heavy ML workloads
- **Integration Execution Service:** Workflow runtime
- **Notification Service:** Email/push notifications

### Potential Enhancements
- **Event sourcing:** Complete audit trail
- **CQRS:** Separate read/write models
- **GraphQL API:** Alternative to REST
- **WebSocket support:** Real-time updates

---

## Glossary

- **RLS:** Row Level Security - Database-level access control
- **JWT:** JSON Web Token - Authentication token format
- **SSR:** Server-Side Rendering
- **SSG:** Static Site Generation
- **CDN:** Content Delivery Network
- **TTL:** Time To Live - Cache expiration time

---

**Generated by:** Post-Sprint Elevation Agent  
**Status:** ✅ Architecture Documentation Complete
