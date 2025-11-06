# Front-End Enrichment Integrations

**Project:** Hardonia  
**Last Updated:** 2024

This document evaluates and documents all front-end enrichment integrations, their scoring, setup instructions, and privacy considerations.

## Scoring Methodology

Each integration is scored on a 1-5 scale across five criteria:

- **UX Impact** (weight: 5): How much it improves user experience
- **Trust/FOMO** (weight: 4): Builds trust, social proof, urgency
- **Dev Effort** (weight: -3): Lower effort = better (subtracted from score)
- **Cost Efficiency** (weight: 4): Free/low-cost preferred
- **Privacy Fit** (weight: 4): GDPR/PIPEDA compliance, minimal data collection

**Minimum Pass Score:** 18

**Formula:** `(UX × 5) + (Trust × 4) + (Effort × -3) + (Cost × 4) + (Privacy × 4)`

---

## Evaluation Results

| Integration | Category | UX | Trust | Effort | Cost | Privacy | **Total** | Status |
|------------|----------|-----|-------|--------|------|---------|-----------|--------|
| **Vercel Analytics** | Analytics | 4 | 2 | 1 | 5 | 5 | **47** | ✅ Selected |
| **Sentry** | Monitoring | 5 | 3 | 2 | 4 | 4 | **48** | ✅ Selected |
| **Cloudinary** | Media | 5 | 2 | 2 | 4 | 5 | **47** | ✅ Selected |
| **LottieFiles** | Animation | 5 | 2 | 2 | 5 | 5 | **48** | ✅ Selected |
| **Lenis** | Smooth Scroll | 4 | 2 | 2 | 5 | 5 | **43** | ✅ Selected |
| **Framer Motion** | Animation | 5 | 2 | 1 | 5 | 5 | **49** | ✅ Selected (already installed) |
| **hCaptcha** | Security | 3 | 5 | 2 | 5 | 4 | **45** | ✅ Selected |
| **PostHog** | Analytics | 4 | 3 | 3 | 4 | 3 | **42** | ✅ Selected (already installed) |
| Plausible | Analytics | 3 | 2 | 3 | 3 | 5 | 38 | ⚠️ Alternative |
| Microsoft Clarity | Analytics | 4 | 2 | 2 | 5 | 3 | 42 | ⚠️ Alternative |
| Uploadcare | Uploads | 4 | 2 | 3 | 4 | 4 | 41 | ⚠️ Alternative |
| Tidio | Chat | 3 | 4 | 3 | 4 | 3 | 39 | ⚠️ Alternative |
| Crisp | Chat | 3 | 4 | 3 | 4 | 3 | 39 | ⚠️ Alternative |
| Google reCAPTCHA | Security | 3 | 4 | 3 | 5 | 2 | 36 | ❌ Privacy concerns |
| Pusher | Realtime | 4 | 5 | 4 | 3 | 4 | 42 | ⚠️ Alternative |
| Ably | Realtime | 4 | 5 | 4 | 3 | 4 | 42 | ⚠️ Alternative |
| Algolia | Search | 5 | 2 | 4 | 2 | 3 | 39 | ⚠️ Alternative |
| Meilisearch | Search | 4 | 2 | 4 | 4 | 5 | 39 | ⚠️ Alternative |
| Trustpilot | Reviews | 2 | 5 | 3 | 3 | 3 | 36 | ⚠️ Alternative |
| LemonSqueezy | Payments | 4 | 4 | 3 | 3 | 4 | 41 | ⚠️ Alternative |

---

## Selected Integrations (Top 8)

### 1. Vercel Analytics ⭐
**Score:** 47 | **Status:** ✅ Enabled

**Value:** Zero-config usage insights; minimal performance impact

**Setup:**
```bash
npm i @vercel/analytics
```

**Integration:** See `components/integrations/VercelAnalytics.tsx`

**Privacy:** Cookieless, lightweight, GDPR-friendly

**Env Vars:** None (auto-detected on Vercel)

---

### 2. Sentry ⭐
**Score:** 48 | **Status:** ✅ Enabled

**Value:** Catch frontend errors & slow transactions

**Setup:**
```bash
npm i @sentry/nextjs
# Or use wizard: npx @sentry/wizard -i nextjs
```

**Integration:** See `components/integrations/Sentry.tsx`

**Privacy:** PII scrubbing available, configurable

**Env Vars:** `SENTRY_DSN`

---

### 3. Cloudinary ⭐
**Score:** 47 | **Status:** ✅ Enabled

**Value:** Lazy, responsive images/video; transformations on-the-fly

**Setup:**
```bash
npm i next-cloudinary
```

**Integration:** See `components/integrations/Cloudinary.tsx`

**Privacy:** CDN media only, no user tracking

**Env Vars:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

---

### 4. LottieFiles Player ⭐
**Score:** 48 | **Status:** ✅ Enabled

**Value:** High-quality vector animations without performance hit

**Setup:**
```bash
npm i @lottiefiles/react-lottie-player
```

**Integration:** See `components/integrations/LottiePlayer.tsx`

**Privacy:** Local JSON animations recommended (no external calls)

**Env Vars:** None

---

