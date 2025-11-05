# Changelog

## [Unreleased] - 2025-11-05

### Added (STAKE+TRUST Trust Layer)
- **Trust Documentation**: Added comprehensive trust documentation (`docs/trust/TRUST.md`, `PRIVACY_POLICY_DRAFT.md`, `SECURITY.md`, `STATUS.md`, `A11Y_REPORT_TEMPLATE.md`, `SLO_SLA.md`, `I18N_READINESS.md`)
- **Trust Pages**: Added trust center (`/trust`), status page (`/status`), help center (`/help`), audit log viewer (`/account/audit-log`), and data export page (`/account/export`)
- **Audit Logging**: Added `audit_log` table with RLS policies (`supabase/migrations/2025-11-05_trust_audit.sql`)
- **API Endpoints**: Added `/api/audit/me` for personal audit log and `/api/feedback` for feedback submission
- **Feature Flags**: Added trust feature flags (`config/flags.trust.json`) - all features default OFF
- **Accessibility**: Added i18n language/direction attributes and reduced motion support preparation
- **Footer**: Added trust resource links (Privacy, Status, Help, Export Data) to footer
- **CI/CD**: Added Trust Smoke checks to deploy workflow
- **Audit Reports**: Added stakeholder gap analysis (`docs/trust/00_inventory.md`, `01_gap_matrix.md`, `02_action_plan.md`)

## [Unreleased] - 2025-11-05

### Added (CRUX+HARDEN Upgrade)
- **Security**: Added CSP headers support (`frontend/app/headers.ts`) - disabled by default
- **Performance**: Added rate limiting utility (`frontend/lib/utils/rate-limit.ts`)
- **Observability**: Added structured logging utility (`frontend/lib/obs/log.ts`)
- **Performance**: Added optional bundle analyzer support (conditional on `ANALYZE=true`)
- **Database**: Added online-safe concurrent indexes for events and signals tables
- **Configuration**: Added feature flags system (`config/flags.crux.json`)
- **CI/CD**: Added smoke tests for hardened utilities in deploy workflow
- **Reliability**: Added retry utility with exponential backoff (`frontend/lib/utils/retry.ts`)
- **Security**: Added edge function guardrails (`supabase/functions/_shared/guardrails.ts`)
- **Security**: Added RLS verification script (`scripts/verify-rls.ts`)
- **Security**: Added secrets audit script (`scripts/audit-secrets.ts`)
- **Documentation**: Added next steps roadmap (`docs/upgrade/NEXT_STEPS.md`)
- **API**: Added ingest API route with guardrails (`frontend/app/api/ingest/route.ts`)
- **Workflow**: Added queue shim for workflow runs (`frontend/lib/crux/queue.ts`)
- **Workflow**: Added workflow executor with retries (`frontend/lib/crux/executor.ts`)
- **Observability**: Added Sentry integration (`frontend/lib/obs/sentry.ts`)
- **Observability**: Added metrics collection (`frontend/lib/obs/metrics.ts`)
- **Performance**: Added KV-based rate limiter (`frontend/lib/utils/rate-limit-kv.ts`)
- **Security**: Enhanced CSP headers with nonce and allowlist support
- **Database**: Added workflow_runs table migration (`supabase/migrations/20251105_workflow_runs.sql`)
- **Monitoring**: Added performance dashboard (`frontend/app/admin/performance/page.tsx`)
- **Scripts**: Added migration concurrent helper (`scripts/migrate-concurrent.sh`)
- **CI/CD**: Added bundle analyzer workflow (`.github/workflows/bundle-analyzer.yml`)
- **Documentation**: Added API rate limiting guide (`docs/api/rate-limiting.md`)
- **Documentation**: Added security headers guide (`docs/security/headers.md`)
- **Documentation**: Added observability guide (`docs/ops/observability.md`)
- **Edge Functions**: Hardened analyze-patterns and generate-suggestions with guardrails

### Changed
- **Build**: Patched `next.config.js` with bundle analyzer wrapper (non-destructive, marker-based)
- **CI**: Patched `.github/workflows/deploy-main.yml` with smoke test step (non-destructive)

### Security
- Added security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- CSP headers available but disabled by default (set `flags.crux.csp_headers=true` to enable)
- Rate limiting utility available for API endpoints (enabled by default)

### Documentation
- Added upgrade guide: `docs/upgrade/README.md`
- Added preflight scan plans: `docs/upgrade/00_inventory.plan.md`, `01_diffs.plan.md`, `02_risks.plan.md`

