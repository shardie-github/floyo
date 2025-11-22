# CI & Code Cleanup Plan - Floyo Repo
**Staff Engineer + Platform Reliability Lead Analysis**

---

## A. DISCOVER THE CURRENT STATE (CODE + CI)

### CODE & STRUCTURE SNAPSHOT

**High-Level Structure:**
- **Monorepo** with clear separation: `backend/` (Python/FastAPI), `frontend/` (Next.js/TypeScript), `supabase/` (DB migrations/functions)
- **Supporting directories**: `ops/`, `tools/`, `scripts/`, `tests/`, `agent-engine/`, `unified-agent/`
- **Configuration**: Root-level `package.json` orchestrates workspace commands; separate `frontend/package.json` for Next.js

**Key Findings:**

1. **Backend Structure** (`backend/`):
   - 100+ Python files, many at root level (e.g., `analytics.py`, `analytics_dashboard.py`, `api_v1.py`, `api_v1_billing.py`, `api_v1_workflows.py`, `api_v1_workflow_automation.py`)
   - Subdirectories: `api/`, `endpoints/`, `guardian/`, `ml/`, `notifications/`, `services/`, `optimization/`, `jobs/`
   - **Issue**: Many root-level files suggest flat structure; potential duplication (e.g., `analytics.py` vs `analytics_dashboard.py`)

2. **Frontend Structure** (`frontend/`):
   - Next.js 14 app router structure (`app/`, `components/`, `lib/`)
   - Well-organized subdirectories (`components/integrations/`, `components/analytics/`, `lib/services/`)
   - **Issue**: Some duplication (e.g., `components/EmptyState.tsx` vs `components/ui/EmptyState.tsx`)

3. **Test Structure**:
   - Python tests: `tests/test_*.py` (16 files) + `tests/integration/`, `tests/stress/`, `tests/unit/`
   - TypeScript tests: `tests/*.test.ts` (4 files) + `frontend/tests/`
   - **Issue**: Tests scattered across multiple locations; no clear test organization strategy

4. **Naming Inconsistencies**:
   - API files: `api_v1.py`, `api_v1_billing.py`, `api_v1_workflows.py` vs `api/privacy.py`
   - Analytics: `analytics.py`, `analytics_dashboard.py`, `services/insights_service.py`
   - ML: `ml/api.py`, `ml/api_enhanced.py` (suggests duplication)

5. **Dead/Legacy Code Indicators**:
   - Multiple "archive" directories in `docs/archive/2025/`
   - Scripts referencing old patterns: `scripts/aurora-prime.ts`, `scripts/master-omega-prime.ts`
   - Workflow files referencing "Phase 1 leverage point" comments (suggests old sprint artifacts)

### CI & CHECKS SNAPSHOT

**Workflow Inventory (42 workflows total):**

**Core CI/Testing (8 workflows):**
1. `ci.yml` - Full matrix (unit, e2e, contracts) + doctor + lighthouse + synthetic monitors + migration safety + RLS guard + release
2. `pre-merge-checks.yml` - Type check + coverage + UX copy lint + bundle size
3. `code-quality.yml` - Python lint (black/ruff/mypy) + TypeScript lint + format + code hygiene
4. `privacy-ci.yml` - Privacy lint + RLS check + privacy tests + policy check
5. `wiring-check.yml` - Connectivity/wiring harness tests
6. `ci-intent-tests.yml` - Architecture integrity + self-reflection + pre-merge gate
7. `preflight.yml` - Preflight agent checks
8. `integration-audit.yml` - Lighthouse + Axe accessibility audit

**Deployment (4 workflows):**
9. `deploy-main.yml` - Main branch deploy (DB migrate + Vercel prod)
10. `cd.yml` - Docker build & push
11. `canary-deploy.yml` - Canary deployment
12. `post_deploy_verify.yml` - Post-deploy verification

**Scheduled/Maintenance (8 workflows):**
13. `nightly-etl.yml` - Nightly ETL jobs
14. `weekly-maint.yml` - Weekly maintenance
15. `meta-audit.yml` - Weekly meta-architect audit (Mondays)
16. `benchmarks.yml` - Performance benchmarks
17. `backup-automation.yml` - Backup automation
18. `system_health.yml` - System health checks
19. `systems-metrics.yml` - Systems metrics
20. `telemetry.yml` - Telemetry collection

**Specialized/Orchestration (10+ workflows):**
21. `orchestrate.yml` - Orchestration
22. `orchestrator.yml` - Another orchestrator
23. `remediation_orchestrator.yml` - Remediation orchestrator
24. `agent-runner.yml` - Agent runner
25. `unified-agent.yml` - Unified agent
26. `aurora-prime.yml` - Aurora prime
27. `master-omega-prime.yml` - Master omega prime
28. `final_assurance_release.yml` - Final assurance release
29. `project-governance.yml` - Project governance
30. `status_pages.yml` - Status pages

**Documentation/Guards (5 workflows):**
31. `docs-guard.yml` - Docs tidy + draft leakage check
32. `docs-pdf.yml` - PDF generation
33. `vercel-guard.yml` - Vercel hardening validation
34. `env-smoke-test.yml` - Environment smoke tests
35. `env-validation.yml` - Environment validation

**Other (7+ workflows):**
36. `bundle-analyzer.yml` - Bundle analysis
37. `openapi-generation.yml` - OpenAPI generation
38. `supabase_delta_apply.yml` - Supabase delta apply
39. `data_quality.yml` - Data quality checks
40. `on_failure_doctor.yml` - Failure doctor
41. `mobile.yml` - Mobile checks
42. `pr-auto-comments.yml` - PR auto comments

**Key CI Issues:**

1. **Massive Overlap**: 
   - `ci.yml` runs tests, `pre-merge-checks.yml` runs tests + type-check, `code-quality.yml` runs lint + type-check
   - Multiple workflows checking the same things (lint, type-check, tests)
   - `wiring-check.yml` overlaps with `ci.yml` e2e tests

2. **Redundant Jobs**:
   - `code-quality.yml` has separate jobs for `lint-python`, `lint-typescript`, `format` (could be combined)
   - `pre-merge-checks.yml` duplicates type-check that's already in `code-quality.yml`
   - `ci.yml` has `doctor` job that might overlap with `preflight.yml`

