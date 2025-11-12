> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Accessibility Checklist — WCAG 2.2 — floyo

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready

---

## Overview

This checklist ensures floyo complies with Web Content Accessibility Guidelines (WCAG) 2.2 Level AA, the standard for Canadian accessibility compliance.

**Target Level:** WCAG 2.2 Level AA  
**Scope:** Desktop app (Electron), website, documentation

---

## 1. Perceivable

### 1.1 Text Alternatives
- ✅ **Images:** All images have alt text
- ✅ **Icons:** Icons have text labels or aria-labels
- ✅ **Decorative Images:** Marked as decorative (empty alt text)

**Implementation:**
- [ ] All images include alt text
- [ ] Icons have aria-labels
- [ ] Decorative images have empty alt text

### 1.2 Time-Based Media
- ✅ **Video:** Captions provided (if applicable)
- ✅ **Audio:** Transcripts provided (if applicable)
- ✅ **Auto-Playing Media:** User can pause/stop

**Implementation:**
- [ ] Video captions (if videos added)
- [ ] Audio transcripts (if audio added)
- [ ] Auto-play controls (user can disable)

### 1.3 Adaptable
- ✅ **Information Structure:** Headings, lists, sections structured semantically
- ✅ **Reading Order:** Logical reading order (CSS or DOM order)
- ✅ **Sensory Characteristics:** Not reliant on shape, size, color alone

**Implementation:**
- [ ] Semantic HTML (headings, lists, sections)
- [ ] Logical DOM order
- [ ] Color not sole indicator (use icons, text)

### 1.4 Distinguishable
- ✅ **Color Contrast:** Text contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text)
- ✅ **Text Resize:** Text resizable up to 200% without loss of functionality
- ✅ **Images of Text:** Avoid images of text (use real text)
- ✅ **Audio Control:** User can control audio (volume, pause)

**Implementation:**
- [ ] Color contrast tested (4.5:1 minimum)
- [ ] Text resizable (up to 200%)
- [ ] Real text (not images of text)
- [ ] Audio controls (if applicable)

---

## 2. Operable

### 2.1 Keyboard Accessible
- ✅ **Keyboard Navigation:** All functionality available via keyboard
- ✅ **No Keyboard Trap:** Keyboard focus not trapped
- ✅ **Keyboard Shortcuts:** Custom shortcuts don't conflict with system shortcuts

**Implementation:**
- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] No keyboard traps

### 2.2 Enough Time
- ✅ **Timing Adjustable:** Time limits adjustable (if applicable)
- ✅ **Pausing:** User can pause, stop, hide moving content
- ✅ **No Timing:** No time limits for critical tasks

**Implementation:**
- [ ] Time limits adjustable (if applicable)
- [ ] Auto-updating content can be paused
- [ ] No time limits for critical tasks

### 2.3 Seizures and Physical Reactions
- ✅ **No Flashing:** No content flashes more than 3 times per second
- ✅ **Animations:** User can reduce motion (prefers-reduced-motion)

**Implementation:**
- [ ] No flashing content (3 flashes/second max)
- [ ] Respect prefers-reduced-motion CSS
- [ ] Animation controls (user can disable)

### 2.4 Navigable
- ✅ **Skip Links:** Skip links for repeated content
- ✅ **Page Titles:** Descriptive page titles
- ✅ **Focus Order:** Focus order logical and meaningful
- ✅ **Link Purpose:** Link purpose clear from link text or context
- ✅ **Multiple Ways:** Multiple ways to navigate (site map, search, etc.)
- ✅ **Headings and Labels:** Headings and labels descriptive
- ✅ **Focus Visible:** Keyboard focus indicator visible

**Implementation:**
- [ ] Skip links (if website)
- [ ] Descriptive page titles
- [ ] Logical focus order
- [ ] Clear link text
- [ ] Multiple navigation methods
- [ ] Descriptive headings
- [ ] Visible focus indicators

---

## 3. Understandable

### 3.1 Readable
- ✅ **Language:** Page language identified (lang attribute)
- ✅ **Language Changes:** Language changes identified
- ✅ **Unusual Words:** Unusual words explained (abbreviations, jargon)
- ✅ **Abbreviations:** Abbreviations expanded on first use
- ✅ **Reading Level:** Reading level appropriate (aim for Grade 8)

**Implementation:**
- [ ] lang attribute on HTML
- [ ] Language changes marked
- [ ] Glossary or explanations for jargon
- [ ] Abbreviations expanded
- [ ] Plain language (Grade 8 reading level)

### 3.2 Predictable
- ✅ **On Focus:** No unexpected context changes on focus
- ✅ **On Input:** No unexpected context changes on input
- ✅ **Navigation Consistent:** Navigation consistent across pages
- ✅ **Identification Consistent:** Components identified consistently
- ✅ **Change on Request:** Context changes only on user request

**Implementation:**
- [ ] No unexpected focus changes
- [ ] No unexpected input changes
- [ ] Consistent navigation
- [ ] Consistent component identification
- [ ] Changes only on user request

