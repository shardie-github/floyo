# Canary & Shadow Deploy Harness

**Generated:** 2025-01-XX  
**Module:** checkout (from Inputs.canaryModule)  
**Platform:** Vercel (frontend), Expo (mobile)

---

## Overview

Canary deployment harness for gradual rollout with automatic rollback on error threshold breaches. Supports both web (Vercel) and mobile (Expo) deployments.

---

## 1. Feature Flags

### 1.1 Canary Flag Configuration

**File:** `config/flags.canary.json` (create)

```json
{
  "canary": {
    "checkout": {
      "enabled": true,
      "trafficPercentage": 10,
      "stopLossThresholds": {
        "errorRate": 0.05,
        "p95LatencyMs": 500,
        "rollbackOnBreach": true
      },
      "shadowTraffic": false,
      "channels": {
        "web": "preview",
        "mobile": "preview"
      }
    }
  }
}
```

### 1.2 Flag Usage

**File:** `frontend/lib/flags.ts` (update)

```typescript
export function isCanaryEnabled(module: string): boolean {
  const flags = getFeatureFlags();
  return flags.canary?.[module]?.enabled === true;
}

export function shouldRouteToCanary(userId: string, module: string): boolean {
  if (!isCanaryEnabled(module)) return false;
  
  const config = getFeatureFlags().canary[module];
  const hash = hashUserId(userId);
  return (hash % 100) < config.trafficPercentage;
}
```

---

## 2. Shadow Traffic

### 2.1 Shadow Route Configuration

**File:** `frontend/app/api/shadow/route.ts` (create)

```typescript
export async function POST(request: NextRequest) {
  const { module, path, method, body } = await request.json();
  
  if (!isCanaryEnabled(module)) {
    return NextResponse.json({ error: 'Canary not enabled' }, { status: 400 });
  }
  
  // Execute shadow request (no response to user)
  const shadowResponse = await executeShadowRequest(module, path, method, body);
  
  // Log metrics for comparison
  await logShadowMetrics(module, shadowResponse);
  
  return NextResponse.json({ ok: true });
}
```

### 2.2 Shadow Traffic Rules

- **Trigger:** Only for canary-enabled modules
- **Execution:** Parallel to production, no user impact
- **Metrics:** Compare canary vs production performance
- **Threshold:** Stop shadow if error rate > 1%

---

## 3. Stop-Loss Thresholds

### 3.1 Threshold Configuration

**File:** `config/flags.canary.json` (see above)

**Thresholds:**
- **Error Rate:** 5% (0.05) - Rollback if exceeded
- **p95 Latency:** 500ms - Rollback if exceeded
- **Rollback On Breach:** Automatic

### 3.2 Monitoring & Alerting

**File:** `ops/monitors/canary-monitor.ts` (create)

```typescript
export async function checkCanaryHealth(module: string) {
  const config = getCanaryConfig(module);
  const metrics = await getCanaryMetrics(module, '5m');
  
  const breaches = [];
  if (metrics.errorRate > config.stopLossThresholds.errorRate) {
    breaches.push('errorRate');
  }
  if (metrics.p95LatencyMs > config.stopLossThresholds.p95LatencyMs) {
    breaches.push('p95Latency');
  }
  
  if (breaches.length > 0 && config.stopLossThresholds.rollbackOnBreach) {
    await rollbackCanary(module);
    await notifyTeam(module, breaches);
  }
}
```

---

## 4. Vercel Preview Rules

### 4.1 Preview Deployment Configuration

**File:** `.github/workflows/canary-deploy.yml` (see below)

**Rules:**
- Deploy to Vercel preview environment
- Use preview URL for canary traffic routing
- Set `VERCEL_ENV=preview` for canary deployments

### 4.2 Traffic Routing

**File:** `frontend/middleware.ts` (update)

```typescript
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const module = getModuleFromPath(url.pathname);
  
  if (module === 'checkout' && isCanaryEnabled('checkout')) {
    const userId = getUserId(request);
    if (userId && shouldRouteToCanary(userId, 'checkout')) {
      // Route to canary preview URL
      const canaryUrl = new URL(url.pathname, process.env.CANARY_PREVIEW_URL);
      return NextResponse.rewrite(canaryUrl);
    }
  }
  
  return NextResponse.next();
}
```

