# Living Architecture Guide

**Generated:** 2024-12-19  
**Purpose:** This guide explains how the living architecture system works, how it evolves, and how to maintain self-healing behavior.

## Overview

The Living Architecture System transforms static audit findings into active, enforceable, and observable system intelligence. Instead of relying on manual documentation that drifts over time, we've codified architectural truths into automated checks, monitors, and guardrails.

## Core Components

### 1. Guardrails (`infra/selfcheck/guardrails.yaml`)

Guardrails define architectural invariants—conditions that must always be true for the system to maintain integrity. These are derived from audit findings and categorized by:

- **Security**: Critical security requirements (SECRET_KEY, CORS, credentials)
- **Resilience**: Failure prevention and isolation (circuit breakers, pool monitoring)
- **Architecture**: Structural integrity (no circular deps, module size limits)
- **Contracts**: API and database contracts (migrations, schema consistency)
- **Configuration**: Configuration management (env completeness, no duplication)
- **Documentation**: Living documentation requirements

**Example Guardrail:**
```yaml
- name: "SECRET_KEY_NOT_DEFAULT"
  description: "SECRET_KEY must not be default in production"
  condition: "config.environment == 'production' -> config.secret_key != 'your-secret-key-change-in-production'"
  severity: "critical"
  priority: "P0"
```

### 2. Validation Scripts (`infra/selfcheck/*.py`)

Validation scripts check guardrail conditions:

- `validate_guardrails.py` - Main validation script
- `check_migration_status.py` - Database migration status
- `check_circular_deps.py` - Circular dependency detection
- `validate_env_completeness.py` - Environment variable completeness
- `check_config_duplication.py` - Configuration duplication detection
- `check_critical_docstrings.py` - Critical function documentation

**Usage:**
```bash
# Validate all guardrails
python infra/selfcheck/validate_guardrails.py

# Strict mode (fail on critical violations)
python infra/selfcheck/validate_guardrails.py --strict

# JSON output
python infra/selfcheck/validate_guardrails.py --json
```

### 3. CI/CD Integration (`.github/workflows/ci-intent-tests.yml`)

Architectural integrity checks run automatically on:

- **Pull Requests**: Block PRs with critical violations
- **Pushes to main/develop**: Validate architectural integrity
- **Nightly**: Scheduled drift detection report

**Workflow Jobs:**
1. **selfcheck**: Validates all guardrails
2. **lint-architecture**: Checks circular dependencies, module size
3. **schema-validate**: Validates database schema and migrations
4. **api-contract-tests**: Tests API contract compliance
5. **architectural-integrity**: Generates integrity report

### 4. SLO Monitors (`infra/selfcheck/slo-monitors.yml`)

Service Level Objectives (SLOs) from audit findings are configured as monitors:

- **API Availability**: 99.9% uptime (health endpoint)
- **API Latency**: P95 < 200ms, P99 < 500ms
- **Data Consistency**: 99.99% consistency

These can be implemented as:
- GitHub Actions scheduled jobs
- Prometheus blackbox exporter
- External monitoring (UptimeRobot, Pingdom)
- Internal cron jobs

### 5. System Intelligence Map (`src/observability/system_intelligence_map.json`)

A machine-readable map linking:
- **Modules** → Business goals → Resilience dependencies
- **Business goals** → Modules → SLO targets
- **Resilience dependencies** → Guardrails → Mitigations

This serves as:
- Source for dashboards
- AI documentation bots
- Onboarding documentation
- Architecture decision tracking

**Example:**
```json
{
  "backend/database.py": {
    "purpose": "Database connection management",
    "business_goals": ["Data persistence", "Connection pooling"],
    "resilience_dependencies": ["circuit_breaker.py"],
    "known_risks": ["Connection pool exhaustion"],
    "guardrails": ["Pool monitoring", "Circuit breaker"]
  }
}
```

### 6. Runtime Self-Check Endpoint (`/system/selfcheck`)

A lightweight API endpoint that returns JSON status of guardrails:

```bash
curl http://localhost:8000/system/selfcheck
```

**Response:**
```json
{
  "timestamp": "2024-12-19T10:00:00",
  "status": "healthy",
  "checks": {
    "total": 15,
    "passed": 14,
    "failed": 1,
    "violations": [...]
  },
  "runtime": {
    "config_validation": "ok",
    "database_pool": {
      "status": "ok",
      "utilization": "45%"
    }
  }
}
```

## How It Evolves

### Adding New Guardrails

1. **Identify Architectural Truth**: From code review, audit, or incident
2. **Define Guardrail**: Add to `infra/selfcheck/guardrails.yaml`
3. **Create Validator**: If needed, add validation script
4. **Test**: Run validation locally
5. **Commit**: Guardrail is automatically enforced in CI

**Example:**
```yaml
- name: "NO_DEPRECATED_APIS"
  description: "No deprecated API endpoints without migration path"
  condition: "grep -q '@deprecated' backend/main.py -> grep -q 'migration_path' backend/main.py"
  severity: "medium"
  priority: "P1"
```

### Updating System Intelligence Map

When modules change:
1. Update `src/observability/system_intelligence_map.json`
2. Update module purpose, dependencies, risks
3. Add new guardrails if risks change
4. Update business goals if functionality changes