### 3.3 Input Assistance
- ✅ **Error Identification:** Errors identified and described
- ✅ **Labels or Instructions:** Labels or instructions provided
- ✅ **Error Suggestion:** Error suggestions provided (if applicable)
- ✅ **Error Prevention:** Critical actions confirmed (delete, submit)

**Implementation:**
- [ ] Error messages clear and descriptive
- [ ] Form labels and instructions
- [ ] Error suggestions (if applicable)
- [ ] Confirmation for critical actions

---

## 4. Robust

### 4.1 Compatible
- ✅ **Parsing:** HTML valid (no parsing errors)
- ✅ **Name, Role, Value:** UI components have name, role, value (ARIA)

**Implementation:**
- [ ] HTML validated (W3C validator)
- [ ] ARIA attributes used correctly
- [ ] Screen reader tested (NVDA, JAWS, VoiceOver)

---

## 5. Desktop App Specific (Electron)

### 5.1 Keyboard Navigation
- ✅ **Tab Navigation:** All interactive elements accessible via Tab
- ✅ **Keyboard Shortcuts:** Standard shortcuts (Ctrl+C, Ctrl+V, etc.)
- ✅ **Focus Indicators:** Visible focus indicators

**Implementation:**
- [ ] Tab navigation works
- [ ] Standard keyboard shortcuts
- [ ] Visible focus indicators

### 5.2 Screen Reader Support
- ✅ **ARIA Labels:** Interactive elements have aria-labels
- ✅ **Roles:** Semantic roles (button, link, etc.)
- ✅ **Live Regions:** Dynamic content announced (aria-live)

**Implementation:**
- [ ] ARIA labels on all interactive elements
- [ ] Semantic roles
- [ ] Live regions for dynamic content

### 5.3 High Contrast Mode
- ✅ **High Contrast:** App works in high contrast mode (Windows)
- ✅ **Dark Mode:** Dark mode available (accessibility feature)

**Implementation:**
- [ ] High contrast mode tested (Windows)
- [ ] Dark mode implemented
- [ ] Contrast ratios meet WCAG AA

---

## 6. Testing Checklist

### 6.1 Automated Testing
- [ ] **axe-core:** Automated accessibility testing (axe-core)
- [ ] **WAVE:** Web accessibility evaluation (if website)
- [ ] **Lighthouse:** Accessibility audit (Lighthouse CI)

**Tools:**
- axe-core (npm package)
- WAVE (browser extension)
- Lighthouse (Chrome DevTools)

### 6.2 Manual Testing
- [ ] **Keyboard Navigation:** Test all functionality via keyboard
- [ ] **Screen Reader:** Test with NVDA (Windows), JAWS (Windows), VoiceOver (macOS)
- [ ] **Color Contrast:** Test color contrast (WebAIM Contrast Checker)
- [ ] **Text Resize:** Test text resizing (up to 200%)

**Screen Readers:**
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (macOS, built-in)

### 6.3 User Testing
- [ ] **Users with Disabilities:** Test with users with disabilities (if possible)
- [ ] **Feedback:** Collect accessibility feedback
- [ ] **Iteration:** Improve based on feedback

---

## 7. Compliance Checklist

### Pre-Launch
- [ ] WCAG 2.2 Level AA compliance verified
- [ ] Automated testing completed (axe-core, Lighthouse)
- [ ] Manual testing completed (keyboard, screen reader)
- [ ] Color contrast tested (4.5:1 minimum)
- [ ] Text resizing tested (up to 200%)

### Post-Launch
- [ ] Regular accessibility audits (quarterly)
- [ ] User feedback collected
- [ ] Accessibility improvements implemented
- [ ] Documentation updated (accessibility features)

---

## 8. Documentation

### 8.1 Accessibility Statement
Create an accessibility statement (website/app):

```
Accessibility Statement

floyo is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

Conformance Status
floyo conforms to WCAG 2.2 Level AA standards.

Feedback
If you encounter accessibility barriers, please contact us at [YOUR-EMAIL].

Last Updated: [DATE]
```

### 8.2 User Documentation
- [ ] Keyboard shortcuts documented
- [ ] Screen reader instructions provided
- [ ] Accessibility features documented

---

## 9. Resources

### WCAG Resources
- **WCAG 2.2:** https://www.w3.org/WAI/WCAG22/quickref/
- **WebAIM:** https://webaim.org/
- **A11y Project:** https://www.a11yproject.com/

### Testing Tools
- **axe-core:** https://github.com/dequelabs/axe-core
- **WAVE:** https://wave.webaim.org/
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse

---

## 10. Implementation Checklist

### Immediate (Pre-Launch)
- [ ] WCAG 2.2 Level AA compliance verified
- [ ] Automated testing (axe-core, Lighthouse)
- [ ] Manual testing (keyboard, screen reader)
- [ ] Color contrast tested (4.5:1 minimum)
- [ ] Accessibility statement published

### Ongoing (Post-Launch)
- [ ] Regular accessibility audits (quarterly)
- [ ] User feedback collected
- [ ] Accessibility improvements implemented
- [ ] Documentation updated

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready
