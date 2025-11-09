# Reliability, Financial & Security Orchestrator

Autonomous monitoring and remediation system for the Hardonia full-stack environment (Vercel × Supabase × Expo × GitHub).

## 🎯 Overview

The orchestrator continuously monitors:
- **Reliability**: Uptime, latency, error frequency, build health
- **Financial**: Infrastructure costs, budget forecasting, cost optimization
- **Security**: Dependency vulnerabilities, secrets, compliance (GDPR/SOC 2/ISO 27001)

## 🚀 Quick Start

### Run Full Orchestrator Cycle

```bash
npm run ops:orchestrate -- --full
```

### Run Specific Checks

```bash
# Check dependencies only
npm run ops:orchestrate -- --dependencies

# Security audit only
npm run ops:orchestrate -- --security

# Cost forecasting only
npm run ops:orchestrate -- --costs

# Uptime monitoring only
npm run ops:orchestrate -- --uptime

# Error triage only
npm run ops:orchestrate -- --errors

# Generate dashboards only
npm run ops:orchestrate -- --dashboards

# Create auto-PRs for safe fixes
npm run ops:orchestrate -- --auto-pr
```

## 📊 Outputs

The orchestrator generates several reports and dashboards:

### Reports
- `dependency-report.json` - Dependency health analysis
- `cost_forecast.json` - Cost predictions and trends
- `reliability_trends.json` - Uptime and performance trends
- `SECURITY_COMPLIANCE_REPORT.md` - Comprehensive security audit

### Dashboards
- `admin/reliability.json` - Machine-readable reliability dashboard
- `admin/reliability.md` - Human-readable reliability dashboard
- `admin/compliance.json` - Compliance status dashboard

### Audit Logs
- `compliance/audits/YYYY-MM-DD/orchestrator-report.json` - Daily audit snapshots

## ⚙️ Configuration

Create `config/orchestrator.json`:

```json
{
  "budget": 75,
  "reliabilityWebhook": "https://your-webhook-url.com/alerts"
}
```

### Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional:
- `GITHUB_TOKEN` - For auto-PR creation
- `VERCEL_TOKEN` - For Vercel metrics collection
- `RELIABILITY_ALERT_WEBHOOK` - Webhook URL for alerts

## 🔄 Automated Runs

The orchestrator runs automatically via GitHub Actions every 6 hours. See `.github/workflows/orchestrator.yml`.

You can also trigger it manually:
1. Go to Actions → Reliability, Financial & Security Orchestrator
2. Click "Run workflow"
3. Select options and run

## 📋 Features

### 1. Dependency Health

- Runs `pnpm outdated` and `npm audit`
- Detects outdated and vulnerable packages
- Groups by service (root, frontend, etc.)
- Identifies safe patch/minor upgrades
- Validates lockfile consistency

### 2. Cost Forecasting

- Collects metrics from Vercel, Supabase, GitHub Actions
- Computes rolling averages for costs
- Predicts monthly costs with ±10% accuracy
- Generates optimization recommendations
- Alerts if cost > budget

### 3. Security & Compliance

- **Secrets Audit**: Scans codebase for exposed secrets
- **SBOM Generation**: Creates CycloneDX SBOM
- **License Check**: Flags GPL and restricted licenses
- **TLS Audit**: Verifies HTTPS enforcement
- **RLS Validation**: Checks Supabase RLS policies
- **GDPR Checks**: Validates data anonymization, consent, export/deletion

### 4. Uptime Monitoring

- Pings `/api/health` and Supabase endpoints every 6h
- Records latency in `metrics_log` table
- Alerts if downtime > 2 minutes
- Tracks uptime trends over 30 days

### 5. Error Triage

- Analyzes deployment logs and CI runs
- Classifies errors (build, API, auth, network)
- Identifies recurring failures (>3 occurrences)
- Auto-creates GitHub issues for recurring problems
- Suggests fixes when possible

### 6. Auto-PR Creation

- Creates PRs for safe patch/minor dependency updates
- Labels PRs with `security-auto`
- Includes changelog notes when available
- Groups updates by service

## 🛡️ Guardrails

- **Never exposes secrets** - Only reports patterns, never values
- **Safe mode by default** - Simulates → logs → creates PRs
- **No breaking changes** - Only patch/minor upgrades auto-PR'd
- **Audit retention** - Keeps last 3 audit snapshots

## 📈 Success Criteria

- ✅ All services ≥ 99.9% uptime
- ✅ No high-severity vulnerabilities open > 48h
- ✅ Monthly cost forecast within ±10% accuracy
- ✅ GDPR/SOC 2/ISO 27001 hygiene met
- ✅ Dashboards auto-refresh post-deploy

## 🔧 Troubleshooting

### Orchestrator fails to connect to Supabase

Check environment variables:
```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Auto-PR creation fails

Ensure `GITHUB_TOKEN` is set and has `repo` permissions.

### Cost forecasting inaccurate

The cost model is simplified. For production, integrate with actual billing APIs:
- Vercel API for usage metrics
- Supabase API for database usage
- GitHub API for Actions minutes

## 📚 Integration Examples

### Add Custom Metrics

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

await supabase.from('metrics_log').insert({
  source: 'custom',
  metric: {
    type: 'custom_metric',
    value: 123,
    timestamp: new Date().toISOString(),
  },
});
```

### Query Reliability Trends

```typescript
const { data } = await supabase
  .from('metrics_log')
  .select('metric, ts')
  .eq('source', 'telemetry')
  .eq('metric->>type', 'health')
  .order('ts', { ascending: false })
  .limit(100);
```

## 🔮 Future Enhancements

- [ ] OpenTelemetry integration → Grafana dashboards
- [ ] AI anomaly detection (Z-score/Prophet) for proactive alerts
- [ ] Slack/Discord webhook integration
- [ ] Weekly digest → Google Sheet or email
- [ ] Real-time cost tracking via billing APIs

## 📄 License

Apache-2.0

---

*Built for Hardonia - Autonomous reliability, financial, and security orchestration*
