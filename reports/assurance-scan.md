# Post-Deploy Assurance Scan Report

**Generated:** 2025-01-XX  
**Scope:** Full-stack contract drift, performance hotspots, security/infra drift, recovery readiness

---

## 1. Contract Drift: Schema ↔ Types ↔ Mobile Usage

### 1.1 Prisma Schema ↔ Supabase Migrations

**Status:** ⚠️ **Minor Drift Detected**

#### Mismatches Found:

1. **Telemetry Events Table**
   - **Prisma:** `TelemetryEvent` model (prisma/schema.prisma:277-293)
     - Fields: `id`, `userId`, `timestamp`, `appId`, `eventType`, `durationMs`, `metadataRedactedJson`, `createdAt`
   - **Supabase:** `telemetry_events` table (supabase/migrations/2025-11-05_telemetry.sql:1-9)
     - Fields: `id`, `user_id`, `app`, `type`, `path`, `meta`, `ts`
   - **Drift:** Field names differ (`userId` vs `user_id`, `appId` vs `app`, `eventType` vs `type`), missing `durationMs` in Supabase, missing `path` in Prisma
   - **Impact:** Medium - Client code may use Prisma types but connect to Supabase with different field names

2. **Metrics Log Table**
   - **Prisma:** Not present in schema
   - **Supabase:** `metrics_log` table exists (supabase/migrations/20250106000000_metrics_log.sql:4-38)
   - **Drift:** Missing Prisma model for metrics_log
   - **Impact:** Low - Direct SQL queries used in frontend/app/api/metrics/route.ts:59

3. **Privacy Tables Consistency**
   - **Prisma:** `PrivacyPrefs`, `AppAllowlist`, `SignalToggle`, `TelemetryEvent`, `PrivacyTransparencyLog` (schema.prisma:223-312)
   - **Supabase:** Privacy tables exist but field naming conventions differ (camelCase vs snake_case)
   - **Impact:** Low - Prisma client handles mapping, but direct Supabase queries may fail

### 1.2 Client Types ↔ Database Schema

**Status:** ⚠️ **Type Safety Gaps**

#### Findings:

1. **Implicit `any` Usage** (30 instances found)
   - `frontend/lib/race-condition-guards.ts:9` - `debounce<T extends (...args: any[]) => any>`
   - `frontend/app/api/metrics/route.ts:90` - `Record<string, any[]>`
   - `frontend/app/api/privacy/telemetry/route.ts:17` - `redactMetadata(metadata: any): any`
   - Multiple error handlers using `catch (error: any)`

2. **Missing Type Definitions**
   - No generated types from Supabase schema
   - Prisma types not imported in API routes (frontend/app/api/metrics/route.ts uses direct Supabase client)
   - Missing types for `metrics_log` table

3. **Mobile/Expo Usage**
   - **EAS Config:** Present (eas.json) with channels: `preview`, `production`
   - **Mobile Schema Usage:** Not detected in codebase scan
   - **Impact:** Low - Mobile app may be separate codebase or not yet integrated

### 1.3 Contract Drift Summary

| Category | Count | Severity | Files Affected |
|----------|-------|-----------|----------------|
| Schema field name mismatches | 3 | Medium | prisma/schema.prisma, supabase/migrations/*.sql |
| Missing Prisma models | 1 | Low | supabase/migrations/20250106000000_metrics_log.sql |
| Type safety gaps | 30+ | Medium | frontend/lib/*.ts, frontend/app/api/**/*.ts |

---

## 2. Live Performance Hotspots

### 2.1 Largest JS Bundles

**Status:** ⚠️ **Analysis Needed**

#### Current State:
- Bundle analyzer workflow exists (`.github/workflows/bundle-analyzer.yml`)
- Runs weekly on schedule
- No recent bundle report found in artifacts

#### Webpack Configuration:
- **frontend/next.config.js:147-178** - Split chunks configured:
  - Vendor chunk: `node_modules` (priority 20)
  - Common chunk: min 2 chunks (priority 10)
  - Runtime chunk: single

#### Heavy Dependencies Identified:
- `@sentry/nextjs` (~200KB)
- `posthog-js` (~150KB)
- `reactflow` (~180KB)
- `recharts` (~120KB)
- `framer-motion` (~100KB)

**Recommendation:** Run `ANALYZE=true npm run build` to generate current bundle report.

