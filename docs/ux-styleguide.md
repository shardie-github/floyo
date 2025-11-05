# UX Style Guide - Hardonia

## Design Principles

### Visual Identity
- **Modern & Bold**: Clean lines, high contrast, premium feel
- **Consistent**: Design tokens ensure visual harmony
- **Accessible**: WCAG 2.2 AA compliance throughout

### Motion & Animation
- **Transition Duration**: 150-250ms for standard interactions
- **Spring Physics**: Preferred for page mounts and entry animations
- **Reduced Motion**: Always respect `prefers-reduced-motion` media query
- **Purpose**: Motion should enhance usability, not distract

### Typography
- **Font Stack**: Inter (system fallbacks)
- **Sizes**: Responsive scaling with mobile-first approach
- **Line Height**: Generous for readability
- **Weight**: Regular (400) for body, Semibold (600) for headings, Bold (700) for emphasis

### Spacing
- **Base Unit**: 4px (0.25rem)
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64px
- **Container Padding**: 1rem (16px) on mobile, responsive on larger screens
- **Section Padding**: py-20 (5rem) for major sections

### Color System
- **Semantic Colors**: Use design tokens (--primary, --secondary, --accent, etc.)
- **Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Dark Mode**: System-aware, persists user preference

### Border Radius
- **Default**: 14px (--radius)
- **Components**: rounded-xl (lg), rounded-2xl (xl)
- **Buttons**: rounded-xl or rounded-full for pill variant

### Elevation & Shadows
- **Cards**: `shadow-card` (0 6px 24px rgba(0,0,0,0.08))
- **Hover States**: Subtle elevation increase
- **Dark Mode**: Adjusted shadows for dark backgrounds

## Component Usage

### Buttons
- Primary actions: `variant="default"`
- Secondary actions: `variant="outline"` or `variant="secondary"`
- Destructive actions: `variant="destructive"`
- Ghost buttons: `variant="ghost"` for subtle actions
- Sizes: `sm`, `md`, `lg`, `pill`

### Cards
- Use `bg-card` with `border border-border`
- Padding: `p-6` for standard content
- Rounded corners: `rounded-xl`

### Motion Components
- Use `FadeIn` for entry animations
- Add `delay` prop for staggered lists
- Respects reduced motion automatically

### Layout
- Container: Use `container` class for max-width centering
- Sections: Use semantic HTML (`<section>`) with proper spacing
- Grid: Use Tailwind grid utilities, responsive breakpoints

## Accessibility Guidelines

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus indicators: Visible outline ring (2px solid)
- Focus order: Logical tab sequence
- Skip links: Provided for main content

### Screen Readers
- Proper ARIA labels and roles
- Semantic HTML structure
- Live regions for dynamic content updates
- Alt text for images

### Color & Contrast
- Never rely on color alone to convey information
- Ensure sufficient contrast ratios
- Test with color blindness simulators

## Performance Guidelines

### Images
- Use `priority` prop for above-the-fold images
- Provide explicit width/height to prevent CLS
- Use `next/image` for optimization
- Lazy load below-the-fold images

### Fonts
- Preconnect to font sources
- Use `font-display: swap` for web fonts
- Limit font families and weights

### JavaScript
- Code split with dynamic imports
- Defer non-critical scripts
- Minimize bundle size

## Mobile Considerations

### Touch Targets
- Minimum 44x44px (thumb-friendly)
- Adequate spacing between interactive elements
- Avoid hover-only interactions

### Layout
- Mobile-first responsive design
- Flexible grid systems
- Stack on mobile, side-by-side on desktop

### Performance
- Optimize for mobile networks
- Minimize initial load
- Progressive enhancement