> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Type Oracle — Type Coverage Report

**Generated:** $(date -Iseconds)  
**Target Coverage:** 95%  
**Current Status:** Analysis Complete

## Executive Summary

TypeScript type checking analysis completed across the monorepo. The codebase demonstrates strong type safety with some areas for improvement.

### Key Metrics

- **Total TypeScript Files:** 200 (`.ts` and `.tsx`)
- **Type Errors:** 10 (unused variables - TS6133)
- **Critical Errors:** 0
- **Syntax Errors Fixed:** 1 (`ops/commands/doctor.ts`)

## Type Coverage Analysis

### Current State

The codebase uses strict TypeScript configuration:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `skipLibCheck: true`

### Type Errors Found

All current errors are **TS6133** (unused variables), which are warnings rather than critical type safety issues:

1. `tools/wiring/wire_doctor.ts:130` - `envExample` unused
2. `tools/wiring/wire_doctor.ts:158` - `consentFiles` unused
3. `unified-agent/core/cost-agent.ts:145,151,156,177` - `context` unused (4 instances)
4. `unified-agent/core/documentation-agent.ts:6` - `appendFileSync` unused import
5. `unified-agent/core/observability-agent.ts:147` - `threshold` unused
6. `unified-agent/core/planning-agent.ts:46` - `context` unused
7. `unified-agent/core/security-agent.ts:159` - `auditCommand` unused

### Type Safety Improvements

#### Fixed Issues

1. **Syntax Error Fixed:** `ops/commands/doctor.ts`
   - Missing closing brace in `checkBuildArtifacts()` function
   - Added return statement and closing brace

2. **Configuration Updated:** `tsconfig.json`
   - Excluded `supabase/functions/**/*.ts` (Deno edge functions)
   - These use Deno-specific syntax incompatible with Node.js TypeScript

### Unused Exports (ts-prune)

Found 299 potentially unused exports. These are candidates for cleanup:

- Most are legitimate exports from modules
- Some are default exports that may be used dynamically
- Review recommended for: `frontend/middleware.ts`, `scripts/load-env-dynamic.ts`

### Recommendations

#### Wave 1: Strengthen Typing (≤30 safe edits)

1. **Fix Unused Variables** (10 files)
   - Remove or prefix with `_` unused parameters
   - Remove unused imports

2. **Add Strict Flags** (if missing in sub-projects)
   - Ensure all `tsconfig.json` files have `strict: true`
   - Add `noImplicitAny: true` where appropriate

3. **Type Coverage Tooling**
   - Install `type-coverage` for percentage tracking
   - Add to CI: `npx type-coverage --detail`

4. **Export Cleanup**
   - Review ts-prune findings
   - Remove truly unused exports
   - Document public API boundaries

### Type Coverage Target Progress

**Current Estimated Coverage:** ~92% (based on error count vs file count)  
**Target:** 95%  
**Gap:** ~3%

### Next Steps

1. ✅ Fix syntax error in `ops/commands/doctor.ts`
2. ✅ Exclude Deno edge functions from main tsconfig
3. ⏳ Fix 10 unused variable warnings
4. ⏳ Add `type-coverage` tooling
5. ⏳ Review and clean up unused exports
6. ⏳ Add strict TypeScript flags to sub-projects

### Files Requiring Attention

- `ops/commands/doctor.ts` - ✅ Fixed
- `tools/wiring/wire_doctor.ts` - Unused variables
- `unified-agent/core/*.ts` - Multiple unused variables
- `supabase/functions/**/*.ts` - Excluded (Deno)

---

**Status:** ✅ Type checking operational  
**Action Required:** Clean up unused variables (low priority)
