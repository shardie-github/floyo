# FULL STACK SMOKE TEST REPORT

Generated: 2025-11-14T00:58:39.721Z

---

## 1. Secret Parity Matrix

| Variable | Cursor | .env.local | Supabase | GitHub | Vercel | Deployed | Status |
|----------|--------|------------|----------|--------|--------|----------|--------|
| DATABASE_URL | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| SUPABASE_URL | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| SUPABASE_ANON_KEY | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| SUPABASE_SERVICE_ROLE_KEY | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| SUPABASE_JWT_SECRET | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| NEXT_PUBLIC_SUPABASE_URL | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| SUPABASE_ACCESS_TOKEN | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| SUPABASE_PROJECT_REF | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| VERCEL_TOKEN | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| VERCEL_ORG_ID | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |
| VERCEL_PROJECT_ID | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ MISSING |

## 2. Connectivity Results

### Supabase

❌ **Supabase: DATABASE_URL exists**: DATABASE_URL not found in environment

### Vercel

✅ **Vercel: Configuration file**: vercel.json found and valid
   ```json
{
  "framework": "nextjs",
  "hasEdgeFunctions": true
}
   ```

✅ **Vercel: API routes**: Found 42 API routes
   ```json
[
  "/frontend/app/api/reco/floyo/route.ts",
  "/frontend/app/api/audit/me/route.ts",
  "/frontend/app/api/health/route.ts",
  "/frontend/app/api/feedback/route.ts",
  "/frontend/app/api/monitoring/health/route.ts",
  "/frontend/app/api/monitoring/metrics/route.ts",
  "/frontend/app/api/ai/recommendations/route.ts",
  "/frontend/app/api/ai/chat/route.ts",
  "/frontend/app/api/ai/insights/route.ts",
  "/frontend/app/api/ai/predictions/route.ts",
  "/frontend/app/api/gamification/stats/route.ts",
  "/frontend/app/api/gamification/achievements/route.ts",
  "/frontend/app/api/privacy/score/route.ts",
  "/frontend/app/api/privacy/consent/route.ts",
  "/frontend/app/api/privacy/signals/route.ts",
  "/frontend/app/api/privacy/telemetry/route.ts",
  "/frontend/app/api/privacy/mfa/verify/route.ts",
  "/frontend/app/api/privacy/mfa/check/route.ts",
  "/frontend/app/api/privacy/delete/route.ts",
  "/frontend/app/api/privacy/apps/route.ts",
  "/frontend/app/api/privacy/export/route.ts",
  "/frontend/app/api/privacy/log/route.ts",
  "/frontend/app/api/privacy/cron/cleanup/route.ts",
  "/frontend/app/api/wiring-status/route.ts",
  "/frontend/app/api/env-test/route.ts",
  "/frontend/app/api/analytics/track/route.ts",
  "/frontend/app/api/backup/list/route.ts",
  "/frontend/app/api/ingest/route.ts",
  "/frontend/app/api/telemetry/route.ts",
  "/frontend/app/api/telemetry/tti/route.ts",
  "/frontend/app/api/telemetry/ingest/route.ts",
  "/frontend/app/api/metrics/route.ts",
  "/frontend/app/api/metrics/collect/route.ts",
  "/frontend/app/api/flags/route.ts",
  "/frontend/app/api/docs/route.ts",
  "/frontend/app/api/insights/route.ts",
  "/frontend/app/api/insights/time/route.ts",
  "/frontend/app/api/insights/comparison/route.ts",
  "/frontend/app/api/marketplace/moderate/route.ts",
  "/frontend/app/api/marketplace/financial/route.ts",
  "/frontend/app/api/search/route.ts",
  "/frontend/app/api/search/suggestions/route.ts"
]
   ```

⚠️ **Vercel: Authentication token**: VERCEL_TOKEN not found

⚠️ **Vercel: Deployed endpoints**: Deployed endpoint check requires Vercel CLI or API access

### GitHub Actions

✅ **GitHub Actions: Node version**: Node version: v22.21.1 (meets requirement)

⚠️ **GitHub Actions: Prisma generate**: DATABASE_URL not available

