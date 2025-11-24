# Architecture Documentation

## System Overview

Floyo is a full-stack application for tracking file usage patterns and suggesting API integrations.

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │  Next.js 14+ (React, TypeScript)
│  (Vercel)   │  Zustand (State), React Query (Data)
└──────┬──────┘
       │ HTTPS
       │
┌──────▼──────┐
│   Backend   │  FastAPI (Python)
│  (Supabase) │  SQLAlchemy, Celery, Redis
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │  PostgreSQL (Supabase)
│             │  Prisma ORM
└─────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **UI Components**: Radix UI, Custom components
- **Testing**: Jest, Playwright
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.12+
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL (via Supabase)
- **Cache**: Redis
- **Background Jobs**: Celery
- **Authentication**: JWT
- **API Versioning**: Custom middleware

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis
- **File Storage**: S3 (via Supabase Storage)
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry
- **Analytics**: PostHog, Vercel Analytics

## Directory Structure

```
/
├── frontend/          # Next.js frontend
│   ├── app/          # App router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilities and stores
│   └── e2e/          # E2E tests
├── backend/          # FastAPI backend
│   ├── api/          # API routes
│   ├── services/     # Business logic
│   ├── middleware/   # Middleware
│   ├── ml/           # ML models
│   └── integrations/ # Integration handlers
├── database/         # Database models
├── supabase/         # Supabase migrations
├── tests/            # Backend tests
└── docs/             # Documentation
```

## Data Flow

### Event Tracking Flow

1. User performs file operation
2. Frontend sends event to `/api/events`
3. Backend validates and stores event
4. Background job analyzes patterns
5. Suggestions generated based on patterns
6. Frontend displays suggestions

### Workflow Execution Flow

1. User creates workflow via UI
2. Workflow stored in database
3. Trigger event occurs
4. Workflow execution engine processes workflow
5. Steps executed in order
6. Results stored and notifications sent

## Security

### Authentication
- JWT-based authentication
- Token refresh mechanism
- Email verification
- 2FA support

### Authorization
- Role-based access control (RBAC)
- Organization-level permissions
- Resource-level access checks

### Security Headers
- CSP (Content Security Policy)
- HSTS
- X-Frame-Options
- X-Content-Type-Options
- CSRF protection

### Data Protection
- Encryption at rest (database)
- Encryption in transit (HTTPS)
- PII anonymization
- Audit logging

## Performance

### Caching Strategy
- Redis for API responses
- In-memory fallback
- Cache invalidation patterns
- TTL-based expiration

### Database Optimization
- Indexes on frequently queried fields
- Composite indexes for common queries
- Query optimization
- Connection pooling

### Frontend Optimization
- Code splitting
- Image optimization
- React.memo for components
- Lazy loading
- Bundle size optimization

## Scalability

### Horizontal Scaling
- Stateless API design
- Load balancer ready
- Database connection pooling
- Redis for shared state

### Vertical Scaling
- Efficient database queries
- Caching layer
- Background job processing
- CDN for static assets

## Monitoring & Observability

### Error Tracking
- Sentry integration
- Error boundaries
- Logging infrastructure

### Performance Monitoring
- Web Vitals tracking
- API response times
- Database query performance
- Cache hit rates

### Analytics
- User behavior tracking
- Conversion funnels
- Feature usage
- Performance metrics

## Deployment

### Environments
- **Development**: Local development
- **Staging**: Preview deployments (Vercel)
- **Production**: Main deployment

### CI/CD
- GitHub Actions
- Automated testing
- Deployment pipelines
- Rollback procedures

## Disaster Recovery

### Backup Strategy
- Daily database backups
- Point-in-time recovery
- Configuration backups

### Failover
- Multi-region deployment ready
- Database replication
- CDN failover

## Future Enhancements

- Multi-region deployment
- GraphQL API
- Real-time subscriptions (WebSocket)
- Advanced ML models
- Mobile apps (React Native)
