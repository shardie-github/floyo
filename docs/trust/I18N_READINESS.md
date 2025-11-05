# Internationalization (i18n) Readiness

**Last Updated:** 2025-01-XX  
**Version:** 1.0

## Overview

This document outlines the strategy for internationalizing the application, including i18n key extraction, date/time formatting, RTL (Right-to-Left) support, and translation fallbacks.

## Current State

### Language Support

- **Primary Language:** English (en-US)
- **Fallback:** English (en-US)
- **Additional Languages:** None (yet)

### i18n Infrastructure

- **Status:** Not yet implemented
- **Framework:** TBD (likely next-intl or react-i18next)
- **Key Extraction:** Manual (to be automated)

## i18n Key Extraction Strategy

### Approach

1. **Extract all user-facing strings** from components
2. **Organize keys hierarchically** (e.g., `common.button.submit`, `page.trust.title`)
3. **Create translation files** (JSON/YAML) per locale
4. **Automate extraction** via tooling (e.g., i18next-scanner)

### Key Naming Convention

```
{namespace}.{component}.{key}
```

**Examples:**
- `common.button.submit` - Submit button
- `page.trust.title` - Trust page title
- `form.error.required` - Required field error
- `navigation.menu.home` - Home menu item

### Namespaces

- **common:** Shared UI elements (buttons, labels, etc.)
- **page:** Page-specific content
- **form:** Form labels and errors
- **navigation:** Navigation items
- **error:** Error messages
- **success:** Success messages

### Translation File Structure

```json
{
  "common": {
    "button": {
      "submit": "Submit",
      "cancel": "Cancel",
      "save": "Save"
    }
  },
  "page": {
    "trust": {
      "title": "Trust & Transparency",
      "description": "Your data privacy transparency dashboard"
    }
  }
}
```

## Date/Time Formatting

### Locale-Aware Formatting

- **Library:** Use `Intl.DateTimeFormat` or library (e.g., date-fns, dayjs)
- **Format:** Follow locale conventions
- **Timezone:** Display in user's timezone (if available)

### Format Examples

- **en-US:** January 15, 2025, 3:45 PM
- **en-GB:** 15 January 2025, 15:45
- **fr-FR:** 15 janvier 2025 à 15:45
- **de-DE:** 15. Januar 2025, 15:45 Uhr
- **ja-JP:** 2025年1月15日 15:45

### Relative Time

- **Examples:** "2 hours ago", "in 3 days", "last week"
- **Library:** Use `Intl.RelativeTimeFormat` or library (e.g., date-fns)

### Implementation

```typescript
// Example: Format date based on locale
const formatDate = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};
```

## Number Formatting

### Locale-Aware Formatting

- **Library:** Use `Intl.NumberFormat`
- **Format:** Follow locale conventions (decimal separator, thousands separator)

### Format Examples

- **en-US:** 1,234.56
- **fr-FR:** 1 234,56
- **de-DE:** 1.234,56
- **ja-JP:** 1,234.56

### Currency Formatting

- **Library:** Use `Intl.NumberFormat` with currency option
- **Format:** Follow locale conventions

### Implementation

```typescript
// Example: Format number based on locale
const formatNumber = (num: number, locale: string) => {
  return new Intl.NumberFormat(locale).format(num);
};

// Example: Format currency
const formatCurrency = (amount: number, locale: string, currency: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
```

## RTL (Right-to-Left) Support

### RTL Languages

- **Arabic (ar)**
- **Hebrew (he)**
- **Persian (fa)**
- **Urdu (ur)**

### Implementation Strategy

1. **HTML Direction:** Set `dir` attribute on `<html>` or component level
2. **CSS:** Use logical properties (e.g., `margin-inline-start` instead of `margin-left`)
3. **Layout:** Use Flexbox/Grid with `direction` support
4. **Icons:** Mirror icons where appropriate (e.g., arrows, chevrons)

### HTML Direction Attribute

```typescript
// Example: Set direction based on locale
const htmlDir = (locale: string) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(locale.split('-')[0]) ? 'rtl' : 'ltr';
};
```

### CSS Logical Properties

