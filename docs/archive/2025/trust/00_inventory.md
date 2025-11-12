> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Trust Layer Inventory

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive inventory of existing trust-related artifacts, routes, workflows, and CI checks.

## Current State

### Documentation
- ✅ `docs/privacy/monitoring-policy.md` - Privacy-first monitoring policy
- ✅ `docs/security/headers.md` - Security headers guide
- ✅ `docs/privacy/data-inventory.md` - Data inventory (if exists)
- ✅ `docs/privacy/threat-model.md` - Threat model (if exists)
- ✅ `docs/privacy/self-audit-checklist.md` - Self-audit checklist
- ⚠️ Missing: Comprehensive trust center documentation
- ⚠️ Missing: Privacy policy draft aligned to GDPR/PIPEDA
- ⚠️ Missing: Status page documentation
- ⚠️ Missing: Accessibility report template
- ⚠️ Missing: SLO/SLA documentation
- ⚠️ Missing: i18n readiness guide

### Routes/Pages
- ✅ `frontend/app/privacy/policy/page.tsx` - Privacy policy page (exists)
- ✅ `frontend/app/dashboard/trust/page.tsx` - Trust dashboard (Guardian-focused)
- ⚠️ Missing: `/trust` - Trust center landing page
- ⚠️ Missing: `/status` - Status page
- ⚠️ Missing: `/help` - Help center
- ⚠️ Missing: `/account/audit-log` - Personal audit log viewer
- ⚠️ Missing: `/account/export` - Data export page

### API Endpoints
- ✅ `frontend/app/api/privacy/export/route.ts` - Data export API
- ✅ `frontend/app/api/privacy/delete/route.ts` - Data deletion API
- ✅ `frontend/app/api/guardian/*` - Guardian trust APIs
- ⚠️ Missing: `/api/audit/me` - Personal audit log API
- ⚠️ Missing: `/api/feedback` - Feedback submission API

### Database Schema
- ✅ `database/models.py` - Contains User, Event, and other models
- ⚠️ Missing: `audit_log` table in Supabase schema
- ⚠️ Missing: Migration for audit_log with RLS policies

### UI Components
- ✅ `frontend/app/layout.tsx` - Has skip-link (accessibility)
- ✅ Footer exists in layout.tsx (basic)
- ⚠️ Missing: Footer links to trust resources (Privacy, Status, Help, Export)
- ⚠️ Missing: Reduced motion support (prefers-reduced-motion)
- ⚠️ Missing: i18n language/direction attributes

### Feature Flags
- ✅ `config/flags.crux.json` - CRUX feature flags
- ⚠️ Missing: `config/flags.trust.json` - Trust feature flags

### CI/CD
- ✅ `.github/workflows/deploy-main.yml` - Main deployment workflow
- ✅ `.github/workflows/privacy-ci.yml` - Privacy CI checks
- ⚠️ Missing: Trust Smoke checks in deploy workflow

### Access Control & Security
- ✅ RLS policies exist (see migrations)
- ✅ Privacy HUD component exists
- ✅ Consent banner exists
- ✅ MFA endpoints exist (`/api/privacy/mfa/*`)
- ⚠️ Missing: Comprehensive audit logging for user actions
- ⚠️ Missing: Admin controls UI surface
- ⚠️ Missing: SSO/MFA toggle UI

### Internationalization
- ⚠️ Missing: i18n infrastructure
- ⚠️ Missing: Language detection/switching
- ⚠️ Missing: RTL support preparation
- ⚠️ Missing: Date/time localization

### Reliability & SLOs
- ⚠️ Missing: Documented SLOs/SLAs
- ⚠️ Missing: Error budget tracking
- ⚠️ Missing: Incident communication documentation
- ⚠️ Missing: Status page backend/API

### Product/UX Research
- ⚠️ Missing: Feedback collection endpoint
- ⚠️ Missing: NPS/CSAT integration
- ⚠️ Missing: In-app feedback widgets

### Partnerships/Integrators
- ⚠️ Missing: API portal documentation
- ⚠️ Missing: Rate limit disclosure
- ⚠️ Missing: Versioning documentation
- ⚠️ Missing: Webhook documentation

### Finance/Billing
- ⚠️ Missing: Pricing clarity documentation
- ⚠️ Missing: Usage limits documentation
- ⚠️ Missing: Abuse/fair-use guardrails documentation

## Summary

**Strengths:**
- Privacy monitoring policy exists
- Security headers guide exists
- Privacy API endpoints exist (export, delete)
- Guardian trust dashboard exists
- Basic accessibility (skip-link) exists

**Gaps:**
- No centralized trust center documentation
- No GDPR/PIPEDA-aligned privacy policy draft
- No status page or incident communication docs
- No audit log table or personal audit viewer
- No feedback collection mechanism
- No SLO/SLA documentation
- No i18n infrastructure
- Feature flags for trust features missing
- Footer lacks trust resource links
- CI lacks trust smoke checks

## Next Steps

See `01_gap_matrix.md` for detailed stakeholder gap analysis and `02_action_plan.md` for sequenced fixes.
