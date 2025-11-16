# Complete API Endpoints Documentation

**Last Updated:** 2025-01-XX  
**Base URL:** `https://your-app.vercel.app/api` (production) or `http://localhost:3000/api` (development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Telemetry & Events](#telemetry--events)
4. [Insights & Analytics](#insights--analytics)
5. [Privacy & Consent](#privacy--consent)
6. [Integrations](#integrations)
7. [Gamification](#gamification)
8. [AI & Recommendations](#ai--recommendations)
9. [Health & Monitoring](#health--monitoring)
10. [Admin](#admin)

---

## Authentication

### `POST /api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerified": false,
  "createdAt": "2025-01-XXT00:00:00Z"
}
```

**Example (cURL):**
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'
```

**Example (JavaScript):**
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    name: 'John Doe',
  }),
});

const user = await response.json();
```

---

### `POST /api/auth/login`

Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
  }),
});

const { access_token, user } = await response.json();
// Store token for subsequent requests
localStorage.setItem('token', access_token);
```

---

### `GET /api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerified": true,
  "image": "https://...",
  "createdAt": "2025-01-XXT00:00:00Z"
}
```

**Example:**
```javascript
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
});

const user = await response.json();
```

---

### `PUT /api/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "image": "https://..."
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Updated Name",
  "image": "https://...",
  "updatedAt": "2025-01-XXT00:00:00Z"
}
```

---

### `POST /api/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password reset email sent"
}
```

---

### `POST /api/auth/reset-password`

Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password reset successfully"
}
```

---

## User Management

### `POST /api/auth/change-password`

Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password changed successfully"
}
```

---

## Telemetry & Events

### `POST /api/telemetry`

Ingest telemetry event from client.

**Request Body:**
```json
{
  "url": "/dashboard",
  "ttfb": 120,
  "lcp": 2500,
  "cls": 0.1,
  "fid": 50,
  "errors": 0,
  "userAgent": "Mozilla/5.0...",
  "connectionType": "4g",
  "timestamp": 1640995200000
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Example:**
```javascript
await fetch('/api/telemetry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: window.location.pathname,
    ttfb: performance.timing.responseStart - performance.timing.requestStart,
    lcp: lcpValue,
    cls: clsValue,
    fid: fidValue,
  }),
});
```

---

### `POST /api/telemetry/ingest`

Ingest file system event.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "uuid",
  "app": "web",
  "type": "file_created",
  "path": "/path/to/file",
  "meta": {}
}
```

**Response (200):**
```json
{
  "ok": true,
  "id": "event-uuid"
}
```

---

### `GET /api/telemetry`

Get telemetry events.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `userId` (required) - User ID
- `limit` (optional) - Number of events (default: 50)
- `offset` (optional) - Pagination offset

**Response (200):**
```json
{
  "events": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "file_created",
      "path": "/path/to/file",
      "timestamp": "2025-01-XXT00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

## Insights & Analytics

### `GET /api/insights`

Get user insights and patterns.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `userId` (required) - User ID
- `timeRange` (optional) - Time range (7d, 30d, 90d)

**Response (200):**
```json
{
  "patterns": [
    {
      "fileExtension": ".tsx",
      "count": 150,
      "lastUsed": "2025-01-XXT00:00:00Z"
    }
  ],
  "suggestions": [
    {
      "type": "integration",
      "title": "Consider using TypeScript",
      "description": "...",
      "priority": "high"
    }
  ]
}
```

**Example:**
```javascript
const response = await fetch('/api/insights?userId=uuid&timeRange=30d', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { patterns, suggestions } = await response.json();
```

---

### `GET /api/insights/comparison`

Compare patterns over time periods.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `userId` (required) - User ID
- `period1` (required) - First period (e.g., "2025-01")
- `period2` (required) - Second period (e.g., "2025-02")

**Response (200):**
```json
{
  "period1": {
    "totalFiles": 100,
    "patterns": [...]
  },
  "period2": {
    "totalFiles": 150,
    "patterns": [...]
  },
  "changes": [
    {
      "type": "increase",
      "fileExtension": ".tsx",
      "change": 50
    }
  ]
}
```

---

## Privacy & Consent

### `GET /api/privacy/consent`

Get user privacy consent status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "consentGiven": true,
  "dataRetentionDays": 14,
  "monitoringEnabled": true
}
```

---

### `POST /api/privacy/consent`

Update privacy consent.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "consentGiven": true,
  "dataRetentionDays": 14,
  "monitoringEnabled": true
}
```

**Response (200):**
```json
{
  "ok": true
}
```

---

### `POST /api/privacy/export`

Export user data (GDPR).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "downloadUrl": "https://...",
  "expiresAt": "2025-01-XXT00:00:00Z"
}
```

---

### `POST /api/privacy/delete`

Delete user account and all data (GDPR).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "ok": true,
  "deletedAt": "2025-01-XXT00:00:00Z"
}
```

---

## Integrations

### `GET /api/integrations`

List available integrations.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "integrations": [
    {
      "id": "zapier",
      "name": "Zapier",
      "enabled": true,
      "connected": false,
      "description": "Automate workflows",
      "icon": "https://..."
    }
  ]
}
```

---

### `POST /api/integrations/:id/connect`

Connect an integration.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "credentials": {
    "apiKey": "..."
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "integrationId": "zapier",
  "connectedAt": "2025-01-XXT00:00:00Z"
}
```

---

## Gamification

### `GET /api/gamification/stats`

Get user gamification statistics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "streak": 5,
  "totalPoints": 1250,
  "level": 3,
  "achievements": [
    {
      "id": "first-file",
      "name": "First File",
      "unlockedAt": "2025-01-XXT00:00:00Z"
    }
  ]
}
```

---

## AI & Recommendations

### `POST /api/ai/chat`

Chat with AI assistant.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "message": "What files should I focus on?",
  "context": {}
}
```

**Response (200):**
```json
{
  "response": "Based on your patterns...",
  "suggestions": [...]
}
```

---

### `GET /api/ai/recommendations`

Get AI-powered recommendations.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `userId` (required) - User ID

**Response (200):**
```json
{
  "recommendations": [
    {
      "type": "tool",
      "title": "Consider using ESLint",
      "reason": "You're using TypeScript frequently",
      "priority": "high"
    }
  ]
}
```

---

## Health & Monitoring

### `GET /api/health`

Basic health check.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XXT00:00:00Z"
}
```

---

### `GET /api/monitoring/health`

Detailed health check.

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "supabase": "connected",
  "timestamp": "2025-01-XXT00:00:00Z"
}
```

---

### `GET /api/env/validate`

Validate environment variables.

**Response (200):**
```json
{
  "ok": true,
  "timestamp": "2025-01-XXT00:00:00Z",
  "public": {
    "valid": true,
    "errors": [],
    "variables": {
      "NEXT_PUBLIC_SUPABASE_URL": "***set***"
    }
  },
  "server": {
    "valid": true,
    "errors": [],
    "variables": {
      "DATABASE_URL": "***set***"
    }
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid input
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

---

## Rate Limiting

API routes are rate-limited:
- **60 requests per minute** per IP
- **1000 requests per hour** per IP

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

---

## Authentication Flow Example

```javascript
// 1. Register
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
  }),
});

// 2. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const { access_token } = await loginResponse.json();

// 3. Use token for authenticated requests
const userResponse = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
  },
});

const user = await userResponse.json();
```

---

**Last Updated:** 2025-01-XX  
**For questions or issues:** See `/docs` directory or create an issue on GitHub
