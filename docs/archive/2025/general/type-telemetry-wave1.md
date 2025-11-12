> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Type & Telemetry Wave 1 Report

**Generated:** 2025-01-XX  
**Scope:** Type safety gaps, unused exports, missing telemetry instrumentation

---

## 1. Type Safety Gaps

### 1.1 Files with >5 Implicit `any` Types

**Total:** 29 files with 67 instances

#### Top 10 Files (by count):

1. **frontend/app/api/privacy/consent/route.ts** - 6 instances
   - Lines: Multiple `any` types in error handlers and metadata
   - **Fix:** Add Zod schemas for request/response types

2. **frontend/app/api/privacy/apps/route.ts** - 5 instances
   - Lines: Request body types, error handlers
   - **Fix:** Define `AppAllowlistRequest`, `AppAllowlistResponse` types

3. **frontend/app/api/privacy/signals/route.ts** - 5 instances
   - Lines: Signal toggle types, metadata handling
   - **Fix:** Define `SignalToggleRequest`, `SignalToggleResponse` types

4. **frontend/app/api/privacy/export/route.ts** - 3 instances
   - Lines: Export data types, error handlers
   - **Fix:** Define `ExportData` type, use Prisma types

5. **frontend/app/api/privacy/telemetry/route.ts** - 2 instances
   - Lines: `redactMetadata(metadata: any): any` function
   - **Fix:** Define `TelemetryMetadata` type with Zod schema

6. **frontend/lib/race-condition-guards.ts** - 5 instances
   - Lines: Generic function types, query client types
   - **Fix:** Define proper generic constraints, type query client

7. **frontend/app/api/metrics/route.ts** - 4 instances
   - Lines: Metrics aggregation types
   - **Fix:** Define `MetricsBySource`, `AggregatedMetrics` types

8. **frontend/components/PrivacyConsentWizard.tsx** - 2 instances
   - Lines: Form data types
   - **Fix:** Define `ConsentFormData` type

9. **frontend/components/WorkflowBuilder.tsx** - 2 instances
   - Lines: Workflow node types
   - **Fix:** Define `WorkflowNode`, `WorkflowEdge` types

10. **frontend/app/settings/privacy/page.tsx** - 11 instances
    - Lines: Settings form types, API response types
    - **Fix:** Define `PrivacySettings`, `PrivacySettingsResponse` types

### 1.2 Type Coverage Analysis

**Current State:**
- TypeScript strict mode: Not fully enabled
- `any` usage: 67 instances across 29 files
- Missing type definitions: ~15 API route types

**Target:** 95% type coverage (from Inputs.budgets.type_coverage_min)

**Gap:** Need to eliminate ~60 `any` types and add ~15 type definitions

---

## 2. Unused Exports

### 2.1 Files with >10 Unused Exports

**Analysis Source:** `reports/ts-prune.txt` (299 unused exports found)

#### Top Files (by count):

1. **unified-agent/index.ts** - 13 unused exports
   - Exports: `UnifiedAgentOrchestrator`, `RepoContextDetector`, `ReliabilityAgent`, etc.
   - **Status:** May be used in other packages or runtime
   - **Action:** Verify usage, remove if truly unused

2. **marketplace/financial/manager.ts** - 4 unused exports
   - Exports: `CostEntry`, `RevenueEntry`, `OperatingExpense`, `ProfitabilityMetrics`
   - **Action:** Check if used in API routes, remove if unused

3. **scripts/load-env-dynamic.ts** - 4 unused exports
   - Exports: `getEnvVar`, `validateRequiredEnvVars`, `loadFromEnvFile`, etc.
   - **Action:** May be used in runtime, verify before removal

4. **tools/data-aggregate.ts** - 3 unused exports
   - Exports: `execute`, `toolSchema`
   - **Action:** Check if used in agent-engine, remove if unused

5. **tools/shopify.ts** - 3 unused exports
   - Exports: `execute`, `toolSchema`
   - **Action:** Check marketplace integration usage

**Note:** Many exports may be used at runtime or in other packages. Use `knip` for more accurate analysis.

### 2.2 Unused Export Summary

| Category | Count | Action |
|----------|-------|--------|
| Agent/Engine exports | 13 | Verify runtime usage |
| Marketplace exports | 7 | Check API integration |
| Script utilities | 8 | Verify CLI usage |
| Tool exports | 6 | Check agent usage |
| **Total** | **34** | **Verify before removal** |

---

## 3. Missing Telemetry Instrumentation

### 3.1 API Endpoints Without RUM/Synthetic Metrics

**Status:** ⚠️ **Incomplete Coverage**

#### Endpoints Missing Telemetry:

1. **`/api/metrics`** (GET)
   - **File:** `frontend/app/api/metrics/route.ts`
   - **Current:** No p95 latency tracking, no error rate tracking
   - **Add:** RUM beacon for response time, error tracking

2. **`/api/telemetry/tti`** (POST)
   - **File:** `frontend/app/api/telemetry/tti/route.ts`
   - **Current:** Inserts to database but no performance metrics
   - **Add:** Track TTI collection latency, success rate

