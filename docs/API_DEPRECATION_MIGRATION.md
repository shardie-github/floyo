# API Deprecation Migration Guide

## Overview

The Floyo API is transitioning from legacy `/api/*` endpoints to versioned `/api/v1/*` endpoints. This document provides migration guidance for the deprecation timeline and migration path.

## Deprecation Timeline

| Phase | Date | Status | Action Required |
|-------|------|--------|----------------|
| **Phase 1: Announcement** | Current | ✅ Active | Legacy endpoints still functional but marked deprecated |
| **Phase 2: Deprecation Warning** | Q2 2025 | 🔄 Planned | Legacy endpoints return deprecation headers |
| **Phase 3: Sunset** | Q4 2025 (v2.0 release) | 📅 Planned | Legacy endpoints removed |

## Deprecated Endpoints

All endpoints under `/api/*` (except `/api/v1/*`) are deprecated. The following endpoints will be removed in v2.0:

### Authentication
- `POST /api/auth/register` → `POST /api/v1/auth/register`
- `POST /api/auth/login` → `POST /api/v1/auth/login`
- `POST /api/auth/refresh` → `POST /api/v1/auth/refresh`
- `GET /api/auth/sessions` → `GET /api/v1/auth/sessions`
- `DELETE /api/auth/sessions/{session_id}` → `DELETE /api/v1/auth/sessions/{session_id}`
- `DELETE /api/auth/sessions` → `DELETE /api/v1/auth/sessions`
- `GET /api/auth/me` → `GET /api/v1/auth/me`
- `PUT /api/auth/profile` → `PUT /api/v1/auth/profile`
- `GET /api/auth/verify-email/{token}` → `GET /api/v1/auth/verify-email/{token}`
- `POST /api/auth/resend-verification` → `POST /api/v1/auth/resend-verification`
- `POST /api/auth/forgot-password` → `POST /api/v1/auth/forgot-password`
- `POST /api/auth/reset-password` → `POST /api/v1/auth/reset-password`
- `POST /api/auth/change-password` → `POST /api/v1/auth/change-password`

### Events
- `POST /api/events/upload` → `POST /api/v1/events/upload`
- `POST /api/events` → `POST /api/v1/events`
- `POST /api/events/batch` → `POST /api/v1/events/batch`
- `GET /api/events` → `GET /api/v1/events`
- `GET /api/events/export` → `GET /api/v1/events/export`

### Suggestions
- `GET /api/suggestions` → `GET /api/v1/suggestions`
- `POST /api/suggestions/generate` → `POST /api/v1/suggestions/generate`
- `POST /api/suggestions/{suggestion_id}/bookmark` → `POST /api/v1/suggestions/{suggestion_id}/bookmark`
- `POST /api/suggestions/{suggestion_id}/apply` → `POST /api/v1/suggestions/{suggestion_id}/apply`
- `POST /api/suggestions/{suggestion_id}/dismiss` → `POST /api/v1/suggestions/{suggestion_id}/dismiss`

### Patterns
- `GET /api/patterns` → `GET /api/v1/patterns`
- `GET /api/patterns/export` → `GET /api/v1/patterns/export`

### Statistics & Configuration
- `GET /api/stats` → `GET /api/v1/stats`
- `GET /api/config` → `GET /api/v1/config`
- `PUT /api/config` → `PUT /api/v1/config`

### Data Management
- `GET /api/data/export` → `GET /api/v1/data/export`
- `DELETE /api/data/delete` → `DELETE /api/v1/data/delete`
- `POST /api/data/retention/cleanup` → `POST /api/v1/data/retention/cleanup`

### Organizations
- `POST /api/organizations` → `POST /api/v1/organizations`
- `GET /api/organizations` → `GET /api/v1/organizations`
- `GET /api/organizations/{org_id}/members` → `GET /api/v1/organizations/{org_id}/members`
- `PUT /api/organizations/{org_id}` → `PUT /api/v1/organizations/{org_id}`
- `DELETE /api/organizations/{org_id}` → `DELETE /api/v1/organizations/{org_id}`

