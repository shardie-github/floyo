# Self-Operating Production Framework

This repository is a **self-operating production framework** built with TypeScript + Node + Prisma (WASM) + Supabase + Vercel, designed to run entirely in Termux (ARM64) with zero native dependencies.

## 🚀 Quick Start

```bash
# Initialize the framework
npm run ops init

# Run health checks
npm run ops doctor

# Deploy
npm run ops release
```

## 📋 Operations Schedule

### Daily
```bash
npm run ops doctor      # Check reports → fix → release if green
```

### Weekly
```bash
npm run ops release           # Release pipeline
npm run ops:growth-report     # Generate growth metrics
npm run ops rotate-secrets    # Rotate secrets
```

### Monthly
```bash
npm run ops:dr-rehearsal      # Disaster recovery rehearsal
npm run ops:deps-update       # Update dependencies
npm run ops:red-team          # Security sweep
```

## 🛠️ Operations CLI

The framework includes a comprehensive CLI (`ops`) with the following commands:

| Command | Description |
|---------|-------------|
| `ops doctor` | Run comprehensive health checks |
| `ops init` | Initialize production framework |
| `ops check` | Run safety checks before deployment |
| `ops release` | Execute full release pipeline |
| `ops snapshot` | Create encrypted database snapshot |
| `ops restore` | Restore database from snapshot |
| `ops rotate-secrets` | Rotate secrets and push to Supabase + Vercel |
| `ops sb-guard` | Scan Supabase for RLS + SECURITY DEFINER issues |
| `ops test:e2e` | Run end-to-end tests |
| `ops benchmark` | Run performance benchmarks |
| `ops lintfix` | Fix linting issues automatically |
| `ops docs` | Rebuild documentation |
| `ops changelog` | Generate CHANGELOG from commits |

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 20.x (Termux-compatible)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma with WASM support
- **Frontend**: Next.js 14
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

### Key Features

#### 1. Master Orchestrator (`/ops/`)
- Comprehensive CLI for all operations
- Automated health checks
- Full release pipeline
- Documentation generation

#### 2. Reality Suite (`/tests/reality/`)
- Playwright E2E tests
- Synthetic monitors (hourly CI)
- Contract tests for Supabase, webhooks
- Stubs for TikTok/Meta APIs
- Webhook notifications on failures

#### 3. Secrets Regimen
- `.env.example` template
- `.envrc` for direnv
- Automated secret rotation (20-day alerts)
- `requireEnv()` helper for validation

#### 4. RLS Enforcer
- Automated Supabase RLS scanning
- Auto-generates least-privilege policies
- Audit reports: `/ops/reports/rls-audit.md`
- Negative tests ensure cross-tenant reads fail

#### 5. Migration Safety
- Shadow migrations
- Encrypted snapshots
- Pre-flight lock checks
- CI blocks unsafe commits

#### 6. Observability Suite
- OpenTelemetry tracing
- P95 latency/error/cost metrics
- Dashboard: `/ops/reports/index.html`
- GitHub Pages artifact

#### 7. Performance Budgets
- Lighthouse CI integration
- Bundle analyzer
- Budgets: LCP < 2.5s, CLS < 0.1, TBT < 300ms, JS < 170KB
- CI fails on regressions

#### 8. Release Train
- Semantic versioning
- Automated CHANGELOG generation
- Vercel immutable deploys
- Production aliases (prod, prod-1 warm)
- Webhook announcements

#### 9. DR Playbook (`/ops/runbooks/DR.md`)
- Quarterly CI rehearsal
- Automated RTO/RPO validation
- Snapshot restore procedures

#### 10. Growth Engine
- UTM tracking (first/last touch)
- Weekly cohort analysis
- LTV calculations
- CSV reports: `/ops/reports/growth.md`

#### 11. Compliance Guard
- Data inventory mapping
- DSAR endpoints (export/delete)
- Cookie consent logic
- Do Not Track support
- Log redaction utilities

#### 12. AI Agent Guardrails
- Schema validation for all LLM calls
- Timeouts and retries
- Circuit breaker pattern
- Offline fallback support
- `ops agent:dryrun` for local simulation

#### 13. Offers & Paywalls
- Feature-flagged pricing
- A/B testing framework
- Admin UI (`/admin`) for live toggle

#### 14. Internationalization
- Message extraction
- CSV/JSON language packs
- CI fails on missing keys

#### 15. Auto-Generated Docs
- Mermaid architecture diagrams
- Endpoint examples
- "Why this wins" README
- `ops docs` rebuilds on commit

#### 16. Red-Team Tests
- Auth bypass attempts
- Rate limit enforcement
- RLS breach simulation
- Regression tests for all fixes

#### 17. Billing Stub
- Stripe test mode webhooks
- Feature flag: `ENABLE_BILLING`
- Webhook validation in CI

#### 18. Store Pack (`/ops/store/`)
- Google Play manifest
- App Store manifest
- Privacy labels
- Lint checklist

#### 19. Quiet Mode
- Global config toggle
- Degrades non-critical features
- Maintenance banner
- Test coverage

#### 20. Cost Caps
- Quota enforcement
- Throttling logic
- Cost simulation tests
- Actionable alerts

#### 21. Partner Hooks (`/partners/`)
- Integration contracts
- Postman collection
- Webhook + event schemas
- Contract tests

## 📊 Exit Criteria

✅ `npm run ops doctor` = 0 (locally and CI)  
✅ `ops release` performs full deploy and rollback  
✅ All budgets/tests pass  
✅ Dashboard + growth + compliance reports generated  
✅ System survives offline, high load, and incident modes  

## 🔒 Security

- RLS policies enforced on all Supabase tables
- Secret rotation every 20 days
- Audit logging for all sensitive operations
- DSAR compliance (export/delete with audit trail)
- Red-team tests in CI

## 📈 Monitoring

- Real-time dashboard: `/ops/reports/index.html`
- Performance budgets enforced
- Cost tracking and alerts
- Error rate monitoring
- P95 latency tracking

## 🚨 Incident Response

Enable quiet mode during incidents:
```bash
QUIET_MODE=true npm run ops doctor
```

This degrades non-critical features while maintaining core functionality.

## 📚 Documentation

- Runbooks: `/ops/runbooks/`
- API docs: `/ops/docs/`
- Architecture: `/ops/docs/architecture.md`
- Reports: `/ops/reports/`

## 🤝 Contributing

1. Run `npm run ops doctor` before committing
2. Ensure all tests pass: `npm run test`
3. Check performance budgets: `npm run ops benchmark`
4. Update CHANGELOG: `npm run ops changelog`

## 📝 License

Apache-2.0

---

**Why This Wins**: Self-operating, secure, observable, monetizable, testable, and deploy-ready with minimal human input. Built for solo startups who need production-grade infrastructure without the operational overhead.
