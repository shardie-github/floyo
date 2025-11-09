# Performance Intelligence Layer

> Autonomous observability and optimization system for the Hardonia stack

## Overview

The Performance Intelligence Layer automatically collects, analyzes, and optimizes performance metrics across all connected services (backend, frontend, CI/CD) without manual intervention.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Performance Intelligence Layer                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Data Sources → Supabase metrics_log → Analysis → Actions  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Vercel   │  │ Supabase │  │ Expo     │  │ GitHub   │  │
│  │ Analytics│  │ Queries  │  │ Builds   │  │ Actions  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│       │             │             │             │          │
│       └─────────────┴─────────────┴─────────────┘          │
│                        │                                    │
│                  metrics_log table                           │
│                        │                                    │
│       ┌────────────────┴────────────────┐                  │
│       │                                 │                  │
│  ┌────▼────┐                    ┌──────▼─────┐            │
│  │ Analysis│                    │ Dashboard  │            │
│  │ Engine  │                    │ /admin/    │            │
│  └────┬────┘                    │ metrics    │            │
│       │                         └────────────┘            │
│       │                                                    │
│  ┌────▼────┐                                              │
│  │ Auto    │                                              │
│  │ Optimize│                                              │
│  └─────────┘                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Metrics Collection

#### Supabase Table: `metrics_log`

```sql
create table metrics_log (
  id bigint generated always as identity primary key,
  ts timestamptz default now(),
  source text not null,  -- 'vercel', 'supabase', 'expo', 'ci', 'client', 'telemetry'
  metric jsonb not null,
  created_at timestamptz default now()
);
```

#### Data Sources

- **Vercel Analytics**: Core Web Vitals (LCP, CLS, TTFB, errors)
- **Supabase**: Query latency, row counts, edge latency
- **Expo**: Bundle size, build duration, success rate
- **GitHub Actions**: CI timing, failures, queue length
- **Client Telemetry**: Real-time browser performance metrics

### 2. API Endpoints

#### `/api/metrics` (GET)
Returns aggregated performance metrics as JSON:
```json
{
  "performance": {
    "webVitals": { "LCP": 1.8, "CLS": 0.01 },
    "supabase": { "avgLatencyMs": 120 },
    "expo": { "bundleMB": 24 },
    "ci": { "avgBuildMin": 5.2 }
  },
  "status": "healthy",
  "lastUpdated": "2025-01-06T12:00:00Z",
  "trends": { "LCP": -5.2 },
  "recommendations": []
}
```

#### `/api/telemetry` (POST)
Accepts client-side performance beacons:
```json
{
  "url": "/dashboard",
  "ttfb": 120,
  "lcp": 1800,
  "cls": 0.01,
  "userAgent": "...",
  "timestamp": 1234567890
}
```

### 3. Dashboard

**Location:** `/admin/metrics`

Features:
- Real-time performance metrics visualization
- Trend analysis (7-day moving average)
- Regression detection alerts
- Optimization recommendations
- Raw JSON view

Built with:
- React + Next.js
- Recharts for visualization
- Auto-refresh every 60 seconds

### 4. Automated Collection

**GitHub Workflow:** `.github/workflows/telemetry.yml`

Runs:
- Nightly at 2 AM UTC
- On main branch pushes
- Manual trigger via `workflow_dispatch`

Collects:
- Vercel analytics (if `VERCEL_TOKEN` configured)
- GitHub Actions CI metrics
- Expo build metrics (if `EXPO_TOKEN` configured)
- Stores all data in `metrics_log` table

### 5. Auto-Analysis

**Supabase Edge Function:** `analyze-performance`

Detects:
- Performance regressions (>10% degradation)
- Slow queries (>200ms)
- Large bundles (>30MB)
- CI queue buildup (>3 pending)

Generates:
- Optimization recommendations
- Regression alerts
- Status indicators (healthy/degraded/regression)

### 6. Client-Side Telemetry

**Component:** `TelemetryBeacon`

