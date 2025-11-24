# API Documentation

## Overview

Floyo API provides RESTful endpoints for file usage pattern tracking, integration suggestions, and workflow automation.

## Base URL

- Production: `https://api.floyo.app`
- Development: `http://localhost:8000`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## API Versioning

- `/api/v1/*` - Versioned endpoints (recommended)
- `/api/*` - Legacy endpoints (deprecated)

## Endpoints

### Authentication

#### POST /api/v1/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "token": "jwt_token"
}
```

#### POST /api/v1/auth/login
Login and get access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Events

#### POST /api/v1/events
Create a new event.

**Request:**
```json
{
  "file_path": "/path/to/file.js",
  "event_type": "file_opened",
  "tool": "vscode",
  "metadata": {}
}
```

#### GET /api/v1/events
List events with pagination.

**Query Parameters:**
- `skip`: Offset (default: 0)
- `limit`: Limit (default: 20)
- `tool`: Filter by tool
- `event_type`: Filter by event type

### Patterns

#### GET /api/v1/patterns
Get detected patterns.

**Query Parameters:**
- `skip`: Offset
- `limit`: Limit

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "file_extension": ".js",
      "count": 150,
      "last_used": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "has_more": false
}
```

### Suggestions

#### GET /api/v1/suggestions
Get integration suggestions.

#### POST /api/v1/suggestions/generate
Generate new suggestions.

### Workflows

#### GET /api/v1/workflows
List workflows.

#### POST /api/v1/workflows
Create workflow.

**Request:**
```json
{
  "name": "My Workflow",
  "description": "Automated task",
  "definition": {
    "steps": [],
    "connections": []
  }
}
```

#### POST /api/v1/workflows/{workflow_id}/execute
Execute a workflow.

### Integrations

#### GET /api/integrations
List user integrations.

#### POST /api/integrations
Create integration.

#### GET /api/integrations/zapier/status
Get Zapier integration status.

#### POST /api/integrations/zapier/connect
Connect Zapier account.

#### GET /api/integrations/tiktok/status
Get TikTok Ads integration status.

#### POST /api/integrations/tiktok/connect
Connect TikTok Ads account.

#### GET /api/integrations/meta/status
Get Meta Ads integration status.

#### POST /api/integrations/meta/connect
Connect Meta Ads account.

### Analytics

#### GET /api/analytics/dashboard
Get dashboard analytics.

**Query Parameters:**
- `time_range`: 7d, 30d, 90d, 1y

**Response:**
```json
{
  "overview": {
    "total_events": 1500,
    "total_patterns": 25,
    "active_integrations": 3,
    "workflows_executed": 45
  },
  "trends": [],
  "top_patterns": [],
  "integration_usage": [],
  "workflow_performance": []
}
```

### Marketplace

#### GET /api/marketplace/integrations
List marketplace integrations.

**Query Parameters:**
- `category`: Filter by category
- `search`: Search query
- `sort`: popular, rating, newest

#### GET /api/marketplace/integrations/{integration_id}
Get integration details.

#### GET /api/marketplace/integrations/{integration_id}/reviews
Get integration reviews.

## Rate Limiting

Rate limits vary by endpoint:
- General endpoints: 60 requests/minute
- Creation endpoints: 20 requests/hour
- Destructive endpoints: 5-10 requests/hour

Rate limit headers:
- `X-RateLimit-Limit`: Limit
- `X-RateLimit-Remaining`: Remaining
- `X-RateLimit-Reset`: Reset timestamp

## Error Responses

Standard error format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {}
}
```

Common status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Pagination

Paginated responses include:
- `items`: Array of items
- `total`: Total count
- `has_more`: Whether more items exist
- `skip`: Current offset
- `limit`: Current limit

## Webhooks

### Zapier Webhooks

Zapier integrations can trigger webhooks on events.

**Webhook URL Format:**
```
https://api.floyo.app/api/integrations/zapier/webhook/{webhook_id}
```

**Payload:**
```json
{
  "event_type": "file_opened",
  "file_path": "/path/to/file.js",
  "timestamp": "2024-01-15T10:00:00Z",
  "metadata": {}
}
```

## SDKs

### JavaScript/TypeScript

```typescript
import { FloyoClient } from '@floyo/sdk';

const client = new FloyoClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.floyo.app',
});

// Track event
await client.events.create({
  file_path: '/path/to/file.js',
  event_type: 'file_opened',
});

// Get patterns
const patterns = await client.patterns.list();
```

## Support

For API support:
- Email: api-support@floyo.app
- Documentation: https://docs.floyo.app
- Status: https://status.floyo.app
