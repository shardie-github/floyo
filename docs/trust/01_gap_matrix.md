# Trust Layer Gap Matrix

**Generated:** 2025-01-XX  
**Purpose:** Stakeholder coverage analysis (0-3 scale) and prioritized fixes.

## Coverage Scoring

| Stakeholder | Current Score | Gap | Priority Fix |
|------------|---------------|-----|--------------|
| **End Users** | 2/3 | Missing: Trust center landing, help center, status page visibility | High |
| **Customer Support** | 1/3 | Missing: Help center, diagnostic tools, recovery flows | Medium |
| **Security & Compliance** | 2/3 | Missing: Audit log table, DPIA/TRA docs, data map | High |
| **Legal & Privacy** | 2/3 | Missing: GDPR/PIPEDA policy draft, DSR workflows, retention disclosure | High |
| **Accessibility** | 1/3 | Missing: WCAG 2.2 AA checklist, reduced motion, i18n prep | Medium |
| **Reliability & SRE** | 1/3 | Missing: SLO/SLA docs, error budgets, incident comms | Medium |
| **Product/UX Research** | 0/3 | Missing: Feedback API, NPS/CSAT, experiments | Low |
| **Partnerships** | 1/3 | Missing: API portal, rate limit disclosure, versioning | Low |
| **Finance/Billing** | 1/3 | Missing: Pricing clarity, limits docs, abuse guardrails | Low |
| **Admins** | 2/3 | Missing: Audit log viewer, admin controls UI, SSO/MFA toggles | Medium |
| **Localization** | 0/3 | Missing: i18n keys, date/time/RTL readiness | Low |
| **Governance** | 1/3 | Missing: Model cards, deprecation policy, changelog | Low |

## Detailed Gap Analysis

### End Users (Score: 2/3)
**What exists:**
- ✅ Privacy policy page
- ✅ Trust dashboard (Guardian)
- ✅ Privacy settings page
- ✅ Data export API

**What's missing:**
- ❌ Trust center landing page (`/trust`)
- ❌ Help center (`/help`)
- ❌ Status page (`/status`)
- ❌ Footer links to trust resources
- ❌ Personal audit log viewer

**Fix priority:** High  
**Impact:** Trust and transparency visible to all users

### Customer Support & Success (Score: 1/3)
**What exists:**
- ✅ Privacy API endpoints for troubleshooting

**What's missing:**
- ❌ Help center with FAQs
- ❌ Diagnostic tools/routes
- ❌ Recovery flow documentation
- ❌ Support triage workflows

**Fix priority:** Medium  
**Impact:** Reduces support burden, improves self-service

### Security & Compliance (Score: 2/3)
**What exists:**
- ✅ Security headers guide
- ✅ Privacy monitoring policy
- ✅ RLS policies
- ✅ Threat model (if exists)

**What's missing:**
- ❌ Audit log table (database)
- ❌ Personal audit log viewer (UI)
- ❌ DPIA/TRA documentation
- ❌ Comprehensive data map
- ❌ SOC2 prep documentation

**Fix priority:** High  
**Impact:** Critical for compliance readiness

### Legal & Privacy (Score: 2/3)
**What exists:**
- ✅ Privacy monitoring policy
- ✅ Data export API
- ✅ Data deletion API
- ✅ Consent banner

**What's missing:**
- ❌ GDPR/PIPEDA-aligned privacy policy draft
- ❌ DSR (Data Subject Rights) workflow docs
- ❌ Data retention disclosure
- ❌ Lawful basis documentation
- ❌ International transfers documentation

**Fix priority:** High  
**Impact:** Legal compliance requirement

### Accessibility & Inclusive Design (Score: 1/3)
**What exists:**
- ✅ Skip-to-content link
- ✅ Basic semantic HTML

**What's missing:**
- ❌ WCAG 2.2 AA checklist
- ❌ Reduced motion support (`prefers-reduced-motion`)
- ❌ i18n language/direction attributes
- ❌ Accessibility testing report template
- ❌ Screen reader testing notes

**Fix priority:** Medium  
**Impact:** Legal requirement in some jurisdictions, inclusive design

### Reliability & SRE (Score: 1/3)
**What exists:**
- ✅ Basic monitoring infrastructure

**What's missing:**
- ❌ Documented SLOs/SLAs
- ❌ Error budget tracking
- ❌ Incident communication documentation
- ❌ Status page backend/API
- ❌ On-call runbooks

**Fix priority:** Medium  
**Impact:** Operational transparency, user trust

### Product/UX Research (Score: 0/3)
**What exists:**
- None

**What's missing:**
- ❌ Feedback submission API
- ❌ NPS/CSAT integration
- ❌ In-app feedback widgets
- ❌ Experiment tracking

**Fix priority:** Low  
**Impact:** Product improvement loops

### Partnerships/Integrators (Score: 1/3)
**What exists:**
- ✅ API endpoints exist

**What's missing:**
- ❌ API portal documentation
- ❌ Rate limit disclosure
- ❌ Versioning documentation
- ❌ Webhook documentation
- ❌ SDK documentation

**Fix priority:** Low  
**Impact:** Partnership enablement

### Finance/Billing (Score: 1/3)
**What exists:**
- Basic billing infrastructure (implied)

**What's missing:**
- ❌ Pricing clarity documentation
- ❌ Usage limits documentation
- ❌ Abuse/fair-use guardrails
- ❌ Billing transparency

**Fix priority:** Low  
**Impact:** User trust, billing clarity

### Admins (Score: 2/3)
**What exists:**
- ✅ Organization models
- ✅ RBAC infrastructure

**What's missing:**
- ❌ Audit log viewer UI
- ❌ Admin controls UI surface
- ❌ SSO/MFA toggle UI
- ❌ Export/import workflows

**Fix priority:** Medium  
**Impact:** Admin efficiency, security

### Localization (Score: 0/3)
**What exists:**
- None

**What's missing:**
- ❌ i18n key extraction strategy
- ❌ Date/time formatting
- ❌ RTL support preparation
- ❌ Translation fallbacks

**Fix priority:** Low  
**Impact:** International expansion readiness

### Governance (Score: 1/3)
**What exists:**
- ✅ CHANGELOG.md exists
- ✅ Various documentation

**What's missing:**
- ❌ Model cards for AI features
- ❌ Deprecation policy
- ❌ Versioning strategy
- ❌ Governance framework docs

**Fix priority:** Low  
**Impact:** Long-term maintainability

## Prioritized Fix Plan

### Phase 1: High Priority (Legal/Compliance)
1. Create GDPR/PIPEDA privacy policy draft
2. Create audit_log table + migration
3. Create personal audit log viewer
4. Create trust center landing page
5. Add footer trust links

### Phase 2: Medium Priority (UX/Operations)
1. Create status page + documentation
2. Create help center page
3. Add accessibility features (reduced motion, i18n prep)
4. Create SLO/SLA documentation
5. Create admin audit log viewer

### Phase 3: Low Priority (Nice-to-Have)
1. Create feedback API
2. Create i18n readiness guide
3. Create API portal docs
4. Create pricing/limits docs

## Implementation Notes

- All new features behind `flags.trust.json` (default OFF)
- Non-destructive: Use markers `[STAKE+TRUST:BEGIN:topic]` / `[STAKE+TRUST:END:topic]`
- Database migrations must be online-safe (no CONCURRENTLY in transaction)
- Single PR with CHANGELOG and rollback notes
