> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Trust Layer Action Plan

**Generated:** 2025-01-XX  
**Purpose:** Sequenced implementation plan with owners and ETA.

## Execution Order

### Step 1: Audit & Documentation (✅ Complete)
- [x] Create inventory report (`00_inventory.md`)
- [x] Create gap matrix (`01_gap_matrix.md`)
- [x] Create action plan (`02_action_plan.md`)

**Owner:** AI Assistant  
**ETA:** Day 1

### Step 2: Feature Flags & Core Config
- [ ] Create `config/flags.trust.json`
- [ ] Document flag usage in README

**Owner:** AI Assistant  
**ETA:** Day 1

### Step 3: Trust Documentation Artifacts
- [ ] Create `docs/trust/TRUST.md` (product promises, data map, consent)
- [ ] Create `docs/trust/PRIVACY_POLICY_DRAFT.md` (GDPR/PIPEDA aligned)
- [ ] Create `docs/trust/SECURITY.md` (access control, encryption, audit)
- [ ] Create `docs/trust/STATUS.md` (incident comms, maintenance windows)
- [ ] Create `docs/trust/A11Y_REPORT_TEMPLATE.md` (WCAG 2.2 AA checklist)
- [ ] Create `docs/trust/SLO_SLA.md` (SLOs, error budgets, escalation)
- [ ] Create `docs/trust/I18N_READINESS.md` (i18n strategy, RTL notes)

**Owner:** AI Assistant  
**ETA:** Day 1-2

### Step 4: Database Migration
- [ ] Create `supabase/migrations/2025-11-05_trust_audit.sql`
  - Create `audit_log` table
  - Enable RLS
  - Create owner-only policy
  - Ensure online-safe (no CONCURRENTLY in transaction)

**Owner:** AI Assistant  
**ETA:** Day 1

### Step 5: Trust UI Pages
- [ ] Create `frontend/app/trust/page.tsx` (trust center landing)
- [ ] Create `frontend/app/status/page.tsx` (status page)
- [ ] Create `frontend/app/help/page.tsx` (help center)
- [ ] Create `frontend/app/account/audit-log/page.tsx` (personal audit log)
- [ ] Create `frontend/app/account/export/page.tsx` (export data page)

**Owner:** AI Assistant  
**ETA:** Day 1-2

### Step 6: API Endpoints
- [ ] Create `frontend/app/api/audit/me/route.ts` (personal audit log API)
- [ ] Create `frontend/app/api/feedback/route.ts` (feedback submission)

**Owner:** AI Assistant  
**ETA:** Day 1

### Step 7: Layout & Accessibility Enhancements
- [ ] Patch `frontend/app/layout.tsx`:
  - Add prefers-reduced-motion support
  - Add language attribute logic (i18n prep)
  - Add direction attribute (RTL prep)
  - Wrap in markers

**Owner:** AI Assistant  
**ETA:** Day 1

### Step 8: Footer Trust Links
- [ ] Patch `frontend/app/layout.tsx` footer:
  - Add Privacy · Status · Help · Export Data links
  - Gate behind feature flags
  - Wrap in markers

**Owner:** AI Assistant  
**ETA:** Day 1

### Step 9: CI Integration
- [ ] Patch `.github/workflows/deploy-main.yml`:
  - Add Trust Smoke checks
  - Verify trust artifacts exist
  - Wrap in markers

**Owner:** AI Assistant  
**ETA:** Day 1

### Step 10: CHANGELOG & Rollback
- [ ] Update `CHANGELOG.md` with trust layer additions
- [ ] Create rollback notes (how to disable flags, revert migrations)

**Owner:** AI Assistant  
**ETA:** Day 1

## Acceptance Criteria

✅ All documentation files created in `docs/trust/`  
✅ Feature flags config created (`config/flags.trust.json`)  
✅ Trust pages created (`/trust`, `/status`, `/help`, `/account/audit-log`)  
✅ Audit log table created with RLS  
✅ API endpoints created (`/api/audit/me`, `/api/feedback`)  
✅ Layout patched with accessibility features (markers)  
✅ Footer patched with trust links (markers)  
✅ CI extended with Trust Smoke checks  
✅ No existing files overwritten  
✅ All patches wrapped in markers  
✅ CHANGELOG updated  
✅ Rollback notes created

## Rollback Plan

If issues arise:

1. **Disable flags:** Set all flags in `config/flags.trust.json` to `false`
2. **Revert migrations:** Drop `audit_log` table if needed
   ```sql
   DROP TABLE IF EXISTS public.audit_log CASCADE;
   ```
3. **Remove routes:** Delete new page files if needed
4. **Remove CI checks:** Remove Trust Smoke step from workflow
5. **Revert layout patches:** Remove marker blocks from `layout.tsx`

## Dependencies

- Next.js 14+ (app router)
- Supabase (for migrations)
- Existing CRUX core
- Existing privacy infrastructure

## Testing Checklist

- [ ] Trust center page renders (`/trust`)
- [ ] Status page renders (`/status`)
- [ ] Help page renders (`/help`)
- [ ] Audit log page loads (`/account/audit-log`)
- [ ] Audit log API returns data (`/api/audit/me`)
- [ ] Feedback API accepts submissions (`/api/feedback`)
- [ ] Footer links appear when flags enabled
- [ ] Reduced motion respects user preference
- [ ] Skip link works
- [ ] CI Trust Smoke checks pass

## Notes

- All features gated behind flags (default OFF)
- Non-destructive: Use markers only
- Database migrations are online-safe
- Single PR with complete changelog
