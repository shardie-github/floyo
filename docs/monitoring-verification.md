# Monitoring Verification Guide

**Generated:** 2025-01-XX  
**Purpose:** Verify error tracking and performance monitoring

## Overview

This guide helps verify that error tracking (Sentry) and performance monitoring (Vercel Analytics, PostHog) are properly configured and working.

---

## Error Tracking Verification (Sentry)

### Configuration Check

**File:** `frontend/lib/monitoring/sentry.ts`

**Verify:**
1. Sentry is initialized
2. `NEXT_PUBLIC_SENTRY_DSN` is set
3. Sentry client is configured

**Check:**
```bash
grep -r "SENTRY_DSN" frontend/
grep -r "@sentry" frontend/
```

### Manual Test

**Step 1: Trigger Test Error**

Create a test endpoint or button that throws an error:

```typescript
// frontend/app/api/test-error/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Test error
  throw new Error('Test error for Sentry verification');
  
  return NextResponse.json({ message: 'This should not be reached' });
}
```

**Step 2: Access Test Endpoint**

```bash
curl http://localhost:3000/api/test-error
```

**Step 3: Check Sentry Dashboard shows error within 1-2 minutes**

**Step 3: Verify in Sentry**

1. Go to Sentry Dashboard
2. Check "Issues" tab
3. Look for "Test error for Sentry verification"
4. Verify error details are captured

### Automated Test Script

**File:** `scripts/verify-sentry.ts`

```typescript
#!/usr/bin/env tsx
/**
 * Verify Sentry Integration
 * 
 * Tests that Sentry is properly configured and can capture errors.
 */

import * as Sentry from '@sentry/nextjs';

async function verifySentry() {
  console.log('🔍 Verifying Sentry integration...\n');
  
  // Check DSN
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.log('❌ NEXT_PUBLIC_SENTRY_DSN not set');
    console.log('   Set NEXT_PUBLIC_SENTRY_DSN in .env.local');
    return false;
  }
  
  console.log('✅ NEXT_PUBLIC_SENTRY_DSN is set');
  
  // Check Sentry initialization
  if (!Sentry.getCurrentHub().getClient()) {
    console.log('⚠️  Sentry client not initialized');
    console.log('   Sentry may initialize at runtime');
  } else {
    console.log('✅ Sentry client initialized');
  }
  
  // Test error capture (in development, this won't send to Sentry)
  try {
    Sentry.captureException(new Error('Sentry verification test'));
    console.log('✅ Error capture test completed');
  } catch (error) {
    console.log('❌ Error capture test failed:', error);
    return false;
  }
  
  console.log('\n✅ Sentry verification complete!');
  console.log('   Check Sentry Dashboard for test error');
  
  return true;
}

verifySentry()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

**Usage:**
```bash
npm run verify:sentry
```

---

## Performance Monitoring Verification

### Vercel Analytics

**Configuration Check:**

**File:** `frontend/app/layout.tsx` or `frontend/app/providers.tsx`

**Verify:**
1. `@vercel/analytics` is imported
2. `<Analytics />` component is rendered
3. Analytics is enabled

**Check:**
```bash
grep -r "@vercel/analytics" frontend/
grep -r "<Analytics" frontend/
```

**Manual Test:**

1. **Deploy to Vercel** (preview or production)
2. **Visit deployed site**
3. **Navigate pages**
4. **Check Vercel Dashboard → Analytics**

**Expected:** Analytics data appears within minutes

**Verification Steps:**

1. Go to Vercel Dashboard
2. Select project
3. Go to "Analytics" tab
4. Verify:
   - Page views are tracked
   - Performance metrics are shown
   - Real-time visitors are shown

### PostHog Analytics

**Configuration Check:**

**File:** `frontend/lib/analytics/analytics.ts` or similar

**Verify:**
1. PostHog is initialized
2. `NEXT_PUBLIC_POSTHOG_KEY` is set
3. PostHog client is configured

**Check:**
```bash
grep -r "POSTHOG" frontend/
grep -r "posthog" frontend/
```

**Manual Test:**

**Step 1: Check PostHog Initialization**

```typescript
// In browser console on deployed site
window.posthog?.capture('test_event', { test: true });
```

**Step 2: Verify in PostHog**

1. Go to PostHog Dashboard
2. Check "Events" tab
3. Look for "test_event"
4. Verify event properties

**Automated Test Script:**

**File:** `scripts/verify-posthog.ts`

```typescript
#!/usr/bin/env tsx
/**
 * Verify PostHog Integration
 */

