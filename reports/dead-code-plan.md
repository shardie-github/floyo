# Dead Code Removal Plan

**Generated:** $(date)  
**Tools Used:** ts-prune, knip, depcheck, eslint

## Summary

- **Backup Files Found:** 6
- **Unused Exports:** 217 (excluding "used in module" entries)
- **Missing Dependencies:** 8
- **Unused DevDependencies:** 7

---

## Wave 1: Safe Deletions (Backup Files)

These are backup files created during migrations/refactors. Safe to delete.

| File | Proof | Action | Risk | Status |
|------|-------|--------|------|--------|
| `.github/workflows/deploy-main.yml.bak.20251105_043451` | File system scan | delete | Low | ⚠️ quarantine |
| `frontend/next.config.js.bak.20251105_043451` | File system scan | delete | Low | ⚠️ quarantine |
| `frontend/public/manifest.json.bak.20251105_051455` | File system scan | delete | Low | ⚠️ quarantine |
| `frontend/public/sw.js.bak.20251105_051455` | File system scan | delete | Low | ⚠️ quarantine |
| `frontend/app/offline/page.tsx.bak.20251105_051455` | File system scan | delete | Low | ⚠️ quarantine |
| `frontend/app/layout.tsx.bak.20251105_051510` | File system scan | delete | Low | ⚠️ quarantine |

**Rationale:** Backup files are not referenced anywhere and are safe to remove. They were created during migrations.

---

## Wave 2: Unused Exports (High Confidence)

These exports are not marked as "used in module" and appear unused across the codebase.

### Scripts & Tools

| File/Export | Proof | Action | Risk | Status |
|-------------|-------|--------|------|--------|
| `scripts/load-env-dynamic.ts:215` - `getEnvVar` | ts-prune | remove export | Low | ⚠️ quarantine |
| `scripts/load-env-dynamic.ts:226` - `validateRequiredEnvVars` | ts-prune | remove export | Low | ⚠️ quarantine |
| `tools/data-aggregate.ts:147` - `default` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `tools/shopify.ts:273` - `default` | ts-prune | remove export | Medium | ⚠️ quarantine |

### Frontend Components (Unused Exports)

| File/Export | Proof | Action | Risk | Status |
|-------------|-------|--------|------|--------|
| `frontend/components/AccessibilityHelpers.tsx:30` - `FocusTrap` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/LoadingSkeleton.tsx:13` - `EventSkeleton` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/LoadingSkeleton.tsx:28` - `CardSkeleton` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/LoadingStates.tsx:45` - `LoadingState` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/LoadingStates.tsx:72` - `LoadingButton` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/MobileOptimized.tsx:27` - `MobileContainer` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/MobileOptimized.tsx:40` - `TouchButton` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/MobileOptimized.tsx:71` - `SwipeableContainer` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/ProductTour.tsx:60` - `defaultTourSteps` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/components/ThemeProvider.tsx:74` - `useTheme` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/hooks/useAnalytics.ts:27` - `useActivationTracking` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/hooks/useAnalytics.ts:50` - `useOnboardingTracking` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/hooks/useKeyboardShortcuts.ts:43` - `COMMON_SHORTCUTS` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/hooks/usePasswordValidation.ts:7` - `validatePassword` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/hooks/usePasswordValidation.ts:57` - `getPasswordStrengthColor` | ts-prune | remove export | Low | ⚠️ quarantine |

### Ops Utils (Unused Exports)

| File/Export | Proof | Action | Risk | Status |
|-------------|-------|--------|------|--------|
| `ops/utils/ai-guardrails.ts:49` - `safeLLMCall` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/ai-guardrails.ts:116` - `createOfflineFallback` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/billing.ts:17` - `handleStripeWebhook` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/billing.ts:101` - `createCheckoutSession` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/compliance.ts:21` - `generateDataInventory` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/compliance.ts:52` - `exportUserData` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/compliance.ts:89` - `deleteUserData` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/compliance.ts:109` - `redactLogs` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/compliance.ts:115` - `checkCookieConsent` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/compliance.ts:120` - `checkDoNotTrack` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/cost-caps.ts:41` - `checkCostQuota` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/cost-caps.ts:87` - `throttleRequest` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/cost-caps.ts:93` - `simulateCosts` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/cost-caps.ts:131` - `sendCostAlert` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/env.ts:61` - `getEnv` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/env.ts:70` - `isProduction` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/envrc.ts:8` - `ensureEnvrc` | ts-prune | remove export | Low | ⚠️ quarantine |
| `ops/utils/growth.ts:17` - `trackUTM` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/growth.ts:134` - `generateGrowthReport` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/notify.ts:29` - `notify` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/notify.ts:75` - `getConfiguredWebhooks` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/observability.ts:36` - `recordLatency` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/observability.ts:40` - `recordError` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/observability.ts:44` - `recordCost` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/observability.ts:200` - `saveDashboard` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/quiet-mode.ts:28` - `getQuietModeConfig` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/quiet-mode.ts:56` - `shouldSkipWebhooks` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/quiet-mode.ts:64` - `getMaintenanceBannerMessage` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/quiet-mode.ts:69` - `testQuietMode` | ts-prune | remove export | Low | ⚠️ quarantine |
| `ops/utils/supabase-setup.ts:16` - `setupSupabase` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/supabase-setup.ts:40` - `validateRLSPolicies` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `ops/utils/supabase-setup.ts:89` - `validateIndexes` | ts-prune | remove export | Medium | ⚠️ quarantine |
| `frontend/src/lib/flags.ts:69` - `getEnabledFlags` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/src/lib/flags.ts:77` - `getFlagMetadata` | ts-prune | remove export | Low | ⚠️ quarantine |
| `frontend/src/lib/flags.ts:85` - `getAllFlags` | ts-prune | remove export | Low | ⚠️ quarantine |

### Unified Agent (Unused Exports)

| File/Export | Proof | Action | Risk | Status |
|-------------|-------|--------|------|--------|
| `unified-agent/index.ts:5` - `UnifiedAgentOrchestrator` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:6` - `RepoContextDetector` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:6` - `RepoContext` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:6` - `OperatingMode` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:7` - `ReliabilityAgent` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:7` - `ReliabilityMetrics` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:8` - `CostAgent` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:8` - `CostMetrics` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:9` - `SecurityAgent` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:9` - `SecurityMetrics` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:10` - `DocumentationAgent` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:10` - `DocumentationUpdate` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:11` - `PlanningAgent` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:11` - `SprintPlan` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:11` - `TodoItem` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:12` - `ObservabilityAgent` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:12` - `MetricsSnapshot` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:13` - `ReflectionAgent` | ts-prune | remove export | High | ⚠️ quarantine |
| `unified-agent/index.ts:13` - `ReflectionReport` | ts-prune | remove export | High | ⚠️ quarantine |