### 2.2 Slowest API Endpoints

**Status:** ⚠️ **Monitoring Incomplete**

#### Endpoints Without Performance Tracking:
- `/api/metrics` - No p95 tracking
- `/api/telemetry/tti` - No latency metrics
- `/api/privacy/export` - Heavy operation, no timeout/performance guard
- `/api/marketplace/financial` - External API calls, no circuit breaker visible

#### Endpoints With Monitoring:
- `/api/metrics/collect` - Has metrics_log insertion
- `/api/health` - Basic health check

#### Performance Budgets (from Inputs):
- **API p95:** 400ms target
- **LCP:** 2.5s target
- **Uptime:** 99.9% target

**Recommendation:** Add RUM/synthetic monitoring to all API routes.

### 2.3 Mobile TTI (Time to Interactive)

**Status:** ❌ **Not Available**

- No mobile-specific performance tracking found
- EAS config present but no TTI metrics collection
- Mobile app appears separate or not instrumented

---

## 3. Security/Infra Drift

### 3.1 Vercel Scope & Preview Protection

**Status:** ✅ **Configured**

#### Vercel Configuration:
- **vercel.json:** Present with proper headers
- **Preview Protection:** 
  - `frontend/middleware.ts:79` - Checks for preview environment
  - `PREVIEW_REQUIRE_AUTH` env var controls auth requirement
  - Default: `PREVIEW_REQUIRE_AUTH !== 'false'` (enabled by default)

#### Environment Variables:
- `VERCEL_ENV` - Used in robots.ts:4
- `NEXT_PUBLIC_VERCEL_ENV` - Used in robots.ts:5
- `ADMIN_BASIC_AUTH` - Used in middleware.ts:84

**Status:** ✅ Preview protection enabled by default.

### 3.2 Dangling Environment Variable Names

**Status:** ⚠️ **Potential Issues**