### Workflows
- `POST /api/workflows` → `POST /api/v1/workflows`
- `POST /api/workflows/{workflow_id}/rollback` → `POST /api/v1/workflows/{workflow_id}/rollback`
- `POST /api/workflows/{workflow_id}/execute` → `POST /api/v1/workflows/{workflow_id}/execute`
- `GET /api/workflows` → `GET /api/v1/workflows`
- `GET /api/workflows/{workflow_id}` → `GET /api/v1/workflows/{workflow_id}`
- `PUT /api/workflows/{workflow_id}` → `PUT /api/v1/workflows/{workflow_id}`
- `DELETE /api/workflows/{workflow_id}` → `DELETE /api/v1/workflows/{workflow_id}`
- `GET /api/workflows/{workflow_id}/executions` → `GET /api/v1/workflows/{workflow_id}/executions`
- `GET /api/workflows/{workflow_id}/versions` → `GET /api/v1/workflows/{workflow_id}/versions`

### Integrations
- `GET /api/integrations/connectors` → `GET /api/v1/integrations/connectors`
- `GET /api/integrations` → `GET /api/v1/integrations`
- `POST /api/integrations` → `POST /api/v1/integrations`
- `GET /api/integrations/{integration_id}` → `GET /api/v1/integrations/{integration_id}`
- `PUT /api/integrations/{integration_id}` → `PUT /api/v1/integrations/{integration_id}`
- `DELETE /api/integrations/{integration_id}` → `DELETE /api/v1/integrations/{integration_id}`
- `POST /api/integrations/{integration_id}/test` → `POST /api/v1/integrations/{integration_id}/test`

### Audit Logs
- `GET /api/audit-logs` → `GET /api/v1/audit-logs`

## Migration Steps

### For API Consumers

1. **Update Base URL**: Change base URL from `/api/` to `/api/v1/`
   ```javascript
   // Before
   const apiUrl = 'https://api.floyo.dev/api';
   
   // After
   const apiUrl = 'https://api.floyo.dev/api/v1';
   ```

2. **Update All Endpoints**: Replace all `/api/*` paths with `/api/v1/*`
   ```javascript
   // Before
   fetch('/api/auth/login', { ... })
   
   // After
   fetch('/api/v1/auth/login', { ... })
   ```

3. **Handle Deprecation Headers**: Monitor for deprecation warnings
   ```javascript
   const response = await fetch('/api/...');
   const deprecationWarning = response.headers.get('X-API-Deprecated');
   if (deprecationWarning) {
     console.warn('This endpoint is deprecated:', deprecationWarning);
   }
   ```

### For Frontend Applications

Update API client configuration:

```typescript
// config/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_VERSION = 'v1';
export const API_ENDPOINT = `${API_BASE_URL}/api/${API_VERSION}`;
```

### Testing

1. Test all endpoints with new `/api/v1/*` paths
2. Verify backward compatibility during transition period
3. Monitor for deprecation warnings in logs

## Current Status

**Note:** As of the current implementation, versioned endpoints (`/api/v1/*`) are not yet fully implemented. All routes are currently under `/api/*`. See `backend/api_v1.py` for implementation status.

**Implementation Roadmap:**
1. ✅ Router definitions created (`api_v1_router`, `api_router`)
2. ⏳ Routes need to be moved from `main.py` to versioned modules
3. ⏳ Legacy endpoints will remain for backward compatibility during transition
4. ⏳ Versioned endpoints will be fully functional before v2.0 release

## Support

For questions or issues during migration:
- **Documentation**: See `/docs` endpoint for OpenAPI spec
- **Support Email**: support@floyo.dev
- **GitHub Issues**: [Project Repository Issues](https://github.com/your-repo/issues)

## Versioning Policy

- **v1**: Current stable version (recommended)
- **v2**: Planned for Q4 2025 (will remove legacy endpoints)
- **Future versions**: Will follow semantic versioning

---

**Last Updated**: 2024-12-19  
**Next Review**: Q1 2025