3. **Conditional Failures**:
   - Many workflows use `continue-on-error: true` or `|| true` (e.g., `wiring-check.yml`, `integration-audit.yml`)
   - `code-quality.yml` has `mypy . --ignore-missing-imports || true` (type-check doesn't fail)
   - `pre-merge-checks.yml` has warnings that "don't fail, just warn for now"

4. **Scheduled vs PR Triggers**:
   - Many workflows run on both `pull_request` AND `push` to `main`
   - Heavy checks (Lighthouse, integration audits) run on every PR
   - Some workflows should be scheduled-only (e.g., `meta-audit.yml`, `benchmarks.yml`)

5. **Missing Dependencies**:
   - `ci.yml` matrix job has conditional `if: github.ref == 'refs/heads/main'` but other jobs depend on it
   - Jobs don't always properly declare `needs:` dependencies

6. **Environment/Secret Issues**:
   - Many workflows require secrets that might not be set (e.g., `SUPABASE_URL`, `DATABASE_URL`)
   - Some workflows use placeholder values (`NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'`)

7. **Version Inconsistencies**:
   - Some workflows use `actions/setup-node@v3`, others use `@v4`
   - Python version: mostly `3.11`, but some workflows might default to different versions

### WHY SO MANY FAILING CHECKS (HYPOTHESES)

1. **Overlapping Workflows Running Same Checks**: Multiple workflows (ci.yml, pre-merge-checks.yml, code-quality.yml) all run lint/type-check/tests, causing duplicate failures and noise.

2. **Conditional Failures Masking Real Issues**: Many workflows use `continue-on-error: true` or `|| true`, so failures don't actually block PRs but still show as "failed" checks, creating confusion.

3. **Missing/Incorrect Secrets**: Workflows that require database/Supabase secrets fail when secrets aren't configured, especially in forks or new PRs.

4. **Flaky Tests**: Tests that depend on external services (database, Redis, Supabase) or timing-sensitive operations (e.g., `wiring-check.yml` with `sleep 5`) fail intermittently.

5. **Heavy Checks on Every PR**: Performance audits (Lighthouse), integration audits, and wiring checks run on every PR, increasing failure surface area and runtime.

6. **Version/Environment Drift**: Different workflows use different Node/Python versions or action versions, causing inconsistent behavior.

7. **Test Setup Complexity**: Tests require database setup, Redis, Prisma generation, etc. If any step fails, the whole check fails.

8. **No Clear "Required" vs "Optional"**: All checks appear as required, but many are informational or non-blocking, creating noise.

9. **Matrix Strategy Issues**: `ci.yml` uses a matrix but has conditional logic that might skip jobs, causing dependency issues.

10. **Documentation/Guard Checks**: `docs-guard.yml` and other "guard" workflows might fail on legitimate changes, blocking PRs unnecessarily.

---

## B. DESIGN THE TARGET STATE – CLEAN, COHESIVE, ALWAYS-GREEN PIPELINE

### TARGET CODE PRINCIPLES

1. **Single Source of Truth**: Each concept (e.g., analytics, API routing, ML models) has one canonical module; no duplicate implementations.

2. **Clear Module Boundaries**: Backend organized by domain (e.g., `api/v1/`, `services/`, `ml/`), not by file type; frontend follows Next.js conventions strictly.

3. **No Circular Dependencies**: Import graph is acyclic; use dependency injection for cross-cutting concerns.

4. **Strict Type Safety**: TypeScript strict mode enabled; Python type hints required for public APIs; mypy passes with no ignores.

5. **Testability First**: Business logic separated from framework code; heavy dependencies (DB, external APIs) abstracted behind interfaces.

6. **Consistent Naming**: 
   - Python: `snake_case` for files/functions, `PascalCase` for classes
   - TypeScript: `camelCase` for functions/vars, `PascalCase` for components/types
   - API routes: RESTful, versioned (`/api/v1/...`)

7. **Dead Code Elimination**: No commented-out code, no unused imports, no legacy "archive" directories in active codebase.

8. **Documentation Co-location**: Code docs live with code; architecture docs in `docs/architecture/`; no scattered markdown files.

### TARGET CI CHECK SET

**Core PR Checks (Must Pass):**
1. **`lint`** (5 min)
   - Python: `ruff check` + `black --check`
   - TypeScript: `eslint` + `prettier --check`
   - Purpose: Code style consistency
   - Tools: ruff, black, eslint, prettier

2. **`type-check`** (3 min)
   - Python: `mypy backend/` (strict, no ignores)
   - TypeScript: `tsc --noEmit`
   - Purpose: Catch type errors before runtime
   - Tools: mypy, tsc

3. **`test-fast`** (10 min)
   - Python: `pytest tests/unit/` (unit tests only, no DB)
   - TypeScript: `jest` (unit tests, mocked dependencies)
   - Purpose: Fast feedback on logic errors
   - Tools: pytest, jest

4. **`build`** (5 min)
   - Frontend: `npm run build` (Next.js production build)
   - Purpose: Ensure code compiles and builds successfully
   - Tools: Next.js build

**Optional/Informational Checks (Non-Blocking):**
5. **`test-coverage`** (runs in parallel with test-fast)
   - Generate coverage reports, fail only if coverage drops significantly
   - Tools: pytest-cov, jest --coverage

6. **`bundle-size`** (runs in parallel)
   - Check bundle size, warn if exceeds threshold
   - Tools: Next.js bundle analyzer

**Scheduled Checks (Nightly/Weekly):**
7. **`test-integration`** (30 min, nightly)
   - Full integration tests with DB/Redis/Supabase
   - Tools: pytest, playwright

8. **`test-e2e`** (20 min, nightly)
   - End-to-end tests with real services
   - Tools: playwright

9. **`performance-audit`** (15 min, weekly)
   - Lighthouse, Core Web Vitals
   - Tools: Lighthouse CI

10. **`security-scan`** (10 min, weekly)
    - Dependency vulnerabilities, secret scanning
    - Tools: npm audit, trufflehog, etc.

### WHAT TO DISABLE / CONSOLIDATE

**Disable Entirely:**
- `orchestrate.yml`, `orchestrator.yml`, `remediation_orchestrator.yml` (consolidate into one if needed)
- `aurora-prime.yml`, `master-omega-prime.yml` (appear to be legacy sprint artifacts)
- `final_assurance_release.yml` (merge into deploy workflow)
- `project-governance.yml` (move to scheduled if needed)
- `pr-auto-comments.yml` (use GitHub native features)
- `on_failure_doctor.yml` (merge into main CI)

**Move to Scheduled Only:**
- `meta-audit.yml` → Keep scheduled, remove PR trigger
- `benchmarks.yml` → Scheduled only
- `integration-audit.yml` → Scheduled only (too heavy for PRs)
- `nightly-etl.yml` → Already scheduled, ensure no PR trigger
- `weekly-maint.yml` → Already scheduled
- `backup-automation.yml` → Scheduled only
- `system_health.yml`, `systems-metrics.yml`, `telemetry.yml` → Scheduled only

**Consolidate:**
- `ci.yml` + `pre-merge-checks.yml` + `code-quality.yml` → Single `ci.yml` with clear jobs
- `wiring-check.yml` → Merge into `test-integration` (scheduled)
- `preflight.yml` → Merge into `ci.yml` as optional check
- `docs-guard.yml` → Keep but make non-blocking (informational)
- `vercel-guard.yml` → Move to deploy workflow only
- `env-smoke-test.yml` + `env-validation.yml` → Single `env-check.yml` (scheduled)

**Result**: ~42 workflows → ~8 workflows (4 core PR checks + 4 scheduled/maintenance)

---

## C. CI WORKFLOWS – CONCRETE REWRITE PLAN

### CURRENT WORKFLOW INVENTORY

| Filename | Current Purpose | Action |
|----------|----------------|--------|
| `ci.yml` | Full matrix + doctor + lighthouse + monitors | **Rewrite** - Core CI |
| `pre-merge-checks.yml` | Type + coverage + UX + bundle | **Merge into ci.yml** |
| `code-quality.yml` | Python/TS lint + format + hygiene | **Merge into ci.yml** |
| `privacy-ci.yml` | Privacy lint + RLS + tests | **Keep** (path-based trigger) |
| `wiring-check.yml` | Connectivity/wiring tests | **Move to scheduled** |
| `ci-intent-tests.yml` | Architecture integrity + self-reflection | **Keep** (scheduled only) |
| `preflight.yml` | Preflight agent | **Merge into ci.yml** (optional) |
| `integration-audit.yml` | Lighthouse + Axe | **Scheduled only** |
| `deploy-main.yml` | Main deploy | **Keep** |
| `cd.yml` | Docker build/push | **Keep** |
| `canary-deploy.yml` | Canary deploy | **Keep** |
| `post_deploy_verify.yml` | Post-deploy verify | **Merge into deploy-main.yml** |
| `nightly-etl.yml` | Nightly ETL | **Keep** (scheduled) |
| `weekly-maint.yml` | Weekly maintenance | **Keep** (scheduled) |
| `meta-audit.yml` | Meta-architect audit | **Keep** (scheduled only) |
| `benchmarks.yml` | Performance benchmarks | **Scheduled only** |
| `backup-automation.yml` | Backup automation | **Scheduled only** |
| `system_health.yml` | System health | **Scheduled only** |
| `systems-metrics.yml` | Systems metrics | **Scheduled only** |
| `telemetry.yml` | Telemetry | **Scheduled only** |
| `orchestrate.yml` | Orchestration | **Delete** |
| `orchestrator.yml` | Orchestration | **Delete** |
| `remediation_orchestrator.yml` | Remediation | **Delete** |
| `agent-runner.yml` | Agent runner | **Review** (keep if needed) |
| `unified-agent.yml` | Unified agent | **Review** (keep if needed) |
| `aurora-prime.yml` | Legacy sprint | **Delete** |
| `master-omega-prime.yml` | Legacy sprint | **Delete** |
| `final_assurance_release.yml` | Final assurance | **Merge into deploy** |
| `project-governance.yml` | Governance | **Scheduled only** |
| `status_pages.yml` | Status pages | **Scheduled only** |
| `docs-guard.yml` | Docs tidy | **Keep** (non-blocking) |
| `docs-pdf.yml` | PDF gen | **Keep** (scheduled) |
| `vercel-guard.yml` | Vercel validation | **Move to deploy** |
| `env-smoke-test.yml` | Env smoke | **Consolidate** |
| `env-validation.yml` | Env validation | **Consolidate** |
| `bundle-analyzer.yml` | Bundle analysis | **Merge into ci.yml** |
| `openapi-generation.yml` | OpenAPI gen | **Keep** (on API changes) |
| `supabase_delta_apply.yml` | Supabase delta | **Keep** (on migration changes) |
| `data_quality.yml` | Data quality | **Scheduled only** |
| `on_failure_doctor.yml` | Failure doctor | **Merge into ci.yml** |
| `mobile.yml` | Mobile checks | **Review** (keep if needed) |
| `pr-auto-comments.yml` | PR comments | **Delete** |

### PROPOSED WORKFLOW SET

**1. `ci.yml` - Core CI (PR + Push to main)**
- **Triggers**: `pull_request`, `push` to `main`
- **Jobs**:
  - `lint` (Python + TypeScript)
  - `type-check` (Python + TypeScript)
  - `test-fast` (Unit tests, no DB)
  - `build` (Frontend production build)
  - `coverage` (Non-blocking, generates report)
  - `bundle-size` (Non-blocking, warns on threshold)
- **Matrix**: None (run sequentially for clarity)
- **Expected runtime**: ~20 minutes

**2. `ci-integration.yml` - Integration Tests (Scheduled + Manual)**
- **Triggers**: `schedule` (nightly), `workflow_dispatch`
- **Jobs**:
  - `test-integration` (Python + TypeScript integration tests with DB)
  - `test-e2e` (Playwright E2E tests)
  - `wiring-check` (Connectivity tests)
- **Expected runtime**: ~45 minutes

**3. `ci-performance.yml` - Performance & Security (Scheduled)**
- **Triggers**: `schedule` (weekly), `workflow_dispatch`
- **Jobs**:
  - `lighthouse` (Performance audit)
  - `security-scan` (Dependency + secret scanning)
  - `benchmarks` (Performance benchmarks)
- **Expected runtime**: ~30 minutes

**4. `deploy.yml` - Deployment (Push to main)**
- **Triggers**: `push` to `main`
- **Jobs**:
  - `build` (Frontend + Backend)
  - `migrate` (Database migrations)
  - `deploy-vercel` (Vercel production deploy)
  - `post-deploy-smoke` (Smoke tests)
  - `vercel-guard` (Vercel hardening validation)
- **Expected runtime**: ~15 minutes

**5. `privacy-ci.yml` - Privacy Checks (Path-based)**
- **Triggers**: `pull_request` (paths: `frontend/app/api/privacy/**`, `supabase/migrations/**privacy*.sql`, etc.)
- **Jobs**: Privacy lint + RLS check + privacy tests
- **Expected runtime**: ~10 minutes

**6. `nightly.yml` - Nightly Maintenance**
- **Triggers**: `schedule` (nightly)
- **Jobs**: ETL jobs + system health + metrics + telemetry
- **Expected runtime**: Variable

**7. `weekly.yml` - Weekly Maintenance**
- **Triggers**: `schedule` (weekly)
- **Jobs**: Meta-audit + data quality + backup + governance
- **Expected runtime**: Variable

**8. `docs.yml` - Documentation Checks (Non-blocking)**
- **Triggers**: `pull_request` (paths: `docs/**`)
- **Jobs**: Docs tidy + draft leakage check
- **Expected runtime**: ~2 minutes
- **Non-blocking**: Uses `continue-on-error: true`

### MERGE GUARDRAILS

**Required Checks (Must Pass for Merge):**
- `ci.yml` → `lint`
- `ci.yml` → `type-check`
- `ci.yml` → `test-fast`
- `ci.yml` → `build`
- `privacy-ci.yml` → All jobs (if privacy-related files changed)

**Optional Checks (Informational, Don't Block):**
- `ci.yml` → `coverage` (warns if drops)
- `ci.yml` → `bundle-size` (warns if exceeds threshold)
- `docs.yml` → All jobs (non-blocking)

**Branch Protection Rules:**
- Require status checks: `ci/lint`, `ci/type-check`, `ci/test-fast`, `ci/build`
- Require branches to be up to date before merging
- Do not allow force pushes to `main`

---

## D. CODE CLEANUP – CLARITY, COHESION, AND TESTABILITY

### CODE COHESION ISSUES

**1. Backend API Structure:**
- **Issue**: Root-level API files (`api_v1.py`, `api_v1_billing.py`, `api_v1_workflows.py`, `api_v1_workflow_automation.py`) vs `api/privacy.py`
- **Impact**: Unclear routing structure, hard to find endpoints
- **Files**: `backend/api_v1*.py` (4 files), `backend/api/privacy.py`

**2. Analytics Duplication:**
- **Issue**: `analytics.py`, `analytics_dashboard.py`, `services/insights_service.py`, `endpoints/insights.py`
- **Impact**: Unclear which module is canonical, potential code duplication
- **Files**: `backend/analytics.py`, `backend/analytics_dashboard.py`, `backend/services/insights_service.py`, `backend/endpoints/insights.py`

**3. ML API Duplication:**
- **Issue**: `ml/api.py` vs `ml/api_enhanced.py`
- **Impact**: Unclear which to use, potential duplication
- **Files**: `backend/ml/api.py`, `backend/ml/api_enhanced.py`

**4. Frontend Component Duplication:**
- **Issue**: `components/EmptyState.tsx` vs `components/ui/EmptyState.tsx`
- **Impact**: Import confusion, potential duplication
- **Files**: `frontend/components/EmptyState.tsx`, `frontend/components/ui/EmptyState.tsx`

**5. Test Organization:**
- **Issue**: Tests scattered across `tests/`, `frontend/tests/`, `tests/integration/`, `tests/unit/`, `tests/stress/`
- **Impact**: Hard to find tests, unclear test strategy
- **Files**: Multiple test directories

**6. Large Files:**
- **Issue**: `backend/main.py` is 4000+ lines
- **Impact**: Hard to maintain, test, and reason about
- **Files**: `backend/main.py`

**7. Naming Inconsistencies:**
- **Issue**: Mix of `snake_case` and `camelCase` in Python (should be `snake_case`)
- **Impact**: Style inconsistency, harder to read
- **Files**: Various Python files

**8. Legacy/Archive Code:**
- **Issue**: `docs/archive/2025/` contains old documentation that might reference outdated patterns
- **Impact**: Confusion about current vs historical patterns
- **Files**: `docs/archive/`

**9. Import Path Issues:**
- **Issue**: Some files use `sys.path.insert(0, ...)` to modify import paths
- **Impact**: Fragile imports, hard to reason about dependencies
- **Files**: `backend/main.py` (line 28)

**10. Configuration Scatter:**
- **Issue**: Config spread across `backend/config.py`, `backend/config_helpers.py`, `frontend/lib/env.ts`, `.env.example`
- **Impact**: Unclear where to find/config config
- **Files**: Multiple config files

### CODE CLEANUP TASKS

**1. Consolidate API Structure**
- **Files**: `backend/api_v1.py`, `backend/api_v1_billing.py`, `backend/api_v1_workflows.py`, `backend/api_v1_workflow_automation.py`
- **Action**: Move all API routes into `backend/api/v1/` directory structure:
  - `api/v1/__init__.py` (main router)
  - `api/v1/billing.py`
  - `api/v1/workflows.py`
  - `api/v1/workflow_automation.py`
- **Why**: Clear routing structure, easier to find endpoints, follows REST conventions

**2. Consolidate Analytics Modules**
- **Files**: `backend/analytics.py`, `backend/analytics_dashboard.py`, `backend/services/insights_service.py`, `backend/endpoints/insights.py`
- **Action**: 
  - Keep `services/insights_service.py` as canonical service
  - Move dashboard logic to `services/analytics_dashboard.py`
  - Move API endpoints to `api/v1/analytics.py`
  - Delete or merge `analytics.py` if redundant
- **Why**: Single source of truth, clear separation of concerns

**3. Resolve ML API Duplication**
- **Files**: `backend/ml/api.py`, `backend/ml/api_enhanced.py`
- **Action**: 
  - Review both files, determine which is current
  - Merge functionality if needed, delete deprecated one
  - Rename to `ml/api.py` if `api_enhanced.py` is the one to keep
- **Why**: Eliminate confusion, reduce maintenance burden

**4. Consolidate Frontend EmptyState**
- **Files**: `frontend/components/EmptyState.tsx`, `frontend/components/ui/EmptyState.tsx`
- **Action**: 
  - Review both, determine which is canonical
  - Move to `components/ui/EmptyState.tsx` (UI components belong in ui/)
  - Update all imports
- **Why**: Single component, clear location

**5. Reorganize Test Structure**
- **Files**: All test files
- **Action**: 
  - Python: `tests/unit/`, `tests/integration/`, `tests/e2e/` (move stress tests to integration)
  - TypeScript: `frontend/__tests__/unit/`, `frontend/__tests__/integration/`, `frontend/e2e/`
  - Root `tests/` for shared fixtures/utilities
- **Why**: Clear test organization, easier to run subsets

**6. Split `backend/main.py`**
- **Files**: `backend/main.py`
- **Action**: 
  - Extract route registration to `api/__init__.py`
  - Extract middleware setup to `middleware/__init__.py`
  - Keep only app initialization in `main.py`
- **Why**: Smaller files, easier to test and maintain

**7. Standardize Python Naming**
- **Files**: All Python files
- **Action**: 
  - Run `ruff check --select N` to find naming issues
  - Fix all `camelCase` functions/variables to `snake_case`
- **Why**: PEP 8 compliance, consistency

**8. Remove Legacy Archive References**
- **Files**: `docs/archive/2025/`
- **Action**: 
  - Move truly historical docs to `docs/archive/` (git-ignored or separate repo)
  - Delete or move current patterns/docs out of archive
- **Why**: Reduce confusion about current vs historical

**9. Fix Import Paths**
- **Files**: `backend/main.py` and any files using `sys.path.insert`
- **Action**: 
  - Remove `sys.path.insert` calls
  - Use proper package imports (`from backend.xxx import yyy`)
  - Ensure `backend/` is a proper package with `__init__.py`
- **Why**: Proper Python package structure, easier imports

**10. Consolidate Configuration**
- **Files**: `backend/config.py`, `backend/config_helpers.py`, `frontend/lib/env.ts`
- **Action**: 
  - Keep `backend/config.py` as single source for backend config
  - Keep `frontend/lib/env.ts` for frontend env vars
  - Delete `config_helpers.py` if redundant, or merge into `config.py`
- **Why**: Single source of truth for config

**11. Delete Dead Code**
- **Files**: Various
- **Action**: 
  - Run `ts-prune` for TypeScript unused exports
  - Run `vulture` or `dead` for Python dead code
  - Delete unused files/modules
- **Why**: Reduce maintenance burden, improve clarity

**12. Standardize Error Handling**
- **Files**: `backend/error_handling.py`, `backend/error_handling_helpers.py`
- **Action**: 
  - Consolidate into single `error_handling.py`
  - Ensure consistent error response format
- **Why**: Consistent error handling, easier to maintain

**13. Consolidate Monitoring**
- **Files**: `backend/monitoring.py`, `backend/logging_config.py`, `backend/logging_helpers.py`, `backend/sentry_config.py`
- **Action**: 
  - Keep `logging_config.py` for logging setup
  - Keep `sentry_config.py` for Sentry setup
  - Merge `monitoring.py` and `logging_helpers.py` if redundant
- **Why**: Clear separation of concerns

**14. Organize ML Modules**
- **Files**: `backend/ml/*.py` (many files)
- **Action**: 
  - Group related modules: `ml/models/`, `ml/training/`, `ml/prediction/`
  - Keep `ml/api.py` at root level
- **Why**: Better organization, easier to navigate

**15. Standardize Service Layer**
- **Files**: `backend/services/`, root-level service files
- **Action**: 
  - Move all service logic to `services/` directory
  - Ensure services don't import from `api/` (inversion of dependency)
- **Why**: Clear architecture, testability

**16. Fix Type Imports**
- **Files**: Python files with type hints
- **Action**: 
  - Use `from __future__ import annotations` to avoid string quotes
  - Ensure all public APIs have type hints
- **Why**: Better type checking, cleaner code

**17. Consolidate Database Access**
- **Files**: `backend/database.py`, `database/models.py`, `database/__init__.py`
- **Action**: 
  - Ensure single database session factory
  - Move models to `backend/models/` or keep in `database/models.py` (be consistent)
- **Why**: Single source of truth for DB access

**18. Remove Commented Code**
- **Files**: All files
- **Action**: 
  - Search for large commented blocks
  - Delete or convert to proper documentation
- **Why**: Reduce noise, improve readability

**19. Standardize Test Fixtures**
- **Files**: Test files
- **Action**: 
  - Create `tests/conftest.py` for shared pytest fixtures
  - Create `frontend/__tests__/setup.ts` for shared Jest setup
- **Why**: Reusable test utilities, consistent test setup

**20. Fix Circular Dependencies**
- **Files**: All files
- **Action**: 
  - Run `madge --circular` to find cycles
  - Refactor to break cycles (use dependency injection, move shared code)
- **Why**: Prevent import errors, improve testability

### TEST ARCHITECTURE FIXES

**1. Separate Fast vs Slow Tests**
- **Action**: 
  - Mark fast tests (unit, no DB) with `@pytest.mark.fast`
  - Mark slow tests (integration, E2E) with `@pytest.mark.slow`
  - CI runs fast tests on PRs, slow tests on schedule
- **Files**: All test files
- **Why**: Faster PR feedback, reduce CI costs

**2. Mock External Dependencies**
- **Action**: 
  - Use `unittest.mock` for Python, `jest.mock` for TypeScript
  - Mock database, Redis, Supabase, external APIs in unit tests
  - Only integration tests hit real services
- **Files**: Unit test files
- **Why**: Faster, more reliable tests

**3. Database Test Fixtures**
- **Action**: 
  - Create `tests/fixtures/db.py` with test database setup/teardown
  - Use transactions that rollback after each test
  - Provide factory functions for test data
- **Files**: `tests/conftest.py`, `tests/fixtures/`
- **Why**: Isolated tests, no test pollution

**4. Test Data Factories**
- **Action**: 
  - Create `tests/factories/user.py`, `tests/factories/workflow.py`, etc.
  - Use factory pattern for test data generation
- **Files**: `tests/factories/`
- **Why**: Reusable test data, easier to maintain

**5. E2E Test Isolation**
- **Action**: 
  - Each E2E test uses isolated test data (cleanup after)
  - Use test-specific database/tenant if possible
- **Files**: `frontend/e2e/`
- **Why**: Prevent test interference

**6. Test Coverage Thresholds**
- **Action**: 
  - Set coverage thresholds: 80% for new code, 70% for existing
  - Fail CI if coverage drops below threshold
  - Generate coverage reports
- **Files**: `pytest.ini`, `jest.config.js`
- **Why**: Maintain test quality

**7. Flaky Test Detection**
- **Action**: 
  - Mark known flaky tests with `@pytest.mark.flaky` or `jest.retryTimes()`
  - Track flaky tests in CI, fix or remove
- **Files**: Test files
- **Why**: Reliable CI

**8. Test Performance Monitoring**
- **Action**: 
  - Track test runtime in CI
  - Fail if tests exceed time limits
  - Optimize slow tests
- **Files**: CI workflows
- **Why**: Fast feedback

**9. Must-Have Core Tests**
- **Action**: Ensure these tests exist and pass:
  - Agent config loading (`test_config.py`)
  - Tool registry behavior (new test)
  - Workflow execution (`test_integration.py`)
  - API authentication/authorization (`test_security.py`)
  - Database migrations (`test_migrations.py` - new)
  - Privacy/RLS policies (`test_rls.py`)
  - Error handling (`test_error_handling.py` - new)
  - Rate limiting (`test_rate_limit.py` - new)
- **Files**: Various test files
- **Why**: Core functionality must be tested

**10. Test Documentation**
- **Action**: 
  - Document test structure in `docs/testing.md`
  - Explain how to run tests locally
  - Document test fixtures and factories
- **Files**: `docs/testing.md`
- **Why**: Onboarding, maintainability

---

## E. FIXING THE CHECKS – PRIORITIZED EXECUTION PLAN

### PHASED CI STABILIZATION PLAN

**Phase 1: Stop the Bleeding (Week 1)**

1. **Disable Non-Critical Workflows**
   - Disable `orchestrate.yml`, `orchestrator.yml`, `remediation_orchestrator.yml`
   - Disable `aurora-prime.yml`, `master-omega-prime.yml`
   - Disable `pr-auto-comments.yml`
   - Disable `final_assurance_release.yml` (merge logic into deploy)

2. **Make Heavy Checks Scheduled-Only**
   - Change `integration-audit.yml` to `schedule` only (remove PR trigger)
   - Change `benchmarks.yml` to `schedule` only
   - Change `meta-audit.yml` to `schedule` only (remove PR trigger)

3. **Fix Conditional Failures**
   - Remove `|| true` from `code-quality.yml` mypy check (make it fail properly)
   - Remove `continue-on-error: true` from `wiring-check.yml` (or move to scheduled)
   - Fix `pre-merge-checks.yml` to actually fail on errors (remove "warn for now" logic)

4. **Consolidate Overlapping Workflows**
   - Merge `pre-merge-checks.yml` into `ci.yml` (create single source of truth)
   - Merge `code-quality.yml` lint jobs into `ci.yml`
   - Remove duplicate type-check jobs

5. **Fix Secret Dependencies**
   - Make database-dependent checks optional or use test containers
   - Add `if: github.event_name != 'pull_request'` to checks requiring production secrets
   - Use placeholder/mock values for PR checks

6. **Standardize Action Versions**
   - Update all workflows to use `actions/setup-node@v4`, `actions/setup-python@v5`
   - Update all `actions/checkout@v4`
   - Pin action versions (remove `@latest`)

7. **Fix Matrix Strategy**
   - Remove conditional `if:` from `ci.yml` matrix job
   - Ensure all jobs have proper `needs:` dependencies
   - Simplify matrix (remove unnecessary dimensions)

8. **Make Docs Guard Non-Blocking**
   - Add `continue-on-error: true` to `docs-guard.yml`
   - Or move to scheduled only

9. **Fix Test Timeouts**
   - Add explicit `timeout-minutes` to all test jobs
   - Increase timeouts for integration tests
   - Add retry logic for flaky tests

10. **Add Required vs Optional Labels**
    - Use GitHub check annotations to mark optional checks
    - Document which checks are required in `CONTRIBUTING.md`

**Phase 2: Fix Core Checks (Week 2)**

1. **Create Unified `ci.yml`**
   - Combine lint, type-check, test-fast, build into single workflow
   - Remove overlaps with other workflows
   - Ensure all jobs have proper dependencies

2. **Fix Lint Checks**
   - Ensure `ruff` and `black` are configured consistently
   - Fix all lint errors in codebase
   - Add lint to pre-commit hooks

3. **Fix Type Checks**
   - Fix all mypy errors (remove `--ignore-missing-imports`)
   - Fix all TypeScript type errors
   - Add strict type checking

4. **Fix Unit Tests**
   - Ensure all unit tests pass consistently
   - Mock external dependencies
   - Fix flaky tests or mark as `@pytest.mark.flaky`

5. **Fix Build**
   - Ensure Next.js build passes
   - Fix any build-time errors
   - Add build cache

6. **Add Test Coverage**
   - Set up coverage reporting
   - Set coverage thresholds
   - Generate coverage reports in CI

7. **Fix Integration Tests**
   - Move to scheduled workflow
   - Use test containers for DB/Redis
   - Ensure tests are isolated

8. **Fix E2E Tests**
   - Move to scheduled workflow
   - Use test database
   - Add retry logic for flaky tests

9. **Add Bundle Size Check**
   - Add non-blocking bundle size check
   - Set reasonable thresholds
   - Warn on threshold exceedance

10. **Document CI Process**
    - Update `CONTRIBUTING.md` with CI process
    - Document which checks are required
    - Document how to run checks locally

**Phase 3: Reintroduce Heavier Checks (Week 3)**

1. **Add Scheduled Integration Tests**
   - Create `ci-integration.yml` for nightly integration tests
   - Include wiring checks, E2E tests
   - Ensure proper test isolation

2. **Add Scheduled Performance Checks**
   - Create `ci-performance.yml` for weekly performance audits
   - Include Lighthouse, benchmarks
   - Generate performance reports

3. **Add Security Scanning**
   - Add dependency vulnerability scanning
   - Add secret scanning
   - Schedule weekly security audits

4. **Monitor CI Health**
   - Track CI success rates
   - Identify and fix flaky tests
   - Optimize slow tests

5. **Gradual Rollout**
   - Start with non-blocking checks
   - Gradually make checks required
   - Monitor for issues

### DEFINITION OF DONE FOR GREEN CI

**Success Criteria:**
1. **All PRs to main run `ci.yml` with 4 core checks**: `lint`, `type-check`, `test-fast`, `build`
2. **Core checks are green >95% of the time** (excluding legitimate code issues)
3. **Flakiness is rare and tracked** (flaky tests marked and fixed within 1 week)
4. **CI runtime < 20 minutes** for PR checks
5. **No duplicate checks** (each check runs once per PR)
6. **Clear required vs optional** (required checks block merge, optional are informational)
7. **Local dev parity** (same checks run locally as in CI)
8. **Documentation updated** (`CONTRIBUTING.md` explains CI process)

**Metrics to Track:**
- CI success rate (target: >95%)
- Average CI runtime (target: <20 min for PRs)
- Flaky test rate (target: <5%)
- Number of failed checks per PR (target: 0 for legitimate code)

---

## F. CONCRETE CHANGES & PR STRUCTURE

### PR PLAN

**PR 1: Disable Legacy Workflows (Low Risk)**
- **Title**: "ci: disable legacy workflows and reduce noise"
- **Scope**: Disable/delete legacy workflows, move heavy checks to scheduled
- **Files**: 
  - Delete: `.github/workflows/orchestrate.yml`, `orchestrator.yml`, `remediation_orchestrator.yml`, `aurora-prime.yml`, `master-omega-prime.yml`, `pr-auto-comments.yml`, `final_assurance_release.yml`
  - Modify: `integration-audit.yml`, `benchmarks.yml`, `meta-audit.yml` (remove PR triggers)
- **Risk**: Low
- **Dependencies**: None
- **Merge**: First

**PR 2: Consolidate Core CI Workflows (Medium Risk)**
- **Title**: "ci: consolidate ci.yml, pre-merge-checks.yml, code-quality.yml into single workflow"
- **Scope**: Merge overlapping workflows into single `ci.yml`
- **Files**: 
  - Rewrite: `.github/workflows/ci.yml` (new unified workflow)
  - Delete: `.github/workflows/pre-merge-checks.yml`, `.github/workflows/code-quality.yml`
  - Modify: `.github/workflows/privacy-ci.yml` (keep, but ensure no overlap)
- **Risk**: Medium (might break existing PRs)
- **Dependencies**: PR 1
- **Merge**: Second

**PR 3: Fix Core Checks (High Risk)**
- **Title**: "ci: fix lint, type-check, and test failures"
- **Scope**: Fix all lint errors, type errors, and test failures
- **Files**: 
  - All Python files (fix lint/type errors)
  - All TypeScript files (fix lint/type errors)
  - All test files (fix failing tests)
  - Modify: `ruff.toml`, `pytest.ini`, `jest.config.js`, `tsconfig.json`
- **Risk**: High (large changeset)
- **Dependencies**: PR 2
- **Merge**: Third (after CI is stable)

**PR 4: Reorganize Backend API Structure (Medium Risk)**
- **Title**: "refactor: consolidate backend API structure"
- **Scope**: Move API files to `api/v1/` structure
- **Files**: 
  - Move: `backend/api_v1*.py` → `backend/api/v1/*.py`
  - Update: All imports referencing old paths
  - Update: `backend/main.py` (route registration)
- **Risk**: Medium (might break imports)
- **Dependencies**: PR 3
- **Merge**: Fourth

**PR 5: Consolidate Analytics and ML Modules (Medium Risk)**
- **Title**: "refactor: consolidate analytics and ML modules"
- **Scope**: Resolve duplication in analytics and ML modules
- **Files**: 
  - Consolidate: `backend/analytics.py`, `analytics_dashboard.py`, `services/insights_service.py`
  - Resolve: `backend/ml/api.py` vs `api_enhanced.py`
  - Update: All imports
- **Risk**: Medium
- **Dependencies**: PR 4
- **Merge**: Fifth

**PR 6: Reorganize Test Structure (Low Risk)**
- **Title**: "test: reorganize test structure and add fixtures"
- **Scope**: Reorganize tests, add shared fixtures
- **Files**: 
  - Reorganize: Move tests to `tests/unit/`, `tests/integration/`, `frontend/__tests__/`
  - Create: `tests/conftest.py`, `tests/fixtures/`, `tests/factories/`
  - Update: CI workflows (test paths)
- **Risk**: Low
- **Dependencies**: PR 3
- **Merge**: Sixth

**PR 7: Split main.py and Fix Imports (Medium Risk)**
- **Title**: "refactor: split main.py and fix import paths"
- **Scope**: Split large main.py, fix sys.path hacks
- **Files**: 
  - Split: `backend/main.py` → `main.py` + `api/__init__.py` + `middleware/__init__.py`
  - Fix: Remove `sys.path.insert` calls
  - Update: All imports
- **Risk**: Medium
- **Dependencies**: PR 4
- **Merge**: Seventh

**PR 8: Add Scheduled Integration and Performance Checks (Low Risk)**
- **Title**: "ci: add scheduled integration and performance checks"
- **Scope**: Create scheduled workflows for heavy checks
- **Files**: 
  - Create: `.github/workflows/ci-integration.yml`, `ci-performance.yml`
  - Modify: Move wiring-check, E2E tests to scheduled
- **Risk**: Low
- **Dependencies**: PR 2
- **Merge**: Eighth (can merge in parallel with others)

### LOCAL DEV & CI PARITY

**Single Command to Run CI Locally:**

Create `Makefile` or `package.json` script:

```makefile
# Makefile
.PHONY: ci
ci: lint type-check test-fast build

lint:
	cd backend && ruff check . && black --check .
	cd frontend && npm run lint && npm run format:check

type-check:
	cd backend && mypy backend/
	cd frontend && npm run type-check

test-fast:
	cd backend && pytest tests/unit/ -v
	cd frontend && npm test

build:
	cd frontend && npm run build
```

Or add to `package.json`:
```json
{
  "scripts": {
    "ci": "npm run lint && npm run type-check && npm run test && npm run build",
    "ci:backend": "cd backend && ruff check . && black --check . && mypy backend/ && pytest tests/unit/",
    "ci:frontend": "cd frontend && npm run lint && npm run type-check && npm test && npm run build"
  }
}
```

**Documentation:**
- Add section to `CONTRIBUTING.md`:
  ```markdown
  ## Running CI Checks Locally
  
  Before pushing, run the same checks that CI runs:
  
  ```bash
  # Run all CI checks
  npm run ci
  
  # Or run backend/frontend separately
  npm run ci:backend
  npm run ci:frontend
  ```
  
  This ensures your PR will pass CI checks.
  ```

**Pre-commit Hooks:**
- Update `.husky/pre-commit` to run:
  - `ruff check` + `black --check` (Python)
  - `eslint` + `prettier --check` (TypeScript)
  - Fast unit tests (optional, can skip with `--no-verify`)

---

## G. FINAL CHECKLIST – WHAT I SHOULD DO NEXT

### Phase 1: Stop the Bleeding (Week 1)

**Quick Wins (≤1 hour each):**
- [QW] Delete `.github/workflows/orchestrate.yml`
- [QW] Delete `.github/workflows/orchestrator.yml`
- [QW] Delete `.github/workflows/remediation_orchestrator.yml`
- [QW] Delete `.github/workflows/aurora-prime.yml`
- [QW] Delete `.github/workflows/master-omega-prime.yml`
- [QW] Delete `.github/workflows/pr-auto-comments.yml`
- [QW] Delete `.github/workflows/final_assurance_release.yml`
- [QW] Remove PR trigger from `.github/workflows/integration-audit.yml` (keep schedule only)
- [QW] Remove PR trigger from `.github/workflows/benchmarks.yml` (keep schedule only)
- [QW] Remove PR trigger from `.github/workflows/meta-audit.yml` (keep schedule only)
- [QW] Update all workflows to use `actions/setup-node@v4` (replace v3)
- [QW] Update all workflows to use `actions/setup-python@v5` (replace v4)
- [QW] Update all workflows to use `actions/checkout@v4` (replace v3)
- [QW] Add `continue-on-error: true` to `.github/workflows/docs-guard.yml` (make non-blocking)
- [QW] Remove `|| true` from `.github/workflows/code-quality.yml` mypy check
- [QW] Fix `.github/workflows/pre-merge-checks.yml` to actually fail on errors (remove "warn for now")

**Deep Work (≥2-3 hours each):**
- [DW] Merge `.github/workflows/pre-merge-checks.yml` into `.github/workflows/ci.yml`
- [DW] Merge `.github/workflows/code-quality.yml` lint jobs into `.github/workflows/ci.yml`
- [DW] Remove conditional `if:` from `.github/workflows/ci.yml` matrix job
- [DW] Fix `.github/workflows/ci.yml` job dependencies (add proper `needs:`)
- [DW] Create unified `.github/workflows/ci.yml` with lint, type-check, test-fast, build jobs
- [DW] Add `timeout-minutes` to all test jobs in workflows
- [DW] Fix secret dependencies (use test containers or make optional for PRs)

### Phase 2: Fix Core Checks (Week 2)

**Quick Wins:**
- [QW] Run `ruff check backend/` and fix all errors
- [QW] Run `black --check backend/` and fix formatting
- [QW] Run `npm run lint` in frontend and fix all errors
- [QW] Run `npm run type-check` in frontend and fix all type errors
- [QW] Run `mypy backend/` and fix all errors (remove `--ignore-missing-imports`)
- [QW] Add `ruff.toml` configuration (already exists, verify it's correct)
- [QW] Add `pytest.ini` configuration (already exists, verify it's correct)
- [QW] Add coverage thresholds to `pytest.ini` and `jest.config.js`

**Deep Work:**
- [DW] Fix all failing unit tests in `tests/unit/`
- [DW] Mock external dependencies in unit tests (DB, Redis, Supabase)
- [DW] Create `tests/conftest.py` with shared pytest fixtures
- [DW] Create `tests/fixtures/` directory with test data factories
- [DW] Mark slow tests with `@pytest.mark.slow` and fast tests with `@pytest.mark.fast`
- [DW] Update CI to run only fast tests on PRs
- [DW] Fix Next.js build errors
- [DW] Add build cache to CI workflows
- [DW] Create `Makefile` or update `package.json` with `ci` command
- [DW] Update `CONTRIBUTING.md` with CI process documentation

### Phase 3: Code Cleanup (Week 3)

**Quick Wins:**
- [QW] Delete `backend/analytics.py` if redundant (after consolidating)
- [QW] Delete `backend/ml/api_enhanced.py` if `api.py` is canonical (or vice versa)
- [QW] Delete `frontend/components/EmptyState.tsx` if `ui/EmptyState.tsx` exists (or vice versa)
- [QW] Run `ts-prune` and remove unused exports
- [QW] Run `vulture` or `dead` on Python code and remove dead code
- [QW] Remove commented-out code blocks
- [QW] Fix Python naming (run `ruff check --select N` and fix)

**Deep Work:**
- [DW] Move `backend/api_v1*.py` files to `backend/api/v1/` structure
- [DW] Update all imports after API reorganization
- [DW] Consolidate `backend/analytics.py`, `analytics_dashboard.py`, `services/insights_service.py`
- [DW] Resolve `backend/ml/api.py` vs `api_enhanced.py` duplication
- [DW] Split `backend/main.py` into smaller modules
- [DW] Remove `sys.path.insert` calls, fix import paths
- [DW] Reorganize test structure (`tests/unit/`, `tests/integration/`, `frontend/__tests__/`)
- [DW] Consolidate configuration files (`backend/config.py`, `config_helpers.py`)
- [DW] Fix circular dependencies (run `madge --circular` and refactor)

### Phase 4: Reintroduce Heavy Checks (Week 4)

**Quick Wins:**
- [QW] Create `.github/workflows/ci-integration.yml` for scheduled integration tests
- [QW] Create `.github/workflows/ci-performance.yml` for scheduled performance checks
- [QW] Move `wiring-check.yml` logic to `ci-integration.yml`
- [QW] Move E2E tests to scheduled workflow
- [QW] Add security scanning to `ci-performance.yml`

**Deep Work:**
- [DW] Set up test containers for integration tests (Postgres, Redis)
- [DW] Ensure integration tests are isolated (cleanup after each test)
- [DW] Add retry logic for flaky E2E tests
- [DW] Set up performance monitoring (track CI runtime, success rates)
- [DW] Document flaky tests and create issues to fix them

---

## SUMMARY

**Current State:**
- 42 workflows, many overlapping and redundant
- Multiple checks running same thing (lint, type-check, tests)
- Many workflows use `continue-on-error: true` or `|| true`, masking failures
- Heavy checks (Lighthouse, integration audits) run on every PR
- Code structure has duplication and inconsistencies

**Target State:**
- ~8 workflows (4 core PR checks + 4 scheduled/maintenance)
- Single `ci.yml` with lint, type-check, test-fast, build
- Clear required vs optional checks
- Heavy checks moved to scheduled
- Code structure clean and consistent

**Execution Plan:**
- Phase 1 (Week 1): Disable legacy workflows, consolidate CI
- Phase 2 (Week 2): Fix core checks (lint, type, tests)
- Phase 3 (Week 3): Code cleanup (structure, duplication)
- Phase 4 (Week 4): Reintroduce heavy checks (scheduled)

**Success Metrics:**
- CI success rate >95%
- CI runtime <20 min for PRs
- Flaky test rate <5%
- 0 failed checks per PR (for legitimate code)

---

**Next Steps:**
1. Review this plan with team
2. Start with Phase 1 (quick wins)
3. Create PRs following the PR plan
4. Monitor CI health and adjust as needed