```css
/* Instead of: */
.element {
  margin-left: 1rem;
  padding-right: 1rem;
}

/* Use: */
.element {
  margin-inline-start: 1rem;
  padding-inline-end: 1rem;
}
```

### Icon Mirroring

```typescript
// Example: Mirror icons for RTL
const iconStyle = (locale: string) => {
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(locale.split('-')[0]);
  return isRTL ? { transform: 'scaleX(-1)' } : {};
};
```

## Translation Fallbacks

### Fallback Chain

1. **Exact locale match** (e.g., `en-US`)
2. **Language match** (e.g., `en`)
3. **Default locale** (e.g., `en-US`)
4. **Key name** (if translation missing)

### Implementation

```typescript
// Example: Get translation with fallback
const getTranslation = (key: string, locale: string, fallbackLocale: string = 'en-US') => {
  // Try exact locale match
  if (translations[locale]?.[key]) {
    return translations[locale][key];
  }
  
  // Try language match
  const language = locale.split('-')[0];
  if (translations[language]?.[key]) {
    return translations[language][key];
  }
  
  // Try fallback locale
  if (translations[fallbackLocale]?.[key]) {
    return translations[fallbackLocale][key];
  }
  
  // Return key name as last resort
  return key;
};
```

### Non-Blocking Loading

- **Strategy:** Load translations asynchronously
- **Fallback:** Show English while loading
- **Error Handling:** Graceful fallback to English

### Missing Translation Detection

- **Development:** Log warnings for missing translations
- **Production:** Fallback to English silently
- **Tooling:** Automated checks in CI

## Implementation Phases

### Phase 1: Infrastructure (Weeks 1-2)
- [ ] Choose i18n framework (next-intl or react-i18next)
- [ ] Set up translation file structure
- [ ] Implement locale detection
- [ ] Set up build tooling for i18n

### Phase 2: Core Pages (Weeks 3-4)
- [ ] Extract strings from core pages
- [ ] Create translation files for primary language
- [ ] Implement date/time formatting
- [ ] Implement number formatting

### Phase 3: RTL Support (Weeks 5-6)
- [ ] Add direction attribute support
- [ ] Update CSS to use logical properties
- [ ] Test RTL layouts
- [ ] Mirror icons where needed

### Phase 4: Additional Languages (Weeks 7+)
- [ ] Translate to target languages (e.g., Spanish, French)
- [ ] Test translations
- [ ] Implement language switcher UI
- [ ] Document translation process

## Testing

### Locale Testing

- [ ] Test date/time formatting for each locale
- [ ] Test number formatting for each locale
- [ ] Test RTL layouts
- [ ] Test language switcher

### Translation Testing

- [ ] Verify all strings are translated
- [ ] Check for missing translations
- [ ] Test fallback behavior
- [ ] Test non-blocking loading

## Tools & Libraries

### Recommended Libraries

- **next-intl:** Next.js i18n library (recommended for Next.js 14+)
- **react-i18next:** React i18n library (alternative)
- **date-fns:** Date formatting library
- **Intl API:** Built-in browser API for formatting

### Extraction Tools

- **i18next-scanner:** Extract keys from code
- **babel-plugin-i18next:** Babel plugin for extraction
- **Custom scripts:** Extract keys via AST parsing

## Documentation

### Translation Guidelines

- **Tone:** Maintain consistent tone across languages
- **Context:** Provide context for translators
- **Length:** Consider text expansion (e.g., German is longer)
- **Formatting:** Preserve formatting codes (e.g., `{variable}`)

### Contributor Guidelines

- **Adding strings:** Use i18n keys, not hardcoded strings
- **Date/time:** Use locale-aware formatting
- **Numbers:** Use locale-aware formatting
- **RTL:** Consider RTL when designing layouts

## Next Steps

1. **Choose i18n framework** and set up infrastructure
2. **Extract strings** from existing pages
3. **Create translation files** for primary language
4. **Implement date/time/number formatting**
5. **Add RTL support** for key pages
6. **Translate to additional languages** (prioritize by user base)

---

**Status:** Planning Phase  
**Target Languages:** English (en-US) → Spanish (es), French (fr), German (de)  
**Timeline:** 8-12 weeks for initial implementation

*This document will be updated as i18n implementation progresses.*
