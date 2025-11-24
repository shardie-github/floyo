# Backend Deployment Guide

**Generated:** 2025-01-XX  
**Purpose:** Complete guide to deploying the Floyo FastAPI backend

## Overview

The Floyo backend is a Python FastAPI application that can be deployed to various hosting providers. This guide covers deployment options and processes.

---

## Deployment Options

### Option 1: Fly.io (Recommended)

**Why Fly.io:**
- Docker-based deployment
- Global edge network
- Good for Python/FastAPI
- Automatic HTTPS
- Easy scaling

**Prerequisites:**
- Fly.io account
- Fly CLI installed: `curl -L https://fly.io/install.sh | sh`

**Deployment Steps:**

1. **Initialize Fly.io app:**
```bash
cd backend
fly launch --name floyo-backend
```

2. **Create `Dockerfile`:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

3. **Create `fly.toml`:**
```toml
app = "floyo-backend"
primary_region = "iad"

[build]

[env]
  PORT = "8000"
  DATABASE_URL = "postgresql://user:pass@host:5432/db"
  SECRET_KEY = "your-secret-key"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 500

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/api/health"
```

4. **Set secrets:**
```bash
fly secrets set DATABASE_URL="postgresql://..." \
  SECRET_KEY="..." \
  SUPABASE_URL="..." \
  SUPABASE_SERVICE_ROLE_KEY="..."
```

5. **Deploy:**
```bash
fly deploy
```

6. **Verify:**
```bash
fly status
fly logs
curl https://floyo-backend.fly.dev/api/health
```

---

### Option 2: Render

**Why Render:**
- Managed services
- Auto-deploy from Git
- PostgreSQL included
- Good for Python/FastAPI

**Deployment Steps:**

1. **Create `render.yaml`:**
```yaml
services:
  - type: web
    name: floyo-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
    healthCheckPath: /api/health
```

2. **Deploy via Render Dashboard:**
   - Connect GitHub repository
   - Select `backend/` directory
   - Set environment variables
   - Deploy

---

### Option 3: Railway

**Why Railway:**
- Simple deployment
- Auto-deploy from Git
- Good for Python/FastAPI

**Deployment Steps:**

1. **Create `Procfile`:**
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. **Deploy via Railway Dashboard:**
   - Connect GitHub repository
   - Select `backend/` directory
   - Set environment variables
   - Deploy

---

### Option 4: Self-Hosted (Docker)

**Why Self-Hosted:**
- Full control
- Cost-effective at scale
- Custom infrastructure

**Deployment Steps:**

1. **Create `Dockerfile`:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

3. **Deploy:**
```bash
docker-compose up -d
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/backend-deploy.yml`

```yaml
name: Backend Deploy

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run tests
        run: |
          cd backend
          pytest tests/unit/ -v

      - name: Deploy to Fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master
        with:
          version: "latest"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Deploy
        run: |
          cd backend
          flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Required Secrets:**
- `FLY_API_TOKEN` - Fly.io API token

---

## Environment Variables

### Required Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard |
| `SECRET_KEY` | Application secret key (min 32 chars) | Generate: `openssl rand -hex 32` |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment (development/staging/production) | `development` |
| `API_HOST` | API host | `0.0.0.0` |
| `API_PORT` | API port | `8000` |
| `REDIS_URL` | Redis connection URL | None (in-memory fallback) |
| `CELERY_BROKER_URL` | Celery broker URL | None |
| `SENTRY_DSN` | Sentry DSN for error tracking | None |

---

## Health Checks

### Health Check Endpoint

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XXT...",
  "version": "1.0.0"
}
```

**Usage:**
-**
- `200` - Healthy
- `503` - Unhealthy

### Health Check Configuration

**Fly.io:**
```toml
[[services.http_checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "GET"
  path = "/api/health"
```

**Render:**
```yaml
healthCheckPath: /api/health
```

---

## Database Migrations

### Before Deployment

**Important:** Run database migrations before deploying backend code that depends on schema changes.

**Steps:**
1. Apply Supabase migrations: `supabase migration up`
2. Verify schema: `tsx scripts/db-validate-schema.ts`
3. Deploy backend code

**Or:** Use feature flags to handle schema changes gracefully.

---

## Monitoring

### Logs

**Fly.io:**
```bash
fly logs
```

**Render:**
- View logs in Render Dashboard

**Railway:**
- View logs in Railway Dashboard

### Error Tracking

**Sentry Integration:**
- Sentry configured in `backend/sentry_config.py`
- Set `SENTRY_DSN` environment variable
- Errors automatically tracked

### Performance Monitoring

**APM Integration:**
- Consider adding APM (e.g., Datadog, New Relic)
- Monitor response times
- Track slow queries

---

## Scaling

### Horizontal Scaling

**Fly.io:**
```bash
fly scale count 3
```

**Render:**
- Configure scaling in Render Dashboard

**Railway:**
- Configure scaling in Railway Dashboard

### Vertical Scaling

**Fly.io:**
```bash
fly scale vm shared-cpu-1x
```

**Render/Railway:**
- Configure in dashboard

---

## Troubleshooting

### Deployment Fails

**Common Causes:**
1. Missing environment variables
2. Database connection issues
3. Build errors

**Steps:**
1. Check deployment logs
2. Verify environment variables
3. Test database connection
4. Test build locally: `docker build -t backend .`

### Health Check Fails

**Common Causes:**
1. Database connection issues
2. Application errors
3. Port misconfiguration

**Steps:**
1. Check application logs
2. Verify database connection
3. Test health endpoint locally: `curl http://localhost:8000/api/health`

### Performance Issues

**Common Causes:**
1. Database query performance
2. Missing indexes
3. Connection pool exhaustion

**Steps:**
1. Monitor slow queries
2. Add database indexes
3. Adjust connection pool size

---

## Best Practices

### 1. Environment-Specific Deployments

- **Development:** Local development
- **Staging:** Staging environment for testing
- **Production:** Production environment

### 2. Secrets Management

- Never commit secrets
- Use environment variables
- Rotate secrets regularly

### 3. Health Checks

- Implement comprehensive health checks
- Monitor health check endpoints
- Set up alerts

### 4. Logging

- Structured logging
- Log levels (DEBUG, INFO, WARNING, ERROR)
- Centralized log aggregation

### 5. Monitoring

- Error tracking (Sentry)
- Performance monitoring (APM)
- Database monitoring

---

## Quick Reference

### Deploy to Fly.io

```bash
cd backend
fly launch
fly secrets set DATABASE_URL="..." SECRET_KEY="..."
fly deploy
```

### Deploy to Render

1. Connect GitHub repository
2. Select `backend/` directory
3. Set environment variables
4. Deploy

### Deploy to Railway

1. Connect GitHub repository
2. Select `backend/` directory
3. Set environment variables
4. Deploy

### Local Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Related Documentation

- [Backend Strategy](./backend-strategy.md) - Backend architecture
- [Database Migrations](./db-migrations-and-schema.md) - Migration strategy
- [Environment Variables](./env-and-secrets.md) - Configuration

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent
