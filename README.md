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

## License

Apache-2.0