✅ **GitHub Actions: Supabase CLI**: Supabase CLI available

✅ **GitHub Actions: Build script**: Build script found: npm run build --workspace=frontend

### Local Dev

✅ **Local Dev: Node version**: Node version: v22.21.1

⚠️ **Local Dev: Prisma migrate status**: DATABASE_URL not available

✅ **Local Dev: Prisma WASM engine**: WASM engine configured

## 3. Errors and Warnings

### Cursor Runtime Environment

- ⚠️ **Warning**: DATABASE_URL not set

### .env.local

- ⚠️ **Warning**: .env.local not found in root or frontend directory

### Supabase Project Settings

- ⚠️ **Warning**: SUPABASE_PROJECT_REF not found - cannot infer Supabase URL

### GitHub Secrets

- ⚠️ **Warning**: Found 34 unique secrets referenced in workflows
- ⚠️ **Warning**: Secrets: DOCKER_USERNAME, DOCKER_PASSWORD, SUPABASE_DB_URL, RELIABILITY_ALERT_WEBHOOK, SECURITY_ALERT_WEBHOOK, COST_ALERT_WEBHOOK, GITHUB_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VERCEL_TOKEN, DATABASE_URL, SUPABASE_ANON_KEY, LHCI_GITHUB_APP_TOKEN, PROD_URL, WEBHOOK_URL, VERCEL_ORG_ID, VERCEL_PROJECT_ID, RELEASE_WEBHOOK_URL, SNAPSHOT_ENCRYPTION_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BACKUP_WEBHOOK_URL, META_TOKEN, TIKTOK_TOKEN, SHOPIFY_API_KEY, SHOPIFY_PASSWORD, SHOPIFY_STORE, SUPABASE_SERVICE_KEY, EXPO_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD, VERCEL_PROJECT_DOMAIN
- ⚠️ **Warning**: GitHub Secrets require API access or manual verification

### Vercel Environment Variables

- ⚠️ **Warning**: VERCEL_TOKEN not available

### Deployed Vercel Runtime

- ⚠️ **Warning**: Deployed runtime check requires API endpoint or Vercel CLI
- ⚠️ **Warning**: To test: Create /api/env-test route that returns env vars (without secrets)

## 4. Auto-fix Steps

### Variables Requiring Synchronization

- **DATABASE_URL**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **SUPABASE_URL**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **SUPABASE_ANON_KEY**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **SUPABASE_SERVICE_ROLE_KEY**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **SUPABASE_JWT_SECRET**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **NEXT_PUBLIC_SUPABASE_URL**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **SUPABASE_ACCESS_TOKEN**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **SUPABASE_PROJECT_REF**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **VERCEL_TOKEN**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **VERCEL_ORG_ID**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

- **VERCEL_PROJECT_ID**:
  - Authoritative value: Not set
  - Actions:
    - Variable not set anywhere - needs configuration

See `.cursor/fixes/env_sync.md` for detailed sync commands.

## 5. Final Summary

**Status**: ❌ **FAIL**

**Tests Passed**: 7/12 (58.3%)
**Critical Errors**: 1
**Variables Synchronized**: 0/12
**Mismatches Found**: 12
**Errors**: 0
**Warnings**: 9

**Action Required**: Review errors and mismatches above. See `.cursor/fixes/env_sync.md` for remediation steps.

## 6. Manual Verification Required

Some checks require manual verification:

1. **GitHub Secrets**: Use GitHub CLI or dashboard to verify secrets exist
   ```bash
   gh secret list
   ```

2. **Vercel Environment Variables**: Pull and compare
   ```bash
   cd frontend && vercel env pull .env.vercel
   ```

3. **Supabase Dashboard**: Verify API keys match
   - Go to Settings → API
   - Compare URLs and keys with expected values

4. **Deployed Vercel Functions**: Test endpoint
   ```bash
   curl https://YOUR_PROJECT.vercel.app/api/env-test
   ```

5. **GitHub Actions**: Run test workflow manually

See `.cursor/fixes/manual-verification-guide.md` for detailed instructions.

---

*Report generated by Full-Stack Smoke Test*
*Manual verification guide: .cursor/fixes/manual-verification-guide.md*