3. **`/api/privacy/export`** (GET)
   - **File:** `frontend/app/api/privacy/export/route.ts`
   - **Current:** Heavy operation, no timeout tracking
   - **Add:** Track export duration, file size, error rate

4. **`/api/marketplace/financial`** (GET)
   - **File:** `frontend/app/api/marketplace/financial/route.ts`
   - **Current:** External API calls, no circuit breaker metrics
   - **Add:** Track external API latency, failure rate

5. **`/api/privacy/mfa/verify`** (POST)
   - **File:** `frontend/app/api/privacy/mfa/verify/route.ts`
   - **Current:** Security-critical, no audit trail metrics
   - **Add:** Track verification attempts, success rate, latency

6. **`/api/audit/me`** (GET)
   - **File:** `frontend/app/api/audit/me/route.ts`
   - **Current:** No performance tracking
   - **Add:** Track query performance, result size

7. **`/api/feedback`** (POST)
   - **File:** `frontend/app/api/feedback/route.ts`
   - **Current:** No submission tracking
   - **Add:** Track submission rate, response time

### 3.2 Pages Without Performance Tracking

**Status:** ⚠️ **Partial Coverage**

#### Pages Missing LCP/TTI Tracking:

1. **`/dashboard`**
   - **File:** `frontend/app/dashboard/page.tsx`
   - **Current:** No Web Vitals tracking
   - **Add:** LCP, FID, CLS tracking

2. **`/settings/privacy`**
   - **File:** `frontend/app/settings/privacy/page.tsx`
   - **Current:** No load time tracking
   - **Add:** Page load metrics, form interaction tracking

3. **`/account/export`**
   - **File:** `frontend/app/account/export/page.tsx`
   - **Current:** No export flow tracking
   - **Add:** Export initiation → completion flow tracking

4. **`/admin/metrics`**
   - **File:** `frontend/app/admin/metrics/page.tsx`
   - **Current:** Displays metrics but doesn't track own performance
   - **Add:** Admin page load metrics

### 3.3 Synthetic Monitoring Gaps

**Current State:**
- Lighthouse CI runs on PRs (`.github/workflows/preview-pr.yml:51-52`)
- No scheduled synthetic monitoring for production
- No uptime checks for critical endpoints

**Missing:**
- Scheduled Lighthouse runs for production
- Uptime checks for `/api/health`, `/api/metrics`
- Synthetic user flows (login → dashboard → export)

---

## 4. Action Plan

### Wave 1: Type Strengthening (≤30 explicit type fixes)

**Priority Files:**
1. `frontend/app/api/privacy/consent/route.ts` - 6 fixes
2. `frontend/app/api/privacy/apps/route.ts` - 5 fixes
3. `frontend/app/api/privacy/signals/route.ts` - 5 fixes
4. `frontend/lib/race-condition-guards.ts` - 5 fixes
5. `frontend/app/api/metrics/route.ts` - 4 fixes
6. `frontend/app/api/privacy/export/route.ts` - 3 fixes
7. `frontend/app/api/privacy/telemetry/route.ts` - 2 fixes

**Total:** ~30 fixes

**Approach:**
- Add Zod schemas for API request/response types
- Define proper generic constraints
- Replace `any` with union types or `unknown` with type guards

### Wave 1: Telemetry Instrumentation

**Priority Endpoints:**
1. `/api/metrics` - Add RUM beacon
2. `/api/privacy/export` - Add performance tracking
3. `/api/marketplace/financial` - Add external API metrics
4. `/api/privacy/mfa/verify` - Add security audit metrics

**Priority Pages:**
1. `/dashboard` - Add Web Vitals tracking
2. `/settings/privacy` - Add page load metrics

**Approach:**
- Use `@vercel/analytics` for RUM (already installed)
- Add custom metrics collection for API routes
- Integrate with existing `TelemetryBeacon` component

---

## 5. Scripts to Add

### 5.1 Type Coverage Script

**File:** `package.json` (add script)

```json
"type:coverage": "tsc --noEmit --pretty false 2>&1 | grep -E 'error TS|Found' | tee reports/type-coverage.txt"
```

### 5.2 Type Check Script

**Status:** ✅ Already exists (`npm run typecheck`)

### 5.3 Telemetry Check Script

**File:** `package.json` (add script)

```json
"obs:check": "tsx scripts/check-telemetry-coverage.ts"
```

**Create:** `scripts/check-telemetry-coverage.ts` - Scans API routes and pages for telemetry instrumentation

---

## Summary

- **Type Safety:** 67 `any` instances across 29 files → Target: Fix top 10 files (30 fixes)
- **Unused Exports:** 299 found → Verify before removal (34 high-confidence removals)
- **Telemetry:** 7 API endpoints + 4 pages missing instrumentation → Add RUM/synthetic metrics

**Next Steps:** Create PRs for type strengthening and telemetry instrumentation (Wave 1).