---

## 5. Expo Channel Gates

### 5.1 Channel Configuration

**File:** `eas.json` (update)

```json
{
  "build": {
    "preview": {
      "channel": "preview",
      "distribution": "internal"
    },
    "production": {
      "channel": "production",
      "distribution": "store"
    }
  },
  "updates": {
    "preview": {
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

### 5.2 Channel Gating Logic

**File:** `frontend/lib/mobile-updates.ts` (create)

```typescript
export async function getUpdateChannel(userId: string, module: string): Promise<string> {
  if (!isCanaryEnabled(module)) {
    return 'production';
  }
  
  if (shouldRouteToCanary(userId, module)) {
    return 'preview';
  }
  
  return 'production';
}
```

---

## 6. Rollback Plan

### 6.1 Automatic Rollback

**Trigger:** Stop-loss threshold breach

**Steps:**
1. Disable canary flag: `config/flags.canary.json` → `enabled: false`
2. Route all traffic to production
3. Notify team via Slack/webhook
4. Create incident ticket

**Command:**
```bash
npm run ops canary:rollback --module=checkout
```

### 6.2 Manual Rollback

**Command:**
```bash
# Disable canary
npm run ops canary:disable --module=checkout

# Or revert deployment
vercel rollback --token $VERCEL_TOKEN
```

---

## 7. Metrics & Observability

### 7.1 Canary Metrics

**Track:**
- Error rate (canary vs production)
- p95 latency (canary vs production)
- Request count (canary vs production)
- User feedback (if collected)

### 7.2 Dashboard

**File:** `frontend/app/admin/canary/page.tsx` (create)

- Real-time canary metrics
- Comparison charts (canary vs production)
- Threshold status
- Rollback history

---

## 8. Deployment Workflow

### 8.1 Canary Deployment Steps

1. **Deploy to Preview**
   ```bash
   vercel deploy --prebuilt --token $VERCEL_TOKEN
   ```

2. **Enable Canary Flag**
   ```bash
   npm run ops canary:enable --module=checkout --traffic=10
   ```

3. **Monitor Metrics**
   - Check error rate, latency
   - Monitor for 15 minutes

4. **Gradual Rollout**
   - 10% → 25% → 50% → 100%
   - Monitor at each stage

5. **Promote to Production**
   ```bash
   vercel deploy --prebuilt --prod --token $VERCEL_TOKEN
   ```

---

## 9. Testing

### 9.1 Canary Testing Checklist

- [ ] Canary flag enables/disables correctly
- [ ] Traffic routing works (10% to canary)
- [ ] Stop-loss triggers rollback
- [ ] Metrics collection works
- [ ] Rollback restores production
- [ ] Mobile channel gating works

### 9.2 Test Scenarios

1. **Happy Path:** Canary performs well → promote to production
2. **Error Threshold:** Error rate exceeds 5% → automatic rollback
3. **Latency Threshold:** p95 exceeds 500ms → automatic rollback
4. **Manual Rollback:** Disable canary → traffic routes to production

---

## 10. Configuration Reference

### 10.1 Environment Variables

```bash
CANARY_PREVIEW_URL=https://checkout-git-canary-*.vercel.app
CANARY_MONITORING_ENABLED=true
CANARY_WEBHOOK_URL=https://hooks.slack.com/...
```

### 10.2 Feature Flag Schema

```typescript
interface CanaryConfig {
  enabled: boolean;
  trafficPercentage: number; // 0-100
  stopLossThresholds: {
    errorRate: number; // 0-1
    p95LatencyMs: number;
    rollbackOnBreach: boolean;
  };
  shadowTraffic: boolean;
  channels: {
    web: 'preview' | 'production';
    mobile: 'preview' | 'production';
  };
}
```

---

## Summary

- **Feature Flags:** Configurable canary enable/disable
- **Traffic Routing:** 10% initial, gradual increase
- **Stop-Loss:** Automatic rollback on threshold breach
- **Vercel:** Preview environment for canary
- **Expo:** Channel gating for mobile
- **Rollback:** One-command rollback procedure

**Next Steps:** Implement canary harness for checkout module, test with 10% traffic.