Automatically collects:
- Navigation timing (TTFB, DNS, TCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Resource timing
- Connection type

Privacy:
- IP addresses anonymized (first 2 octets only)
- Respects `telemetry_opt_out` localStorage flag
- Non-blocking (uses `navigator.sendBeacon`)

## Setup

### 1. Database Migration

Run the Supabase migration:
```bash
supabase migration up
```

Or apply manually:
```sql
-- See: supabase/migrations/20250106000000_metrics_log.sql
```

### 2. Environment Variables

Required:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional (for automated collection):
```bash
VERCEL_TOKEN=your_vercel_token
EXPO_TOKEN=your_expo_token
GITHUB_TOKEN=your_github_token  # Auto-provided in GitHub Actions
TELEMETRY_WEBHOOK_URL=your_slack_or_discord_webhook  # For alerts
```

### 3. Deploy Supabase Functions

```bash
supabase functions deploy analyze-performance
```

### 4. Enable Client Telemetry

The `TelemetryBeacon` component is automatically included in the root layout. No additional setup needed.

## Usage

### View Dashboard

Navigate to `/admin/metrics` in your application.

### Generate Performance Report

```bash
python3 scripts/generate_performance_report.py
```

Generates `PERFORMANCE_REPORT.md` with:
- 7-day performance summary
- Trend analysis
- Optimization recommendations
- Cost estimates

### Run Auto-Optimization

```bash
python3 scripts/auto_optimize.py
```

Analyzes metrics and applies safe optimizations (currently logs recommendations; destructive changes require manual approval).

### Manual Metrics Collection

```bash
# Collect Vercel metrics
vercel analytics pull --json | jq '.webVitals'

# Store custom metric
curl -X POST "$SUPABASE_URL/rest/v1/metrics_log" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "custom",
    "metric": {"customMetric": 123}
  }'
```

## Regression Detection

The system automatically detects regressions when:

1. **Metric degrades >10%** compared to previous period
2. **Three consecutive regressions** occur
3. **Thresholds exceeded:**
   - LCP > 2500ms
   - CLS > 0.1
   - Supabase latency > 200ms
   - Expo bundle > 30MB
   - CI queue > 3 pending

When detected:
- GitHub issue created (if configured)
- Webhook alert sent (if `TELEMETRY_WEBHOOK_URL` set)
- Dashboard shows regression status
- Recommendations generated

## Optimization Recommendations

The system suggests:

1. **Image Optimization**: Enable compression, use `next-image`
2. **Database Indexing**: Add indexes for slow queries
3. **Bundle Optimization**: Run `expo optimize` for large bundles
4. **CI Throttling**: Reduce workflow concurrency
5. **CDN Caching**: Adjust cache headers based on usage patterns

## Self-Learning Features

The system adapts over time:

1. **Cache TTL Optimization**: Adjusts `Cache-Control` headers based on 7-day usage patterns
2. **Index Recommendations**: Suggests database indexes based on query patterns
3. **CI Parallelism**: Adjusts GitHub Actions concurrency based on queue data
4. **Bundle Analysis**: Identifies large dependencies for optimization

## Privacy & Security

- **IP Anonymization**: Only first 2 octets stored
- **RLS Policies**: Row-level security on `metrics_log` table
- **No PII**: User identifiers optional and anonymized
- **Opt-Out**: Users can disable via `localStorage.setItem('telemetry_opt_out', 'true')`
- **Service Role**: Only used server-side, never exposed to client

## Monitoring

### Health Checks

```bash
# Check metrics endpoint
curl https://your-domain.com/api/metrics

# Check analysis function
curl -X POST "$SUPABASE_URL/functions/v1/analyze-performance" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Logs

- **Supabase**: Check Edge Function logs in Supabase dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **GitHub Actions**: Check workflow logs in Actions tab

## Troubleshooting

### No metrics appearing

1. Check Supabase connection: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Verify migration applied: `SELECT * FROM metrics_log LIMIT 1;`
3. Check RLS policies: Ensure service role can insert
4. Verify telemetry beacon: Check browser console for errors

### Dashboard not loading

1. Check `/api/metrics` endpoint: `curl https://your-domain.com/api/metrics`
2. Verify Supabase credentials in API route
3. Check browser console for errors
4. Verify Recharts is installed: `npm list recharts`

### GitHub workflow failing

1. Check secrets configured: `VERCEL_TOKEN`, `EXPO_TOKEN`, etc.
2. Verify Supabase credentials in workflow
3. Check workflow logs for specific errors
4. Ensure `jq` and `bc` are available in runner

## Future Enhancements

- [ ] OpenTelemetry integration for distributed tracing
- [ ] ML-based anomaly detection (z-score, Prophet)
- [ ] Grafana dashboard integration
- [ ] EAS crash analytics integration
- [ ] Predictive scaling recommendations
- [ ] Cost optimization suggestions
- [ ] A/B testing performance impact analysis

## Contributing

When adding new metrics:

1. Add source to `metrics_log.source` enum
2. Update aggregation logic in `/api/metrics`
3. Add visualization to `/admin/metrics` dashboard
4. Update regression detection in `analyze-performance` function
5. Document in this README

## License

Apache-2.0

---

**Built with ❤️ for continuous performance improvement**
