> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Dependency Surgeon — Trim Bloat & Drift Report

**Generated:** $(date -Iseconds)  
**Tools Used:** knip, depcheck, npm audit

## Executive Summary

Dependency analysis reveals some unused dependencies and missing packages. Bundle analysis recommended for frontend optimization.

## Analysis Results

### Unused Dependencies (depcheck)

**Dev Dependencies:**
- `eslint-plugin-security` - Not used
- `eslint-plugin-sonarjs` - Not used  
- `wait-on` - Not used

**Missing Dependencies:**
- `@typescript-eslint/eslint-plugin` - Referenced in `.eslintrc.json` but not installed
- `openai` - Used in `marketplace/moderation/service.ts`
- `@google-cloud/language` - Used in `marketplace/moderation/service.ts`
- `stripe` - Used in `marketplace/financial/manager.ts`
- `quickbooks-node-sdk` - Used in `marketplace/financial/manager.ts`
- `k6` - Used in `k6/*.js` files
- `react` - Used in `admin/metrics.jsx`
- `recharts` - Used in `admin/metrics.jsx`

### Unused Exports (ts-prune)

Found 299 potentially unused exports. Most are legitimate module exports.

**Key Findings:**
- `frontend/middleware.ts` - Exports `middleware`, `config`
- `scripts/load-env-dynamic.ts` - Multiple exports
- `unified-agent/index.ts` - Many type exports

### Bundle Analysis

**Status:** Not yet run  
**Recommendation:** Run `npm run build` and analyze bundle size

### Security Audit

**Vulnerabilities Found:** 27 total
- 7 low
- 6 moderate  
- 14 high

**Action Required:** Run `npm audit fix` (non-breaking fixes)

## Recommendations

### Wave 1: Remove Unused Dependencies

**Safe Removals:**
1. `eslint-plugin-security` - Remove if not needed
2. `eslint-plugin-sonarjs` - Remove if not needed
3. `wait-on` - Remove if not used in CI

**Before Removal:**
- Verify not used in CI workflows
- Check if referenced in config files

### Wave 2: Add Missing Dependencies

**Critical:**
1. `@typescript-eslint/eslint-plugin` - Required for ESLint config
2. `openai` - Required for moderation service
3. `@google-cloud/language` - Required for moderation service
4. `stripe` - Required for financial manager
5. `quickbooks-node-sdk` - Required for financial manager

**Optional:**
- `k6` - Only needed for load testing (can be dev dependency)
- `react`, `recharts` - Only needed for admin dashboard

### Wave 3: Bundle Optimization

**Actions:**
1. Run bundle analyzer on frontend build
2. Identify heavy dependencies
3. Consider code splitting for large libraries
4. Replace heavy dependencies with lighter alternatives (if drop-in compatible)

### Wave 4: Security Updates

**Actions:**
1. Run `npm audit fix` for non-breaking updates
2. Review high-severity vulnerabilities
3. Update dependencies with breaking changes carefully

## Hygiene CI

**Status:** Check if `.github/workflows/code-quality.yml` includes dependency checks

**Recommended Additions:**
```yaml
- name: Check unused dependencies
  run: npm run audit:deps

- name: Check unused exports
  run: npm run prune:exports

- name: Security audit
  run: npm audit --audit-level=moderate
```

## Files Requiring Attention

1. `package.json` - Remove unused deps, add missing deps
2. `.eslintrc.json` - Fix missing plugin reference
3. `marketplace/moderation/service.ts` - Add missing deps
4. `marketplace/financial/manager.ts` - Add missing deps
5. `k6/*.js` - Add k6 as dev dependency
6. `admin/metrics.jsx` - Add react/recharts if needed

## Metrics

- **Unused Dev Dependencies:** 3
- **Missing Dependencies:** 8
- **Security Vulnerabilities:** 27
- **Unused Exports:** 299 (review needed)

---

**Status:** ⚠️ Missing dependencies detected  
**Action Required:** Add missing dependencies, remove unused ones