**Note:** Unified agent exports are marked as high risk because they may be part of a public API or used externally. Verify before deletion.

---

## Wave 3: Missing Dependencies

These packages are imported but not listed in package.json dependencies.

| Package | Files Using It | Action | Risk |
|---------|----------------|--------|------|
| `@typescript-eslint/parser` | `.eslintrc.json` | Add to devDependencies | Low |
| `eslint-config-next` | `.eslintrc.json` | Add to devDependencies | Low |
| `eslint-config-prettier` | `.eslintrc.json` | Add to devDependencies | Low |
| `@jest/globals` | `tests/privacy-acceptance.test.ts`, `tests/privacy-red-team.test.ts` | Add to devDependencies | Medium |
| `@octokit/rest` | `ops/utils/auto-pr.ts` | Add to dependencies | Medium |
| `k6` | `k6/load_test_*.js` | Add to devDependencies (optional) | Low |
| `@axe-core/cli` | `infra/selfcheck/a11y_scan.mjs` | Add to devDependencies | Low |
| `madge` | `infra/selfcheck/circular_deps.mjs` | Add to devDependencies | Low |
| `react` | `admin/metrics.jsx` | Already in frontend/package.json | Low |
| `recharts` | `admin/metrics.jsx` | Already in frontend/package.json | Low |

---

## Wave 4: Unused DevDependencies

These packages are listed in devDependencies but not used anywhere.

| Package | Proof | Action | Risk |
|---------|-------|--------|------|
| `depcheck` | depcheck report | Keep (used for analysis) | N/A |
| `eslint-plugin-import` | Manual check | Keep (will be used) | N/A |
| `eslint-plugin-security` | Manual check | Keep (will be used) | N/A |
| `eslint-plugin-sonarjs` | Manual check | Keep (will be used) | N/A |
| `eslint-plugin-unused-imports` | Manual check | Keep (will be used) | N/A |
| `knip` | Manual check | Keep (used for analysis) | N/A |
| `ts-prune` | Manual check | Keep (used for analysis) | N/A |
| `wait-on` | depcheck report | Remove if unused | Low |

**Note:** Most "unused" devDependencies are actually analysis tools we just installed. Only `wait-on` may be truly unused.

---

## Wave 5: Configuration Files & TypeScript Errors

### TypeScript Errors Found

| File | Error | Action | Risk |
|------|-------|--------|------|
| `frontend/components/Dashboard.tsx` | Multiple syntax errors (lines 275, 356, 427, 432) | Fix syntax errors | High |

**Action Required:** Fix TypeScript errors in Dashboard.tsx before proceeding with dead code removal.

---

## Recommendations

### High Priority
1. **Fix TypeScript errors** in `frontend/components/Dashboard.tsx` - blocking builds
2. **Delete backup files** - safe, immediate cleanup
3. **Add missing dependencies** - prevents runtime errors

### Medium Priority
4. **Review unused exports** - many may be intentionally exported for future use
5. **Consolidate duplicate code** - run similarity analysis

### Low Priority
6. **Remove unused devDependencies** - only after verification
7. **Standardize folder structure** - apply conventions

---

## Next Steps

1. ✅ Generate reports (ts-prune, knip, depcheck)
2. ⏳ Review this plan with team
3. ⏳ Fix TypeScript errors
4. ⏳ Execute Wave 1 (backup files)
5. ⏳ Execute Wave 3 (missing dependencies)
6. ⏳ Review Wave 2 exports with team before removal
7. ⏳ Add tooling (ESLint rules, CI checks)

---

## Notes

- All items marked as "⚠️ quarantine" should be reviewed before deletion
- "used in module" entries from ts-prune are intentionally kept (they're used internally)
- Unified agent exports may be part of a public API - verify before removal
- Some "unused" exports may be used dynamically or via string references
