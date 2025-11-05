# floyo

Tiny system app that suggests concrete, niche API integrations based on actual user routine: "This MS Word macro could be chained with last week's Python scraper and Dropbox move to create a new workflow—here's sample code." No cloud; totally local, learning from usage patterns, not vendors.

## Features

- 🔍 **Automatic File System Monitoring** - Tracks file access, creation, modification, and deletion
- 📊 **Pattern Detection** - Identifies usage patterns, temporal sequences, and file relationships
- 💡 **Smart Suggestions** - Suggests API integrations based on your actual workflow
- 🔗 **Relationship Mapping** - Detects input/output relationships and file dependencies
- ⏱️ **Temporal Analysis** - Learns sequential workflows and time-based patterns
- 🔒 **Privacy First** - All data stored locally, no cloud, no external services
- ⚙️ **Configurable** - Customize monitored directories, exclusions, and behavior

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Install in development mode
pip install -e .
```

## Quick Start

```bash
# Start automatic file system monitoring
floyo watch

# In another terminal, get suggestions
floyo suggest

# View usage patterns
floyo patterns

# Check tracking status
floyo status
```

## Commands

- `floyo watch` - Start file system monitoring
- `floyo suggest` - Show integration suggestions
- `floyo patterns` - Show usage patterns
- `floyo status` - Show tracking statistics
- `floyo temporal` - Show temporal patterns
- `floyo relationships [file]` - Show file relationships
- `floyo record <file>` - Manually record file access
- `floyo export <file>` - Export tracking data
- `floyo import <file>` - Import tracking data
- `floyo clear` - Clear all tracking data

See [USER_GUIDE.md](docs/USER_GUIDE.md) for detailed documentation.

## Configuration

Configuration is stored in `~/.floyo/config.toml`. Customize monitored directories, exclusion patterns, and more.

## Development

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=floyo

# View documentation
cat docs/USER_GUIDE.md
cat docs/DEVELOPER_GUIDE.md
```

See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for development documentation.

## Architecture

- **tracker.py** - Usage tracking and pattern analysis
- **suggester.py** - Integration suggestion engine
- **watcher.py** - File system monitoring (uses watchdog)
- **command_tracker.py** - Command execution tracking
- **config.py** - Configuration management
- **cli.py** - Command-line interface

## Requirements

- Python 3.7+
- watchdog (file system monitoring)
- pyyaml (configuration)
- toml (configuration)

---

## Next Sprint Priorities

### 🔴 Critical (P0) - Weeks 1-2
**Security & Compliance** - Must complete before launch
- [x] ✅ **2FA/MFA Support** - TOTP implementation (Google Authenticator compatible)
- [x] ✅ **Security Headers** - CSP, HSTS, X-Frame-Options middleware
- [x] ✅ **Data Encryption** - Encrypt sensitive fields (integration configs)
- [x] ✅ **Security Audit** - Comprehensive security event logging
- [ ] **Password Reset Flow** - Complete email service integration
- [ ] **Security Audit Review** - Penetration testing and vulnerability assessment

### 🟡 High Priority (P1) - Weeks 3-4
**Frontend Improvements & User Experience**
- [x] ✅ **Advanced Filtering UI** - Enhanced event and pattern filtering
- [x] ✅ **Data Visualization Charts** - Pattern and timeline charts
- [x] ✅ **Dark Mode Support** - Full dark mode implementation
- [x] ✅ **Loading States** - Skeleton screens and loading indicators
- [x] ✅ **Mobile Responsiveness** - Touch-optimized components and gestures
- [x] ✅ **Keyboard Shortcuts** - Power user keyboard navigation
- [ ] **Infinite Scroll** - Virtual scrolling for large lists
- [ ] **Pattern Timeline Visualization** - Enhanced time-based charts

