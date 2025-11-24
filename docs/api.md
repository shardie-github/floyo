# API Documentation

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive API endpoint documentation

## Overview

Floyo exposes APIs through two layers:
1. **Next.js API Routes** (`frontend/app/api/`) - Serverless functions on Vercel
2. **FastAPI Backend** (`backend/api/`) - Python FastAPI application

**Base URLs:**
- **Frontend API:** `https://<domain>/api/*` (Next.js API routes)
- **Backend API:** `http://localhost:8000/api/*` (FastAPI, if deployed)

**Authentication:** Most endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## API Architecture

### Frontend API Routes (Next.js)

**Location:** `frontend/app/api/`

**Runtime:** Vercel Serverless Functions (Edge or Node.js)

**Key Routes:**
- `/api/health` - Health checks
- `/api/auth/*` - Authentication (forgot password, reset password, 2FA)
- `/api/privacy/*` - Privacy & GDPR
- `/api/telemetry/*` - Telemetry ingestion
- `/api/analytics/*` - Analytics
- `/api/integrations/*` - Integrations
- `/api/billing/*` - Billing

### Backend API (FastAPI)

**Location:** `backend/api/`

**Runtime:** Python FastAPI (deployment unknown)

**Key Routes:**
- `/api/auth/*` - Authentication
- `/api/events/*` - Events
- `/api/patterns/*` - Patterns
- `/api/suggestions/*` - Suggestions
- `/api/stats/*` - Statistics
- `/api/organizations/*` - Organizations
- `/api/workflows/*` - Workflows
- `/api/integrations/*` - Integrations
- `/api/billing/*` - Billing/*` - Billing

---

## Common Patterns

### Authentication

**Most endpoints require authentication:**

```http
Authorization: Bearer <jwt_token>
```

**Get token:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Error Responses

**Standard error format:**
```json
{
  "error": "Error message",
  "details": { ... }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Key Endpoints

### Health & Monitoring

#### `GET /api/health`

**Purpose:** Health check endpoint

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XXT...",
  "uptime": 12345,
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection successful",
      "latency": 10
    }
  }
}
```

### Authentication

#### `POST /api/auth/register`

**Purpose:** Register new user

**Authentication:** Not required

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... }
}
```

#### `POST /api/auth/login`

**Purpose:** Login user

**Authentication:** Not required

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Privacy & GDPR

#### `GET /api/privacy/settings`

**Purpose:** Get privacy settings

**Authentication:** Required

**Response:**
```json
{
  "consentGiven": true,
  "monitoringEnabled": false,
  "dataRetentionDays": 14
}
```

#### `POST /api/privacy/consent`

**Purpose:** Update consent

**Authentication:** Required

**Request:**
```json
{
  "consentGiven": true
}
```

#### `GET /api/privacy/export`

**Purpose:** Export user data (GDPR)

**Authentication:** Required

**Response:** JSON file download

#### `POST /api/privacy/delete`

**Purpose:** Delete user data (GDPR)

**Authentication:** Required

**Response:**
```json
{
  "message": "Data deletion initiated"
}
```

---

## Backend API Endpoints

### Authentication (`/api/auth/*`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/sessions` - List sessions
- `DELETE /api/auth/sessions/{id}` - Delete session

### Events (`/api/events/*`)

- `POST /api/events` - Create event
- `GET /api/events` - List events
- `POST /api/events/batch` - Batch create events
- `GET /api/events/export` - Export events

### Patterns (`/api/patterns/*`)

- `GET /api/patterns` - Get patterns
- `POST /api/patterns` - Create pattern

### Statistics (`/api/stats/*`)

- `GET /api/stats` - Get statistics
- `GET /api/analytics/activation` - Activation analytics
- `GET /api/analytics/funnel` - Funnel analytics

---

## Related Documentation

- [Stack Discovery](./stack-discovery.md) - Overall architecture
- [Backend Strategy](./backend-strategy.md) - Backend details
- [Environment Variables](./env-and-secrets.md) - Configuration

---

**Last Updated:** 2025-01-XX  
**Note:** This is a high-level overview. For detailed endpoint documentation, see OpenAPI spec (if generated) or individual route files.