### Notes
- All changes are non-destructive and feature-flagged
- Backup files created: `.bak.20251105_043451`
- Migration uses `CREATE INDEX CONCURRENTLY` for zero-downtime
- Rollback instructions available in `docs/upgrade/README.md`

## All Changes

* Merge pull request #23 from shardie-github/cursor/complete-development-phases-1-4-6bc6 (adc0ef6)
* feat: Implement comprehensive performance monitoring (adf5b0e)
* Refactor: Implement core optimizations and security enhancements (811f609)
* feat: Implement monitoring and notifications (75bbc2c)
* Merge pull request #22 from shardie-github/cursor/complete-outstanding-roadmap-items-bcd0 (970e92f)
* feat: Add sample data generation and enhance export/delete (84ea630)
* feat: Implement data retention and email services (204bf63)
* Merge pull request #21 from shardie-github/cursor/complete-and-connect-roadmap-and-next-steps-9b01 (e7da05a)
* feat: Implement security features and improve frontend (4e39886)
* Add roadmap document with remaining tasks and estimates (743a5c0)
* feat: Implement growth, monetization, and enterprise features (3c20c27)
* Merge pull request #20 from shardie-github/cursor/fix-critical-security-vulnerabilities-35f0 (0aad094)
* feat: Implement analytics, onboarding, and workflow builder (2b2cab7)
* feat: Add investor suite docs and market fit scoring (e9b5769)
* Refactor: Improve security and configuration handling (641a0ce)
* Merge pull request #19 from shardie-github/cursor/final-assurance-and-gated-release-6f9c (893a42e)
* feat: Add release workflow and governance files (74f37d8)
* feat: Add investor remediation workflow and audits (93078e3)
* Merge pull request #17 from shardie-github/cursor/automated-project-governance-and-self-checks-c6d4 (0c13c1c)
* feat: Add feature flag kill-switch and API deprecation docs (124f65a)
* feat: Add project governance orchestration workflow (02f47ef)
* Merge: Resolve conflicts - keep living architecture implementation (2f5e012)
* Merge: Transform audit insights into living architecture (54d5bd9)
* feat: Implement living architecture and self-healing system (febe1a7)
* Merge pull request #15 from shardie-github/cursor/transform-audit-insights-into-living-architecture-9404 (456eba6)
* feat: Implement living architecture system (c206f60)
* Merge pull request #14 from shardie-github/cursor/codebase-coherence-and-resilience-audit-e772 (99a0a26)
* feat: Implement security and resilience improvements (90fa451)
* Refactor: Improve config validation and security guardrails (7fa0aad)
* Merge pull request #13 from shardie-github/cursor/codebase-coherence-and-resilience-audit-0674 (df81b2f)
* feat: Implement centralized config, resilience, and missing endpoints (b8f4a81)
* feat: Add audit documentation for configuration and contracts (4db51d2)
* Merge pull request #12 from shardie-github/cursor/enhance-project-reliability-growth-and-accessibility-a9db (7afa2fd)
* Refactor: Enhance CI, connectors, fraud detection, and i18n (2405837)
* Merge pull request #11 from shardie-github/cursor/nomad-grand-continuity-and-completion-audit-2a40 (1d56f15)
* feat: Add continuity audit reports and scripts (577b3d6)
* Merge pull request #10 from shardie-github/cursor/verify-nomad-monorepo-subsystem-connectivity-9452 (6f6cd1f)
* feat: Implement wiring harness and CI checks (77f3f2c)
* Implement stepback baseline and reliability features (#9) (f73dcc8)
* Complete all priority issues and optimize (#8) (795f9da)
* feat: Implement auth, security, and health checks (#7) (f525ab1)
* feat: Implement organizations, workflows, and integrations (#6) (02885af)
* feat: Implement caching, rate limiting, and pagination (#5) (035c8ca)
* feat: Implement core features and CI/CD pipelines (#4) (3cae163)
* Merge pull request #3 from shardie-github/cursor/setup-application-infrastructure-and-dependencies-1f50 (0bcdb3e)
* Add concise roadmap document (3d3e103)
* feat: Implement full-stack Floyo application (8698ced)
* Merge pull request #2 from shardie-github/cursor/complete-todo-md-file-84ef (4b4999d)
* feat: Implement core floyo functionality and CLI commands (242e695)
* Review and build project files (#1) (dc381e4)
* Add files via upload (08b4081)
* Initial commit (094394c)