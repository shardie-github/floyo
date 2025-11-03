# Connectivity Reports

This directory contains generated connectivity verification reports.

## Files

- `connectivity.json` - Machine-readable connectivity matrix (JSON)
- `wiring_report.md` - Human-readable summary report (Markdown)
- `env_inventory.md` - Environment variable inventory

## Regenerating Reports

```bash
# From workspace root
pnpm wiring:run
```

Reports are generated automatically by the wiring harness and overwritten on each run.

## Viewing Reports

### JSON Report
```bash
pnpm wiring:report
# or
cat reports/connectivity/connectivity.json | jq
```

### Markdown Report
```bash
cat reports/connectivity/wiring_report.md
```

### Dashboard
Visit `/admin/wiring` in the Next.js app to view the interactive dashboard.

## Report Structure

### Connectivity Matrix (JSON)

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "checks": [
    {
      "system": "Environment",
      "check": "Required: DATABASE_URL",
      "status": "PASS",
      "latency": 0,
      "evidence": ["DATABASE_URL is set (...)"]
    }
  ],
  "summary": {
    "total": 50,
    "pass": 45,
    "fail": 0,
    "degraded": 5,
    "skip": 0
  }
}
```

### Status Values

- **PASS** ? - Check succeeded
- **FAIL** ? - Check failed (requires attention)
- **DEGRADED** ?? - Check works but using fallback/mock
- **SKIP** ?? - Check skipped (not applicable)

## CI Integration

Reports are uploaded as artifacts in CI workflows. Check the "connectivity-reports" artifact after workflow completion.
