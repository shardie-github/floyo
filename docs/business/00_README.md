# Business Document Stack — floyo

**Canadian Solo Venture (Side-Gig) — CAD**

This directory contains the complete business document stack for floyo, a local-first workflow automation tool that suggests API integrations based on user routines.

## Document Structure

### 📋 Venture Brief (`/venture-brief/`)
- **01_one-pager.md** — Customer-facing one-page overview
- **02_problem-solution-fit.md** — Problem statement and solution validation
- **03-value-prop-matrix.md** — Value proposition framework
- **04-customer-personas.md** — Target user personas
- **05-competitive-landscape.md** — Competitive analysis
- **06_mvp-spec.md** — MVP specification and acceptance criteria
- **07-product-roadmap-q1-q4.md** — 12-month product roadmap

### ✅ Approvals (`/approvals/`)
- **appstore-apple-listing.md** — Apple App Store listing requirements
- **appstore-google-play-listing.md** — Google Play Store listing
- **shopify-app-listing.md** — Shopify App Store listing (if applicable)
- **merchant-center-readiness.md** — Google Merchant Center setup
- **privacy-policy-pipeda.md** — PIPEDA-compliant privacy policy
- **terms-of-service.md** — Terms of Service
- **dpia-privacy-impact-assessment.md** — Data Protection Impact Assessment
- **casl-compliance-checklist.md** — CASL email marketing compliance
- **accessibility-wcag22-checklist.md** — WCAG 2.2 accessibility checklist

### 🔧 Operations (`/operations/`)
- **sop-customer-support.md** — Customer support standard operating procedures
- **sop-incident-comms.md** — Incident communication templates
- **refund-cancellation-policy.md** — Refund and cancellation policy
- **sla-internal.md** — Internal service level agreements
- **data-retention-policy.md** — Data retention and deletion policy
- **risk-register.md** — Risk register and mitigation strategies

### 📢 Marketing (`/marketing/`)
- **gtm-plan-90days.md** — 90-day go-to-market plan
- **content-calendar-8w.md** — 8-week content calendar
- **launch-press-kit.md** — Launch press kit and media assets
- **social-post-bank.md** — Pre-written social media posts
- **places-to-post-and-why.md** — Community posting strategy
- **influencer-outreach-templates.md** — Influencer outreach email templates

### 💰 Sales (`/sales/`)
- **pricing-pack-cad.md** — Pricing tiers (CAD) and value metrics
- **sales-scripts-and-objection-handling.md** — Sales scripts and objection handling
- **partnership-outreach-emails.md** — Partnership outreach templates

### 💵 Finance (`/finance/`)
- **unit-economics-cad.xlsx** — Unit economics model (CSV format available)
- **12mo-cashflow-forecast-cad.xlsx** — 12-month cashflow forecast
- **runway-breakeven-scenarios-cad.xlsx** — Breakeven scenario analysis
- **gst-hst-tracker-on.csv** — GST/HST tracking template (Ontario)
- **budget-minimal-stack-cad.md** — Minimal tech stack budget

### 🚀 Investor (`/investor/`)
- **seed-memo-3p.md** — 3-page seed funding memo
- **pitch-deck-outline-10slides.md** — 10-slide pitch deck outline
- **data-room-checklist.md** — Investor data room checklist
- **safe-or-note-overview-canada.md** — SAFE/convertible note overview (Canada)
- **traction-metrics-template.md** — Traction metrics tracking template

### 📊 Telemetry & UX (`/telemetry-ux/`)
- **kpis-and-dashboard-spec.md** — KPI definitions and dashboard specification
- **user-feedback-loops.md** — User feedback collection and analysis
- **cohort-analysis-template.csv** — Cohort analysis template

## Business Context

- **Venture Name:** floyo
- **Business Form:** Sole Proprietor (Ontario)
- **Province:** Ontario (default)
- **Currency:** CAD (Canadian Dollar)
- **Tax Rate:** GST/HST 13% (Ontario)
- **Privacy Framework:** PIPEDA (Personal Information Protection and Electronic Documents Act)
- **Email Marketing:** CASL (Canada's Anti-Spam Legislation)

## Customization Guide

### Province/Tax Override
If your business operates in a different province, update:
- GST/HST rate in `/finance/budget-minimal-stack-cad.md`
- Tax rate in `/finance/gst-hst-tracker-on.csv` (rename to appropriate province code)
- Province references in privacy policy and terms of service

### Branding
- Update company name references from "floyo" to your venture name
- Add logo paths to `/docs/.theme/marp-config.json` for PDF rendering
- Update contact email addresses (search for `[YOUR-EMAIL]` placeholders)

### Secrets & Placeholders
- Replace `[YOUR-EMAIL]` with your support email
- Replace `[YOUR-DOMAIN]` with your domain name
- Replace `[YOUR-COMPANY-NAME]` with your registered business name
- Review all API keys and service URLs in financial models

## PDF Generation

All markdown documents are automatically rendered to PDF via GitHub Actions on push to `main` or manual workflow dispatch.

PDFs are available in `/docs/business/_pdf/` after CI completion.

To render locally:
```bash
npm install -g @marp-team/marp-cli
marp docs/business/**/*.md --pdf --output docs/business/_pdf/
```

## Quick Links

- [One-Pager](./venture-brief/01_one-pager.md) — Start here for customer-facing overview
- [MVP Spec](./venture-brief/06_mvp-spec.md) — Product development reference
- [GTM Plan](./marketing/gtm-plan-90days.md) — Launch strategy
- [Pricing](./sales/pricing-pack-cad.md) — Pricing tiers and strategy
- [Seed Memo](./investor/seed-memo-3p.md) — Investor materials

---

**Last Updated:** 2024-01-XX  
**Version:** 1.0.0  
**Status:** Production-ready templates