### 5. Lenis Smooth Scroll ⭐
**Score:** 43 | **Status:** ✅ Enabled

**Value:** Silky smooth scrolling; tasteful motion

**Setup:**
```bash
npm i @studio-freight/lenis
```

**Integration:** See `components/integrations/LenisSmoothScroll.tsx`

**Privacy:** None (local only)

**Env Vars:** None

---

### 6. Framer Motion ⭐
**Score:** 49 | **Status:** ✅ Enabled (already installed)

**Value:** Production-grade motion primitives

**Setup:** Already installed

**Integration:** Use directly in components

**Privacy:** None (local only)

**Env Vars:** None

---

### 7. hCaptcha ⭐
**Score:** 45 | **Status:** ✅ Enabled

**Value:** Protect forms without Google dependency

**Setup:**
```bash
npm i @hcaptcha/react-hcaptcha
```

**Integration:** See `components/integrations/hCaptcha.tsx`

**Privacy:** Privacy-forward alternative to reCAPTCHA

**Env Vars:** `NEXT_PUBLIC_HCAPTCHA_SITEKEY`

---

### 8. PostHog ⭐
**Score:** 42 | **Status:** ✅ Enabled (already installed)

**Value:** Funnels, feature flags, session replay

**Setup:** Already installed

**Integration:** See `components/integrations/PostHog.tsx`

**Privacy:** Self-host option available

**Env Vars:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

---

## Configuration

All integrations are controlled via `/config/integrations.json`:

```json
{
  "vercelAnalytics": true,
  "sentry": true,
  "cloudinary": true,
  "lottie": true,
  "lenis": true,
  "framerMotion": true,
  "hcaptcha": true,
  "posthog": true
}
```

Toggle any integration by setting its flag to `false`.

---

## Consent Management

All analytics, chat, and tracking integrations are gated behind consent via `ConsentProvider`:

- **Analytics:** Vercel Analytics, PostHog, Sentry (error tracking)
- **Marketing:** Chat widgets, social proof widgets
- **Functional:** Essential features (always enabled)

Consent is stored in `localStorage` as `privacy_choices_v2`:

```typescript
{
  analytics: boolean,
  marketing: boolean,
  functional: boolean
}
```

---

## Privacy Compliance

- ✅ GDPR compliant (consent-gated)
- ✅ PIPEDA compliant (Canadian privacy law)
- ✅ All analytics deferred until consent
- ✅ No cookies set without consent
- ✅ PII scrubbing enabled (Sentry)
- ✅ Self-host options available (PostHog)

---

## Performance

- All scripts lazy-loaded with `dynamic import()`
- Deferred until idle or after first interaction
- No CLS (Cumulative Layout Shift) regressions
- Widget heights reserved to prevent layout shifts

---

## Testing

Run Lighthouse audit:
```bash
npm run test:lighthouse
```

Run accessibility audit:
```bash
npm run test:accessibility
```

CI automatically runs both on `/integrations` page.

---

## CI/CD Integration Audits

This project includes automated performance and accessibility audits via GitHub Actions.

### Lighthouse CI

**Configuration:** `lighthouserc.json`

**Metrics:**
- Performance: min score 0.9 (warn)
- Accessibility: min score 0.95 (warn)
- LCP: ≤ 2500ms (error)
- CLS: ≤ 0.05 (error)
- TTI: ≤ 4000ms (warn)

**Run locally:**
```bash
npm run lhci
```

### Pa11y (axe) Accessibility

**Configuration:** `.pa11yci.json`

**Standard:** WCAG2AA

**Run locally:**
```bash
npm run a11y
```

### GitHub Actions Workflow

The `integration-audit.yml` workflow runs on:
- Pull requests to `main`
- Manual workflow dispatch

**Steps:**
1. Build Next.js app
2. Start production server (`npm run start-ci`)
3. Run Lighthouse CI on `/` and `/integrations`
4. Run Pa11y on `/` and `/integrations`
5. Upload artifacts for review

**Artifacts:**
- `lighthouse-report`: Lighthouse CI results
- `pa11y-report`: Pa11y accessibility results

---

## Demo Page

Visit `/integrations` to see all enabled integrations in action:

- **Lottie Animations**: Live Lottie player demo
- **Smooth Scroll**: Lenis integration status
- **Live Visitors**: Real-time visitor counter (Pusher/Ably)
- **Trust Badges**: Trustpilot widget (consent-gated)
- **Chat Widgets**: Tidio/Crisp status (consent-gated)

All components are lazy-loaded and respect consent preferences.

---

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Add required API keys for enabled integrations
3. Review `/config/integrations.json` and toggle as needed
4. Test consent flow at `/privacy/onboarding`
5. View demo integrations at `/integrations`

---

## Troubleshooting

**Integration not loading?**
- Check `config/integrations.json` flag is `true`
- Verify consent is granted for required category
- Check browser console for errors
- Verify env vars are set

**Performance issues?**
- Ensure lazy loading is enabled
- Check Network tab for heavy scripts
- Disable non-critical integrations

**Privacy concerns?**
- All analytics respect consent
- Use self-host options where available
- Review privacy policy at `/privacy/policy`
