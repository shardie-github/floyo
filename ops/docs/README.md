# Production Framework

## Overview

This is a self-operating production framework designed for solo startups. It provides comprehensive operations tooling with minimal human input.

## Architecture

```
/ops/
  cli.ts                 # Main CLI entry point
  commands/              # Individual command implementations
  utils/                 # Shared utilities
  docs/                  # Auto-generated documentation
  reports/               # Generated reports and dashboards
  runbooks/              # Operational runbooks
  secrets/               # Secret management
  store/                 # App store manifests

/tests/
  reality/               # E2E and synthetic monitors
  
/prisma/
  schema.prisma          # Database schema (WASM-compatible)

/partners/
  README.md              # Integration contracts
  postman-collection.json # Postman collection
```

## Getting Started

1. **Initialize:**
   ```bash
   npm install
   npm run ops init
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run health checks:**
   ```bash
   npm run ops doctor
   ```

4. **Deploy:**
   ```bash
   npm run ops release
   ```

## CI/CD

GitHub Actions workflows are configured in `.github/workflows/ci.yml`:
- Matrix CI (unit, e2e, contracts)
- Synthetic monitors (hourly)
- Performance budgets (Lighthouse CI)
- Migration safety checks
- RLS security scanning
- Release pipeline

## Monitoring

- Dashboard: `/ops/reports/index.html`
- Growth reports: `/ops/reports/growth.md`
- RLS audit: `/ops/reports/rls-audit.md`

## Support

See `OPS_README.md` for comprehensive documentation.
