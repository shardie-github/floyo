# API Examples & Usage Guide

**Last Updated:** 2025-01-XX  
**Status:** ✅ Complete  
**Purpose:** Comprehensive API usage examples for developers

---

## Authentication

### Get Access Token

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Use Token in Requests

```bash
# Include token in Authorization header
curl -X GET http://localhost:8000/api/v1/events \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Event Tracking

### Create Event

```bash
curl -X POST http://localhost:8000/api/v1/telemetry \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "file_opened",
    "file_path": "/path/to/file.py",
    "tool": "vscode",
    "metadata": {
      "line_count": 150,
      "language": "python"
    }
  }'
```

### Get User Events

```bash
curl -X GET "http://localhost:8000/api/v1/events?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Pattern Analysis

### Get Detected Patterns

```bash
curl -X GET http://localhost:8000/api/v1/patterns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "patterns": [
    {
      "id": "123",
      "file_extension": ".py",
      "count": 45,
      "last_used": "2025-01-15T10:30:00Z",
      "tools": ["vscode", "terminal"]
    }
  ]
}
```

---

## Health Checks

### Basic Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### Readiness Check

```bash
curl http://localhost:8000/health/readiness
```

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2025-01-15T10:30:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "database_pool": "ok"
  }
}
```

### Detailed Health Check

```bash
curl http://localhost:8000/health/detailed
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid input
- `AUTHENTICATION_ERROR` (401) - Authentication required
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT_ERROR` (409) - Resource conflict
- `RATE_LIMIT_ERROR` (429) - Rate limit exceeded
- `INTERNAL_ERROR` (500) - Server error

---

## Rate Limiting

### Check Rate Limit Headers

```bash
curl -I http://localhost:8000/api/v1/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642248000
```

### Rate Limit Exceeded

**Response (429):**
```json
{
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 60,
      "reset_at": "2025-01-15T10:31:00Z"
    }
  }
}
```

---

## Pagination

### Paginated Endpoints

```bash
curl "http://localhost:8000/api/v1/events?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "has_more": true
  }
}
```

---

## Webhooks (Future)

### Register Webhook

```bash
curl -X POST http://localhost:8000/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhook",
    "events": ["pattern_detected", "workflow_completed"],
    "secret": "your-webhook-secret"
  }'
```

---

## TypeScript/JavaScript Examples

### Using Fetch API

```typescript
async function getEvents(token: string) {
  const response = await fetch('http://localhost:8000/api/v1/events', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
}
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get events
const events = await api.get('/events');
```

---

## Python Examples

### Using Requests

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"
token = "your-access-token"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

# Get events
response = requests.get(f"{BASE_URL}/events", headers=headers)
events = response.json()

# Create event
event_data = {
    "event_type": "file_opened",
    "file_path": "/path/to/file.py",
    "tool": "vscode",
}
response = requests.post(f"{BASE_URL}/telemetry", json=event_data, headers=headers)
```

### Using httpx (Async)

```python
import httpx

async def get_events(token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/v1/events",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()
```

---

## Testing Examples

### Health Check Test

```python
def test_health_check():
    response = requests.get("http://localhost:8000/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
```

### Authentication Test

```python
def test_login():
    response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
```

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle errors gracefully** - check status codes
3. **Use pagination** for list endpoints
4. **Respect rate limits** - check headers and back off
5. **Validate inputs** before sending requests
6. **Use HTTPS** in production
7. **Store tokens securely** - never commit to git

---

**Generated by:** Post-Sprint Elevation Agent  
**Status:** ✅ API Examples Complete