### 🟡 High Priority (P1) - Weeks 5-6
**Testing & Quality Assurance**
- [x] ✅ **Security Tests** - 2FA, encryption, sanitization test coverage
- [x] ✅ **Frontend Component Tests** - Test infrastructure setup
- [ ] **Increase Test Coverage** - Target >80% coverage
- [ ] **Performance Testing** - Load testing with k6
- [ ] **Accessibility Testing** - WCAG 2.1 AA compliance
- [ ] **E2E Test Suite** - Comprehensive end-to-end tests

### Completed Features ✅

**Weeks 5-8: Growth Engine** ✅
- Retention optimization system with cohorts and campaigns
- Viral growth system with referral tracking
- Workflow sharing and marketplace foundation
- Growth analytics and metrics

**Weeks 9-12: Monetization** ✅
- Billing and subscription system (Free, Pro, Enterprise)
- Usage tracking and tier-based feature access
- LTV:CAC calculation and pricing intelligence

**Weeks 13-16: Enterprise & Ecosystem** ✅
- SSO integration framework (SAML/OIDC)
- Enterprise admin dashboard and analytics
- Compliance reporting (GDPR, SOC2)
- Workflow marketplace and ecosystem

**Security (P0) - Current Sprint** ✅
- 2FA/MFA implementation with TOTP
- Security headers middleware (CSP, HSTS, etc.)
- Data encryption for sensitive fields
- Security audit and event logging
- Password strength validation
- Input sanitization and validation

See [ROADMAP.md](ROADMAP.md) and [REMAINING_ROADMAP_ITEMS.md](REMAINING_ROADMAP_ITEMS.md) for complete roadmap details.

## 🏭 Production Framework

This repository includes a **self-operating production framework** with comprehensive operations tooling. See [OPS_README.md](./OPS_README.md) for full documentation.

**Quick Start:**
```bash
npm run ops init
npm run ops doctor
npm run ops release
```

**Key Features:**
- 🔍 Master Orchestrator CLI (`ops doctor | init | check | release | ...`)
- 🧪 Reality Suite (Playwright E2E + synthetic monitors)
- 🔐 Secrets Regimen (auto-rotation, 20-day alerts)
- 🛡️ RLS Enforcer (Supabase security scanning)
- 📸 Migration Safety (shadow migrations, encrypted snapshots)
- 📊 Observability Suite (OpenTelemetry, dashboards)
- ⚡ Performance Budgets (Lighthouse CI, bundle analyzer)
- 🚀 Release Train (semantic-release, Vercel deploys)
- 🔄 DR Playbook (quarterly automated rehearsals)
- 📈 Growth Engine (UTM tracking, cohort analysis, LTV)
- ✅ Compliance Guard (DSAR, cookie consent, data inventory)
- 🤖 AI Agent Guardrails (schema validation, circuit breaker)
- 💰 Offers & Paywalls (feature-flagged pricing, admin UI)
- 🌍 Internationalization (auto-extraction, CI validation)
- 📚 Auto-Generated Docs (Mermaid diagrams, endpoint examples)
- 🔴 Red-Team Tests (auth breaches, rate limits, RLS regression)
- 💳 Billing Stub (Stripe webhooks, feature flag)
- 📱 Store Pack (app store manifests, privacy labels)
- 🔇 Quiet Mode (incident degradation toggle)
- 💵 Cost Caps (quota enforcement, throttling)
- 🤝 Partner Hooks (integration contracts, Postman collection)

**Operations Schedule:**
- **Daily**: `ops doctor` → check reports → fix → release if green
- **Weekly**: `ops release` + growth report + rotate secrets
- **Monthly**: DR rehearsal + deps update + red-team sweep

## 🤖 Automated Operations Suite (CAD)

This repository includes a comprehensive **Automated Venture Operations Suite** designed for Canadian solo operators and small teams. All workflows, templates, and automation assets are self-contained and deployable from the repo.

**Quick Start:**
```bash
# Review daily routine
cat ops/daily-routine.md

# Set up automation blueprints
# See: ops/automation-blueprints/

# Use dashboard templates
# See: ops/dashboards/
```

