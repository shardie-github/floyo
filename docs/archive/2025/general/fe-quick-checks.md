> Archived on 2025-11-12. Superseded by: (see docs/final index)

# FE Quick Checks

## Accessibility
- Axe DevTools: no critical violations.
- Keyboard only: Header nav, drawer, modals, toasts navigable; focus trapped correctly.
- Screen reader: All interactive elements have proper labels and roles.
- Focus indicators: Visible focus rings on all focusable elements.

## Performance
- CLS: reserve media sizes; use aspect-video or explicit width/height.
- INP: avoid long tasks; defer non-critical JS; prefer CSS for trivial animations.
- LCP: preconnect fonts; hero image priority; avoid blocking CSS.
- Lighthouse mobile: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.05.

## Motion
- Respects `prefers-reduced-motion` media query.
- Transitions use spring physics where appropriate (150-250ms range).
- Page transitions are smooth and non-jarring.

## PWA
- Manifest validates correctly.
- Service worker registers and caches shell.
- Offline page loads when network unavailable.
- Icons are present and properly sized.

## SEO
- Meta tags present (title, description, Open Graph).
- Semantic HTML structure.
- Robots.txt configured.
- Sitemap generated (when applicable).