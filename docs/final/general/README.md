# Unified Agent System

The Hardonia Unified Background + Composer Agent System - A continuous DevOps, FinOps, SecOps, and KnowledgeOps layer for all Hardonia-linked repositories.

## Overview

This system operates as a self-aware, self-maintaining, self-optimizing, self-protecting, and self-documenting agent across all connected projects. It automatically detects repository context and applies appropriate intelligence.

## Features

### 🎯 Core Capabilities

1. **Repository Context Detection** - Automatically identifies project type (WebApp, Mobile, Backend, Library, Monorepo)
2. **Reliability & Performance Monitoring** - Tracks latency, build time, payload size, error frequency
3. **Cost & Efficiency Tracking** - Monitors cloud costs and suggests optimizations
4. **Security & Compliance** - Builds SBOM, scans vulnerabilities, verifies security policies
5. **Documentation Auto-Update** - Maintains README, CHANGELOG, and architecture docs
6. **Planning & Roadmap** - Extracts TODOs/FIXMEs and generates sprint plans
7. **Observability & Telemetry** - Maintains metrics endpoint and dashboard
8. **Auto-Improvement & Reflection** - Self-evaluates and proposes optimizations

## Installation

```bash
npm install
```

## Usage

### Run All Agents

```bash
npm run unified-agent:run
```

### Run Specific Agent

```bash
npm run unified-agent:run -- --reliability
npm run unified-agent:run -- --cost
npm run unified-agent:run -- --security
npm run unified-agent:run -- --docs
npm run unified-agent:run -- --planning
npm run unified-agent:run -- --observability
npm run unified-agent:run -- --reflection
```

### Check Status

```bash
npm run unified-agent:status
```

## Generated Artifacts

The system generates the following artifacts:

| File | Purpose |
|------|---------|
| `admin/reliability.json` | Live uptime & latency snapshot |
| `admin/reliability.md` | Reliability report |
| `admin/cost.json` | Cost metrics |
| `admin/cost.md` | Cost report |
| `admin/compliance.json` | Security & privacy baseline |
| `admin/compliance.md` | Compliance report |
| `admin/metrics.json` | Metrics snapshot |
| `admin/metrics.jsx` | Dashboard visualization |
| `docs/intent-log.md` | Commit reasoning trail |
| `roadmap/current-sprint.md` | Auto sprint summary |
| `roadmap/current-sprint.json` | Sprint plan JSON |
| `auto/next-steps.md` | Self-reflection & recommendations |
| `auto/reflection.json` | Reflection report |
| `security/sbom.json` | SBOM + license inventory |

## Configuration

Configuration is stored in `.cursor/config/master-agent.json`:

```json
{
  "agentMode": "hardonia-global",
  "autoRun": true,
  "schedule": {
    "reliability": "0 */6 * * *",
    "cost": "0 0 * * *",
    "security": "0 */12 * * *",
    "documentation": "0 */4 * * *",
    "planning": "0 0 * * 1",
    "observability": "*/15 * * * *",
    "reflection": "0 2 * * *"
  },
  "thresholds": {
    "costOverrunPercent": 10,
    "regressionCount": 3,
    "duplicationThreshold": 30
  }
}
```

## GitHub Actions Integration

The system includes a GitHub Actions workflow (`.github/workflows/unified-agent.yml`) that runs agents on a schedule:

- **Reliability**: Every 6 hours
- **Cost**: Daily at midnight
- **Security**: Every 12 hours
- **Documentation**: Every 4 hours
- **Planning**: Weekly on Monday
- **Reflection**: Daily at 2 AM

## Architecture

```
unified-agent/
├── core/
│   ├── repo-context.ts          # Repository detection
│   ├── reliability-agent.ts    # Performance monitoring
│   ├── cost-agent.ts            # Cost tracking
│   ├── security-agent.ts        # Security & compliance
│   ├── documentation-agent.ts   # Auto-documentation
│   ├── planning-agent.ts        # TODO extraction & planning
│   ├── observability-agent.ts   # Metrics & telemetry
│   └── reflection-agent.ts      # Self-improvement
├── orchestrator.ts              # Main coordinator
├── cli.ts                       # CLI entry point
└── index.ts                     # Main exports
```

## Repository Context Detection

The system automatically detects:

- **Package Managers**: npm, yarn, pnpm, pip, poetry, cargo
- **Frameworks**: Next.js, Expo, FastAPI, Flask, etc.
- **Databases**: PostgreSQL (via Prisma/Supabase)
- **Cloud Providers**: Vercel, Supabase, Expo

## Safety & Guardrails

- Never exposes secret values
- Skips major upgrades unless CI passes
- Prefers PR → human merge over direct push
- Retains last 3 audit snapshots
- Default mode: Confirm → Log → Auto-PR

## Development

```bash
# Type check
npm run type-check

# Build
npm run build

# Run tests (if available)
npm test
```

## License

Apache-2.0