**Key Components:**

### 📋 Operations Documentation
- **[Daily Routine](ops/daily-routine.md)** - 15-minute startup checklist for daily operations
- **[Helpdesk Playbook](ops/support/helpdesk-playbook.md)** - Customer support procedures and templates
- **[Chatbot FAQ Builder](ops/support/chatbot-faq-builder.md)** - Build and maintain FAQ system

### 📊 Marketing & Growth
- **[Automated Lead Flow Guide](ops/marketing/automated-leadflow-guide.md)** - Complete lead capture → CRM → email automation
- **[CRM Integration Guide](ops/marketing/crm-integration-guide.md)** - Notion, Airtable, Google Sheets integration
- **[Influencer Outreach Automation](ops/growth/influencer-outreach-automation.md)** - Systematic influencer partnership approach
- **[Content Seeding Checklist](ops/growth/content-seeding-checklist.md)** - Weekly content distribution schedule
- **[Community Engagement Plan](ops/growth/community-engagement-plan.md)** - Build and engage with online communities

### 💰 Funding & Legal
- **[Seed Prep Playbook](ops/funding/seed-prep-playbook.md)** - Complete seed funding preparation guide
- **[Investor Outreach Email Bank](ops/funding/investor-outreach-email-bank.md)** - Pre-written email templates for investors
- **[Grant and Incubator List — Canada](ops/funding/grant-and-incubator-list-canada.md)** - 2025 active programs (IRAP, SR&ED, Futurpreneur, etc.)
- **[Vendor Contract Template](ops/legal/vendor-contract-template.md)** - Standard vendor contract for Canadian ventures
- **[NDA Template](ops/legal/nda-template.md)** - Non-disclosure agreement template

### 🔧 Automation Blueprints
- **[Zapier/Make Flows](ops/automation-blueprints/zapier-make-flows.json)** - Pre-configured automation flows
- **[GitHub CI Auto-Deploy](ops/automation-blueprints/github-ci-autodeploy.yml)** - Auto-deploy to Vercel on push to main
- **[Supabase Backup](ops/automation-blueprints/github-ci-supabase-backup.yml)** - Weekly Supabase migration + backup
- **[Daily Analytics](ops/automation-blueprints/github-ci-analytics.yml)** - Daily analytics script + report generation
- **[Vercel Auto-Update](ops/automation-blueprints/vercel-autoupdate.yml)** - Vercel deployment configuration
- **[Supabase Maintenance](ops/automation-blueprints/supabase-maintenance.yml)** - Supabase maintenance and monitoring
- **[floyo Wellness Journaling](ops/automation-blueprints/floyo-wellness-journaling-automation.md)** - Wellness journaling automation flows (floyo-specific)

### 📈 Dashboard Templates
- **[Marketing Dashboard](ops/dashboards/marketing-dashboard-template.csv)** - Track social media, content performance
- **[Finance Dashboard](ops/dashboards/finance-dashboard-template.csv)** - Revenue tracking (CAD), GST/HST reconciliation
- **[KPI Tracker](ops/dashboards/kpi-tracker-template.csv)** - Daily metrics (DAU, MAU, MRR, CAC, LTV, etc.)

**Features:**
- ✅ All financials in CAD with GST/HST tracking
- ✅ Privacy and data-flow maps for automation
- ✅ Fallback/manual run instructions if automation fails
- ✅ Exportable to ZIP (no hidden dependencies)
- ✅ Tested workflows with valid syntax
- ✅ Self-contained documentation and scripts

**Operations Schedule:**
- **Daily**: Review `ops/daily-routine.md` → check automated reports → address issues
- **Weekly**: Review growth/finance dashboards → generate weekly reports
- **Monthly**: Review legal/funding docs → update investor CRM → plan content

For detailed setup instructions, see individual files in `/ops/` directory.

## License

Apache-2.0
