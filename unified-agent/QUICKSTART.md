# Unified Agent System - Quick Start

## 🚀 Getting Started in 5 Minutes

### 1. Verify Installation

The Unified Agent System is already set up in this repository. Verify it's ready:

```bash
npm run unified-agent:status
```

### 2. Run Your First Agent Cycle

Run all agents to generate initial artifacts:

```bash
npm run unified-agent:run
```

This will:
- Detect your repository context
- Collect reliability metrics
- Analyze costs
- Run security audit
- Update documentation
- Generate sprint plan
- Create reflection report

### 3. View Generated Artifacts

Check the generated files:

```bash
# View reliability report
cat admin/reliability.md

# View cost analysis
cat admin/cost.md

# View security compliance
cat admin/compliance.md

# View sprint plan
cat roadmap/current-sprint.md

# View next steps
cat auto/next-steps.md
```

### 4. Access Metrics Dashboard

If you're running the frontend:

```bash
cd frontend && npm run dev
```

Then navigate to: `http://localhost:3000/admin/metrics`

### 5. Configure GitHub Actions (Optional)

The system includes automated GitHub Actions workflows. To enable:

1. Ensure `.github/workflows/unified-agent.yml` is committed
2. Configure secrets in repository settings:
   - `VERCEL_TOKEN` (optional, for cost tracking)
   - `SUPABASE_URL` (optional, for Supabase metrics)
   - `SUPABASE_SERVICE_KEY` (optional)
   - `EXPO_TOKEN` (optional, for Expo projects)

3. Workflows will run automatically on schedule

## Common Commands

### Run Specific Agent

```bash
# Reliability monitoring
npm run unified-agent:run -- --reliability

# Cost analysis
npm run unified-agent:run -- --cost

# Security audit
npm run unified-agent:run -- --security

# Documentation update
npm run unified-agent:run -- --docs

# Sprint planning
npm run unified-agent:run -- --planning

# Reflection cycle
npm run unified-agent:run -- --reflection
```

### Skip Specific Agents

```bash
# Run all except cost
npm run unified-agent:run -- --skip-cost

# Run all except security
npm run unified-agent:run -- --skip-security
```

## Understanding the Output

### Repository Context Detection

The system automatically detects:
- **Type**: monorepo, webapp, mobile, backend, library
- **Modes**: webapp, mobile, backend, library
- **Frameworks**: Next.js, Expo, FastAPI, etc.
- **Package Manager**: npm, yarn, pnpm, pip
- **Databases**: PostgreSQL (via Prisma/Supabase)
- **Cloud Providers**: Vercel, Supabase, Expo

### Generated Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Reliability Metrics | `admin/reliability.json` | Performance snapshots |
| Cost Analysis | `admin/cost.json` | Spending tracking |
| Security SBOM | `security/sbom.json` | Package inventory |
| Compliance Report | `admin/compliance.json` | Security baseline |
| Sprint Plan | `roadmap/current-sprint.md` | TODO organization |
| Intent Log | `docs/intent-log.md` | Commit reasoning |
| Next Steps | `auto/next-steps.md` | Optimization suggestions |

## Customization

### Adjust Schedules

Edit `.cursor/config/master-agent.json`:

```json
{
  "schedule": {
    "reliability": "0 */6 * * *",  // Every 6 hours
    "cost": "0 0 * * *",            // Daily at midnight
    "security": "0 */12 * * *"      // Every 12 hours
  }
}
```

### Adjust Thresholds

```json
{
  "thresholds": {
    "costOverrunPercent": 10,      // Alert if >10% overrun
    "regressionCount": 3,           // Alert after 3 regressions
    "duplicationThreshold": 30      // Flag if >30% duplication
  }
}
```

## Troubleshooting

### Agent Fails to Run

1. Check Node.js version (requires 18+):
   ```bash
   node --version
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Check TypeScript compilation:
   ```bash
   npm run type-check
   ```

### No Artifacts Generated

- Ensure you have write permissions
- Check that directories exist (`admin/`, `security/`, `roadmap/`, `auto/`, `docs/`)
- Review error messages in console output

### GitHub Actions Not Running

1. Verify workflow file exists: `.github/workflows/unified-agent.yml`
2. Check repository Actions tab for errors
3. Ensure secrets are configured (if using cloud integrations)

## Next Steps

1. **Review Generated Reports** - Check `admin/` directory for insights
2. **Customize Configuration** - Adjust schedules and thresholds
3. **Enable GitHub Actions** - Set up automated runs
4. **Integrate Dashboard** - Add metrics page to your frontend
5. **Extend Agents** - Customize agent logic for your needs

## Support

- Full documentation: `unified-agent/README.md`
- Implementation summary: `UNIFIED_AGENT_SYSTEM.md`
- Agent code: `unified-agent/core/`

---

**Ready to go!** Run `npm run unified-agent:run` to get started.
