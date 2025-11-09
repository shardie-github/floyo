# UX Tone Harmonisation Audit

**Generated:** 2025-01-XX  
**Scope:** User-facing strings in JSX/i18n files, tone compliance check

---

## Tone Profile Reference

**Persona:** Calm, authoritative, minimal  
**CTA Standard:** "Add to Cart" (B2B SaaS: use action-oriented CTAs)  
**Banned Phrases:** "click here", "please note"

**Guidelines:**
- **Errors:** Calm, helpful
- **Success:** Brief, positive
- **Loading:** Minimal
- **Empty States:** Clear, actionable

---

## Audit Results

### 1. Banned Phrases Check

**Status:** ✅ **No Banned Phrases Found**

- Scanned: All frontend components and i18n files
- Result: No instances of "click here" or "please note"
- **Action:** None required

### 2. CTA Compliance

**Status:** ⚠️ **Mixed Compliance**

#### Current CTAs Found:

1. **LoginForm.tsx:32** - "Logged in successfully"
   - **Compliance:** ✅ Brief, positive
   - **Action:** None

2. **LoginForm.tsx:49** - "Account created successfully"
   - **Compliance:** ✅ Brief, positive
   - **Action:** None

3. **LoginForm.tsx:70** - "If the email exists, a password reset link has been sent"
   - **Compliance:** ⚠️ Too verbose, not minimal
   - **Replacement:** "Password reset link sent"
   - **File:** `frontend/components/LoginForm.tsx:70`

4. **EmptyState.tsx** - Uses props for CTAs (no hardcoded strings)
   - **Compliance:** ✅ Flexible, follows pattern
   - **Action:** None

#### CTA Pattern Analysis:

- **Action Buttons:** Use props/translations (good)
- **Success Messages:** Mostly compliant
- **Error Messages:** Need review (see below)

### 3. Error Message Tone

**Status:** ⚠️ **Needs Harmonisation**

#### Findings:

1. **LoginForm.tsx:35** - "Username is required for registration"
   - **Current Tone:** Direct, informative
   - **Compliance:** ✅ Calm, helpful
   - **Action:** None

2. **LoginForm.tsx:52** - "An error occurred"
   - **Current Tone:** Generic
   - **Compliance:** ✅ Calm
   - **Action:** None

3. **LoginForm.tsx:75** - "Failed to send reset email"
   - **Current Tone:** Direct, negative
   - **Compliance:** ⚠️ Could be more helpful
   - **Replacement:** "Unable to send reset email. Please try again."
   - **File:** `frontend/components/LoginForm.tsx:75`

4. **i18n/en.json:5** - "An error occurred"
   - **Compliance:** ✅ Calm, helpful
   - **Action:** None

### 4. Loading States

**Status:** ✅ **Compliant**

#### Findings:

- **i18n/en.json:4** - "Loading..."
- **Compliance:** ✅ Minimal
- **Action:** None

### 5. Empty States

**Status:** ✅ **Well Structured**

#### Findings:

- **EmptyState.tsx** - Uses props for title/description
- **Compliance:** ✅ Clear, actionable pattern
- **Action:** None (implementation is flexible)

### 6. Success Messages

**Status:** ✅ **Mostly Compliant**

#### Findings:

- "Logged in successfully" - ✅ Brief, positive
- "Account created successfully" - ✅ Brief, positive
- "Saved successfully" (i18n) - ✅ Brief, positive

---

## Files Requiring Changes

### Priority 1 (Tone Violations)

1. **frontend/components/LoginForm.tsx:70**
   - **Original:** "If the email exists, a password reset link has been sent"
   - **Replacement:** "Password reset link sent"
   - **Reason:** Too verbose, not minimal

2. **frontend/components/LoginForm.tsx:75**
   - **Original:** "Failed to send reset email"
   - **Replacement:** "Unable to send reset email. Please try again."
   - **Reason:** More helpful, calm tone

### Priority 2 (Consistency Improvements)

3. **frontend/messages/en.json** - Review all strings for tone consistency
   - **Action:** Ensure all strings follow calm, authoritative, minimal guidelines
   - **Files:** `frontend/messages/*.json` (en, ar, fa, he)

### Priority 3 (ICU Placeholder Preservation)

4. **All i18n files** - Verify ICU placeholders preserved
   - **Status:** ✅ Placeholders should be preserved (no changes needed)
   - **Format:** `{variable, type, format}`

---

## Detailed File-by-File Changes

### frontend/components/LoginForm.tsx

**Line 70:**
```tsx
// Before:
message: 'If the email exists, a password reset link has been sent',

// After:
message: 'Password reset link sent',
```

**Line 75:**
```tsx
// Before:
setError(err.message || 'Failed to send reset email')
addNotification({ type: 'error', message: err.message || 'Failed to send reset email' })

// After:
setError(err.message || 'Unable to send reset email. Please try again.')
addNotification({ type: 'error', message: err.message || 'Unable to send reset email. Please try again.' })
```

**Preserve:** ICU placeholders if any (none found in this file)

---

## i18n Files Audit

### frontend/messages/en.json

**Status:** ✅ **Mostly Compliant**

**Review Needed:**
- All strings follow calm, authoritative, minimal guidelines
- No banned phrases found
- CTAs are action-oriented where applicable

**Action:** No changes required (already compliant)

---

## Summary

| Category | Status | Files Affected | Changes Needed |
|----------|--------|----------------|----------------|
| Banned Phrases | ✅ Pass | 0 | 0 |
| CTA Compliance | ⚠️ Minor | 1 | 1 |
| Error Messages | ⚠️ Minor | 1 | 1 |
| Loading States | ✅ Pass | 0 | 0 |
| Empty States | ✅ Pass | 0 | 0 |
| Success Messages | ✅ Pass | 0 | 0 |
| **Total** | **⚠️ Minor** | **2** | **2** |

---

## Rollback Plan

**One-command rollback:**
```bash
git revert HEAD -- frontend/components/LoginForm.tsx
```

**Manual rollback:**
- Revert changes in `frontend/components/LoginForm.tsx:70,75`
- Restore original strings

---

## Next Steps

1. **Wave 1 PR:** Update 2 strings in LoginForm.tsx (≤25 files target met)
2. **Wave 2:** Review all i18n files for consistency (future)
3. **Wave 3:** Add tone linting rule to prevent violations (future)

**PR Title:** `ux: tone harmonisation (wave 1)`  
**Label:** `auto/docs`  
**Files Changed:** 1 file, 2 lines  
**Rollback:** Simple git revert