async function verifyPostHog() {
  console.log('🔍 Verifying PostHog integration...\n');
  
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    console.log('⚠️  NEXT_PUBLIC_POSTHOG_KEY not set');
    console.log('   PostHog is optional - skipping verification');
    return true;
  }
  
  console.log('✅ NEXT_PUBLIC_POSTHOG_KEY is set');
  console.log('   Verify PostHog in browser console:');
  console.log('   window.posthog?.capture("test_event")');
  
  return true;
}

verifyPostHog()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

---

## Backend Error Tracking (Sentry)

### Configuration Check

**File:** `backend/sentry_config.py`

**Verify:**
1. Sentry SDK is initialized
2. `SENTRY_DSN` is set
3. Sentry is configured for FastAPI

**Check:**
```bash
grep -r "SENTRY_DSN" backend/
grep -r "sentry" backend/
```

### Manual Test

**Step 1: Trigger Test Error**

Create a test endpoint:

```python
# backend/api/test_error.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/test-error", tags=["test"])

@router.get("")
async def test_error():
    """Test endpoint to verify Sentry error tracking."""
    raise ValueError("Test error for Sentry verification")
    return JSONResponse({"message": "This should not be reached"})
```

**Step 2: Access Test Endpoint**

```bash
curl http://localhost:8000/api/test-error
```

**Expected:** Sentry Dashboard shows error within 1-2 minutes

**Step 3: Verify in Sentry**

1. Go to Sentry Dashboard
2. Check "Issues" tab
3. Look for "Test error for Sentry verification"
4. Verify error details are captured

---

## Health Check Monitoring

### Frontend Health Check

**Endpoint:** `GET /api/health`

**Verify:**
```bash
curl https://<your-domain>/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XXT...",
  "checks": {
    "database": { "status": "ok" },
    "environment": { "status": "ok" }
  }
}
```

### Backend Health Check

**Endpoint:** `GET /api/health`

**Verify:**
```bash
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XXT..."
}
```

---

## Monitoring Dashboard

### Create Monitoring Dashboard

**File:** `frontend/app/admin/monitoring/page.tsx`

Create a monitoring dashboard that shows:
- Error rates (from Sentry)
- Performance metrics (from Vercel Analytics)
- Health check status
- Database connection status

---

## Verification Checklist

### Error Tracking

- [ ] Sentry DSN configured (`NEXT_PUBLIC_SENTRY_DSN`)
- [ ] Sentry initialized in frontend
- [ ] Sentry DSN configured for backend (`SENTRY_DSN`)
- [ ] Sentry initialized in backend
- [ ] Test error captured in Sentry
- [ ] Error alerts configured (optional)

### Performance Monitoring

- [ ] Vercel Analytics enabled
- [ ] Analytics component rendered
- [ ] Page views tracked
- [ ] Performance metrics tracked
- [ ] PostHog configured (optional)
- [ ] PostHog events tracked (optional)

### Health Checks

- [ ] Frontend health check endpoint working
- [ ] Backend health check endpoint working
- [ ] Health checks automated (CI/CD)
- [ ] Health check alerts configured (optional)

---

## Troubleshooting

### Sentry Not Capturing Errors

**Symptoms:**
- Errors not appearing in Sentry Dashboard
- No error tracking

**Steps:**
1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check Sentry initialization in code
3. Verify Sentry client is created
4. Check browser console for Sentry errors
5. Test with manual error capture

### Vercel Analytics Not Working

**Symptoms:**
- No analytics data in Vercel Dashboard
- Page views not tracked

**Steps:**
1. Verify Analytics component is rendered
2. Check Vercel project settings
3. Verify deployment is on Vercel
4. Check browser console for errors
5. Wait a few minutes for data to appear

### PostHog Not Working

**Symptoms:**
- Events not appearing in PostHog
- PostHog not initialized

**Steps:**
1. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
2. Check PostHog initialization in code
3. Verify PostHog client is created
4. Check browser console for PostHog errors
5. Test with manual event capture

---

## Related Documentation

- [Backend Deployment](./backend-deployment.md) - Backend deployment
- [Environment Variables](./env-and-secrets.md) - Configuration
- [Launch Readiness](./launch-readiness-report.md) - Pre-launch checklist

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent
