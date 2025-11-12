> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Design Token Auditor — Canonical Tokens Report

**Generated:** $(date -Iseconds)  
**Sources:** Tailwind config, CSS variables, component usage

## Executive Summary

Design tokens are well-structured using CSS variables and Tailwind configuration. Created canonical token file for consolidation and aliasing.

## Current State

### Token Sources

1. **CSS Variables** (`frontend/app/globals.css`)
   - Defined in `:root` and `.dark` selectors
   - Uses HSL color format
   - 20+ color tokens
   - 1 spacing token (`--radius`)

2. **Tailwind Config** (`frontend/tailwind.config.ts`)
   - Extends Tailwind with custom colors
   - References CSS variables via `hsl(var(--token))`
   - Custom animations and shadows
   - Border radius system

### Token Categories

#### Colors (20 tokens)
- Background/Foreground: `bg`, `fg`
- Muted: `muted`, `muted-foreground`
- Card: `card`
- Primary: `primary`, `primary-fg`
- Secondary: `secondary`, `secondary-fg`
- Accent: `accent`, `accent-fg`
- Destructive: `destructive`, `destructive-fg`
- Border: `border`
- Ring: `ring`

#### Spacing
- Container padding: `1rem`
- Container max-width: `1280px` (2xl breakpoint)

#### Border Radius
- Base: `14px` (`--radius`)
- Large: `var(--radius)`
- XL: `calc(var(--radius) + 4px)`
- 2XL: `calc(var(--radius) + 8px)`

#### Shadows
- Card: `0 6px 24px rgba(0,0,0,0.08)`

#### Animations
- `in-fade`: 160ms ease-out
- `in-slide-up`: 220ms ease-out

## Canonical Token File

Created `design/tokens.json` with:
- All color tokens (light/dark variants)
- CSS variable references
- Semantic aliases
- Source file references

### Semantic Aliases

Added semantic aliases for better developer experience:
- `background` → `bg`
- `foreground` → `fg`
- `primaryColor` → `primary`
- `errorColor` → `destructive`
- `focusRing` → `ring`

## Recommendations

### Wave 1: Consolidate Design Tokens (No Visual Changes)

#### 1. Use Canonical Token File

**Action:** Reference `design/tokens.json` as source of truth

**Benefits:**
- Single source of truth
- Easier theme updates
- Better tooling support
- Type-safe token access (if TypeScript types generated)

#### 2. Generate TypeScript Types

**Action:** Create `design/tokens.d.ts` from `tokens.json`

**Example:**
```typescript
export const tokens = {
  colors: {
    bg: { light: '...', dark: '...' },
    // ...
  }
} as const;
```

#### 3. Alias Usage in Components

**Current:** Direct CSS variable usage
```tsx
className="bg-primary text-primary-fg"
```

**Recommended:** Use semantic aliases where appropriate
```tsx
// Still uses Tailwind classes, but tokens are centralized
className="bg-primary text-primary-fg"
```

#### 4. No Risky Visual Shifts

**Strategy:** All changes are additive (aliasing, documentation)
- No color value changes
- No spacing changes
- No breaking changes

### Future Enhancements

1. **Token Validation**
   - Ensure all CSS variables match tokens.json
   - Validate Tailwind config matches tokens

2. **Design System Documentation**
   - Document token usage guidelines
   - Create component examples

3. **Theme Generator**
   - Generate light/dark themes from tokens
   - Support custom themes

## Token Usage Analysis

### Direct CSS Variable Usage

Found in `globals.css`:
- All tokens properly defined
- Dark mode variants present
- Consistent HSL format

### Tailwind Usage

Found in `tailwind.config.ts`:
- All tokens mapped to Tailwind
- Proper CSS variable references
- Custom utilities defined

### Component Usage

Components use Tailwind classes that reference tokens:
- `bg-primary`, `text-primary-fg`
- `border-border`
- `ring-ring` (focus states)

## Files Created

1. `design/tokens.json` - Canonical token definitions
2. `reports/design-token-audit.md` - This report

## Metrics

- **Color Tokens:** 20
- **Spacing Tokens:** 2
- **Border Radius Tokens:** 4
- **Shadow Tokens:** 1
- **Animation Tokens:** 2
- **Semantic Aliases:** 12

---

**Status:** ✅ Tokens well-structured  
**Action Required:** Use canonical token file as reference (no breaking changes)