### Evolving SLOs

SLOs are reviewed monthly:
1. Check error budget consumption
2. Adjust targets if needed
3. Update `infra/selfcheck/slo-monitors.yml`
4. Add new monitors for new SLOs

## Self-Healing Behavior

### Automatic Corrections

Some guardrails can trigger automatic fixes:

- **Migration drift**: Auto-apply migrations in staging
- **Config validation**: Fail fast on startup (prevents deployment)
- **Documentation drift**: Auto-generate from code comments

### Manual Interventions

When guardrails fail:
1. **CI Block**: PR blocked, review required
2. **Runtime Alert**: `/system/selfcheck` returns degraded status
3. **Monitoring Alert**: SLO violation triggers alert
4. **Incident Response**: Follow runbook for specific violation

### Gradual Enforcement

Guardrails start as warnings, then become blocking:

1. **Phase 1**: Log violations (non-blocking)
2. **Phase 2**: Warn in CI (non-blocking)
3. **Phase 3**: Block PRs (blocking)
4. **Phase 4**: Fail runtime health checks (blocking)

## Maintenance

### Nightly Drift Report

Scheduled job runs at 2 AM UTC:
- Validates all guardrails
- Generates diff report
- Posts to maintainers (email/Slack/GitHub issue)

### Monthly Review

Review and update:
- Guardrails (add/remove/update)
- SLO targets (adjust based on error budget)
- System intelligence map (update module info)
- Validation scripts (add new checks)

### On Architectural Changes

When making architectural changes:
1. **Update guardrails** if invariants change
2. **Update system intelligence map** with new dependencies
3. **Add new validators** if needed
4. **Update SLOs** if performance characteristics change
5. **Document in ADRs** if significant decision

## Examples

### Example 1: Adding a New Security Guardrail

**Scenario**: New security audit finds hardcoded API keys in code.

**Steps:**
1. Add guardrail to `infra/selfcheck/guardrails.yaml`:
```yaml
- name: "NO_HARDCODED_API_KEYS"
  description: "No hardcoded API keys in code"
  condition: "grep -r 'api_key.*=.*[\"'][^\"']{20,}' --exclude-dir=node_modules --exclude-dir=.git | wc -l == 0"
  severity: "critical"
  priority: "P0"
```

2. Test locally:
```bash
python infra/selfcheck/validate_guardrails.py
```

3. Commit: Guardrail automatically enforced in CI

### Example 2: Updating System Intelligence Map

**Scenario**: Circuit breaker is now wired into database operations.

**Steps:**
1. Update `src/observability/system_intelligence_map.json`:
```json
{
  "backend/database.py": {
    "known_risks": ["Connection pool exhaustion"],
    "guardrails": ["Pool monitoring", "Circuit breaker (wired)"]
  }
}
```

2. Update guardrail:
```yaml
- name: "CIRCUIT_BREAKER_WIRED"
  description: "Circuit breaker must be wired into critical DB operations"
  condition: "grep -q '@db_circuit_breaker' backend/database.py"
```

### Example 3: Responding to SLO Violation

**Scenario**: API availability drops below 99.9% SLO.

**Steps:**
1. Check `/system/selfcheck` endpoint for violations
2. Review health check failures
3. Check database pool utilization
4. Apply fixes (restart, scale, fix root cause)
5. Update guardrails if needed to prevent recurrence

## Best Practices

1. **Start Small**: Begin with critical security guardrails, add more over time
2. **Document Intent**: Always explain why a guardrail exists (reference audit/ADR)
3. **Make Reversible**: Guardrails should be removable without breaking system
4. **Test Locally**: Always test guardrails locally before committing
5. **Review Regularly**: Monthly review of guardrails and SLOs
6. **Update Continuously**: Keep system intelligence map in sync with code

## Troubleshooting

### Guardrails Failing in CI

1. Check validation script output
2. Run locally: `python infra/selfcheck/validate_guardrails.py`
3. Review guardrail condition
4. Check if guardrail needs updating

### System Intelligence Map Out of Date

1. Review module changes in git
2. Update map with new dependencies
3. Add new guardrails if risks changed
4. Commit update

### SLO Monitors Not Working

1. Check monitor configuration in `slo-monitors.yml`
2. Verify health endpoints are accessible
3. Check monitoring service status
4. Review alerting configuration

## Related Documentation

- `docs/audit/EXEC_SUMMARY.md` - Audit findings that informed guardrails
- `docs/audit/RESILIENCE_TABLE.md` - Resilience guardrails
- `docs/audit/CONFIG_ENTROPY_REPORT.md` - Configuration guardrails
- `.github/workflows/ci-intent-tests.yml` - CI integration
- `infra/selfcheck/guardrails.yaml` - All guardrails

## Future Enhancements

1. **Auto-train Embeddings**: Local embedding index on audit docs for semantic navigation
2. **Natural Language Summaries**: Generate human-readable PR checks
3. **Adaptive Learning**: Record recurring violations, suggest rule updates
4. **PR Template Integration**: Auto-suggest guardrails based on changed files
5. **Visual Dashboard**: Web UI for system intelligence map

---

**Last Updated:** 2024-12-19  
**Maintainer:** Architecture Team  
**Review Frequency:** Monthly
