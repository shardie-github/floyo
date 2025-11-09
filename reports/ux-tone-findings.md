# UX Tone Equalizer — Microcopy Harmonization Report

**Generated:** $(date -Iseconds)  
**Persona:** Calm, authoritative, minimal  
**Banned Phrases:** "click here", "please note"  
**CTA Standard:** "Add to Cart"

## Executive Summary

Analysis of user-facing strings across the frontend codebase reveals generally consistent tone with opportunities for harmonization. No banned phrases detected. Microcopy follows a calm, authoritative style.

## Current State Analysis

### Tone Profile

**Persona:** ✅ Calm, authoritative, minimal
- Error messages: Direct and helpful ("Something went wrong", "An error occurred")
- CTAs: Action-oriented ("Save", "Create", "Export")
- Empty states: Clear and actionable
- Loading states: Minimal ("Loading...")

### Banned Phrases Check

✅ **No banned phrases found:**
- "click here" - Not found
- "please note" - Not found

### CTA Consistency

**Current CTAs Found:**
- "Save", "Cancel", "Delete", "Edit", "Create"
- "Login", "Logout", "Register"
- "Export", "Import", "Search", "Filter"
- "Reload Page", "Go Home"
- "Add to Cart" - Not found (not applicable to this product)

**Assessment:** CTAs are consistent and action-oriented. No "Add to Cart" found, which is appropriate for this B2B SaaS product.

## String Extraction

### i18n Files

**Location:** `frontend/messages/en.json`

**Categories:**
1. **Common Actions** (15 strings)
   - Welcome, Loading, Error, Save, Cancel, Delete, Edit, Create, Search, Filter, Export, Import

2. **Authentication** (7 strings)
   - Login, Logout, Register, Email, Password, Forgot Password, Remember me

3. **Dashboard** (5 strings)
   - Dashboard, Events, Patterns, Suggestions, Statistics

4. **Accessibility** (4 strings)
   - Skip to main content, Close, Menu, Navigation

### Hardcoded Strings Found

**Error Messages:**
- "Something went wrong" (ErrorBoundary)
- "An unexpected error occurred" (ErrorBoundary)
- "An error occurred" (LoginForm)
- "If the email exists, a password reset link has been sent" (LoginForm)
- "Failed to send reset email" (LoginForm)
- "Username is required for registration" (LoginForm)
- "Logged in successfully" (LoginForm)
- "Account created successfully" (LoginForm)

**Empty States:**
- Component accepts `title` and `description` props (dynamic)

**Loading States:**
- "Loading..." (hardcoded in multiple places)

## Recommendations

### Wave 1: Non-Breaking Replacements

#### 1. Move Hardcoded Strings to i18n

**Priority: Medium**

Extract hardcoded strings to `frontend/messages/en.json`:

```json
{
  "errors": {
    "generic": "Something went wrong",
    "unexpected": "An unexpected error occurred",
    "occurred": "An error occurred",
    "emailResetSent": "If the email exists, a password reset link has been sent",
    "emailResetFailed": "Failed to send reset email",
    "usernameRequired": "Username is required for registration"
  },
  "success": {
    "loggedIn": "Logged in successfully",
    "accountCreated": "Account created successfully"
  },
  "loading": {
    "default": "Loading..."
  }
}
```

**Files to Update:**
- `frontend/components/ErrorBoundary.tsx`
- `frontend/components/LoginForm.tsx`
- `frontend/app/page.tsx`
- Other components with hardcoded strings

#### 2. Preserve ICU Placeholders

✅ **Current State:** No ICU placeholders found in strings  
✅ **Action:** Ensure future i18n strings use ICU format for pluralization and variables

Example format:
```json
{
  "events": {
    "count": "{count, plural, =0 {No events} one {# event} other {# events}}"
  }
}
```

#### 3. Tone Consistency Check

**Current Tone Assessment:**

✅ **Calm:** Error messages are non-alarming  
✅ **Authoritative:** Clear, direct language  
✅ **Minimal:** Short, concise strings

**Minor Improvements:**
- "Something went wrong" → Consider "An error occurred" (more consistent)
- "If the email exists..." → Consider "Check your email for a password reset link" (more direct)

## Tone Profile JSON

Created `copy/tone-profile.json` with:
- Persona definition
- Banned phrases list
- CTA standards
- Tone guidelines

## Implementation Plan

### Phase 1: Extract to i18n (Non-Breaking)

1. Add error/success/loading strings to `en.json`
2. Update components to use i18n hooks
3. Preserve all ICU placeholders
4. Test all user flows

### Phase 2: Tone Refinement

1. Review all user-facing strings
2. Apply tone guidelines consistently
3. Remove any remaining banned phrases
4. Standardize CTAs

## Files Requiring Updates

1. `frontend/messages/en.json` - Add new string categories
2. `frontend/components/ErrorBoundary.tsx` - Use i18n
3. `frontend/components/LoginForm.tsx` - Use i18n
4. `frontend/app/page.tsx` - Use i18n
5. Other components with hardcoded strings

## Metrics

- **Total i18n Strings:** 31 (in en.json)
- **Hardcoded Strings Found:** ~15 (estimated)
- **Banned Phrases:** 0
- **ICU Placeholders:** 0 (none needed currently)

---

**Status:** ✅ Tone is consistent  
**Action Required:** Extract hardcoded strings to i18n (low priority, non-breaking)