#### Environment Variables Referenced:
- `NEXT_PUBLIC_API_URL` - Used in next.config.js:223
- `NEXT_PUBLIC_WS_URL` - Used in Dashboard.tsx:85 (fallback to localhost)
- `SUPABASE_URL` - Used in API routes
- `SUPABASE_SERVICE_ROLE_KEY` - Used in API routes
- `STRIPE_API_KEY` - Used in marketplace/financial/route.ts:6
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_ACCESS_TOKEN`, `QUICKBOOKS_REALM_ID` - Used in marketplace/financial/route.ts:8-11
- `SNAPSHOT_ENCRYPTION_KEY` - Used in ops/commands/snapshot.ts:46

#### Potential Dangling:
- `NEXT_PUBLIC_SITE_URL` - Referenced in robots.ts:21 but may not be set
- `CSP_MODE` - Used in middleware.ts:7 (defaults to 'balanced')
- `REVALIDATE_SECONDS` - Used in middleware.ts:8 (defaults to 60)

**Recommendation:** Audit Vercel environment variables against codebase references.

### 3.3 Security Headers

**Status:** ✅ **Well Configured**

- **next.config.js:184-220** - Comprehensive security headers:
  - HSTS, X-Frame-Options, CSP, X-Content-Type-Options, etc.
- **middleware.ts:7** - CSP mode configurable
- **vercel.json:13-22** - Additional headers configured

---

## 4. Recovery Readiness

### 4.1 Last Backup Metadata

**Status:** ⚠️ **Manual Process**

#### Backup Infrastructure:
- **Snapshot Command:** `ops/commands/snapshot.ts` - Creates encrypted database snapshots
- **Restore Command:** `ops/commands/restore.ts` - Restores from snapshots
- **Storage:** `ops/snapshots/` directory
- **Encryption:** AES-256-CBC (if `SNAPSHOT_ENCRYPTION_KEY` set)

#### Backup Automation:
- **GitHub Action:** `.github/workflows/weekly-maint.yml` - May include backup (needs verification)
- **Manual Trigger:** `npm run ops:snapshot`

**Last Backup:** Unknown - No metadata file found.

**Recommendation:** 
1. Add automated daily backups to CI/CD
2. Store backup metadata (timestamp, size, checksum) in `ops/snapshots/.metadata.json`
3. Upload encrypted backups to S3/GCS for off-site storage

### 4.2 Restore Drill Evidence

**Status:** ❌ **No Evidence Found**

- Restore command exists but no test restore documented
- No restore drill runbook found (except `docs/runbooks/restore.md` - needs verification)
- No restore test results

**Recommendation:** 
1. Schedule quarterly restore drills
2. Document restore procedure in `docs/runbooks/restore.md`
3. Test restore on staging environment monthly

### 4.3 Rollback Path Presence

**Status:** ✅ **Multiple Rollback Paths**

#### Rollback Mechanisms:
1. **Git Rollback:** Standard git revert/rollback
2. **Database Migrations:** Prisma migrations can be rolled back
3. **Vercel Deployments:** Previous deployments available in Vercel dashboard
4. **EAS Channels:** Preview/production channels for mobile

#### Rollback Documentation:
- `ROLLBACK_TRUST.md` - Present in root (needs verification)

**Recommendation:** Document one-command rollback procedure per component.

---

## 5. Ranked Fix List

### Priority 1 (Critical - Fix Immediately)

1. **Contract Drift: Telemetry Events Schema**
   - **File:** `prisma/schema.prisma:277-293`, `supabase/migrations/2025-11-05_telemetry.sql`
   - **Fix:** Align field names or add mapping layer
   - **Command:** `npx prisma db pull` then `npx prisma generate`
   - **PR Title:** `fix: align telemetry_events schema between Prisma and Supabase`
   - **Label:** `auto/refactor`

2. **Missing Type Safety: API Routes**
   - **Files:** `frontend/app/api/**/*.ts` (30+ instances)
   - **Fix:** Replace `any` with proper types, add Zod validation
   - **Command:** `npm run typecheck` (will fail initially)
   - **PR Title:** `type: strengthen API route typing (wave 1)`
   - **Label:** `auto/docs`

### Priority 2 (High - Fix This Sprint)

3. **Performance Monitoring: API Endpoints**
   - **Files:** `frontend/app/api/metrics/route.ts`, `frontend/app/api/telemetry/tti/route.ts`
   - **Fix:** Add RUM/synthetic monitoring, track p95 latency
   - **Command:** Add `@vercel/analytics` or custom metrics collection
   - **PR Title:** `obs: instrument missing telemetry on API routes`
   - **Label:** `auto/ops`

4. **Backup Automation**
   - **Files:** `.github/workflows/weekly-maint.yml`, `ops/commands/snapshot.ts`
   - **Fix:** Add daily automated backup job, store metadata
   - **Command:** Add workflow step: `npm run ops:snapshot`
   - **PR Title:** `ops: automate daily database backups`
   - **Label:** `auto/ops`

### Priority 3 (Medium - Fix Next Sprint)

5. **Bundle Size Analysis**
   - **Files:** `.github/workflows/bundle-analyzer.yml`
   - **Fix:** Run bundle analyzer, identify heavy chunks, code-split
   - **Command:** `ANALYZE=true npm run build`
   - **PR Title:** `perf: optimize bundle size (analyze + split)`
   - **Label:** `auto/perf`

6. **Missing Prisma Model: metrics_log**
   - **Files:** `prisma/schema.prisma`, `supabase/migrations/20250106000000_metrics_log.sql`
   - **Fix:** Add Prisma model for metrics_log table
   - **Command:** `npx prisma db pull` then add model
   - **PR Title:** `fix: add Prisma model for metrics_log table`
   - **Label:** `auto/refactor`

### Priority 4 (Low - Backlog)

7. **Restore Drill Documentation**
   - **Files:** `docs/runbooks/restore.md`
   - **Fix:** Document restore procedure, schedule quarterly drills
   - **Command:** N/A
   - **PR Title:** `docs: add restore drill procedure`
   - **Label:** `auto/docs`

8. **Environment Variable Audit**
   - **Files:** All files referencing `process.env.*`
   - **Fix:** Audit Vercel env vars against codebase, document required vars
   - **Command:** `grep -r "process.env" frontend/ | grep -v node_modules`
   - **PR Title:** `ops: audit and document environment variables`
   - **Label:** `auto/ops`

---

## Summary

- **Contract Drift:** 3 issues (1 critical, 2 medium)
- **Performance:** Monitoring incomplete, bundle analysis needed
- **Security:** Well configured, minor env var audit needed
- **Recovery:** Manual backups, no automated restore drills

**Next Steps:** Address Priority 1 items, then proceed with systems governance audit and type/telemetry wave.
