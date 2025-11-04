# Investor & Growth Remediation Orchestrator

End-to-end diagnostic, planning, fixing, validation, and automated PR generation system for investor-ready remediation.

## Overview

This orchestrator runs comprehensive audits across five domains:
- **Technical**: Performance, security, CI/CD, scalability
- **Product**: Roadmap, UX, telemetry, adoption
- **GTM**: Funnel, CAC/LTV, channel mix
- **Financial**: Runway, burn rate, margin proxies
- **Governance**: Compliance, IP, bus-factor, documentation

## Quick Start

### Run Full Audit Suite

```bash
# Run all audits
python3 docs/audit_investor_suite/run_all_audits.py

# Classify issues and generate register
python3 docs/audit_investor_suite/classify_issues.py

# Generate fix scripts and PR plans
python3 docs/audit_investor_suite/generate_fixes.py

# Generate validation report
python3 docs/audit_investor_suite/generate_validation.py

# Generate executive summary
python3 docs/audit_investor_suite/generate_exec_summary.py
```

### Manual Fix Application

```bash
# Apply a single fix
./infra/fixes/fix_default-secret-key-in-envexample.sh

# Or use the helper
./infra/fixes/_apply_and_stage.sh infra/fixes/fix_default-secret-key-in-envexample.sh
```

### Automated PR Generation (CI)

The GitHub Actions workflow (`.github/workflows/remediation_orchestrator.yml`) automatically:
1. Runs audits on schedule or manual trigger
2. Generates fix scripts and PR plans
3. Opens PRs for each unresolved issue (on workflow_dispatch or schedule)

## Artifacts

All outputs are saved to `docs/audit_investor_suite/`:

- **ISSUE_REGISTER.json**: Complete issue register with risk scoring
- **PR_PLANS/**: Individual PR plan markdown files
- **EXEC_SUMMARY_FIXED.md**: Investor-ready executive summary
- **VALIDATION_REPORT.md**: Before/after validation report
- **all_issues.json**: Raw issue list from all audits
- **audit_summary.json**: Summary statistics

## Fix Scripts

Fix scripts are generated in `infra/fixes/`:
- `fix_*.sh`: Bash scripts for each issue
- `_apply_and_stage.sh`: Helper to apply and stage fixes
- `_open_prs.sh`: Helper to open PRs from issue register

## Issue Classification

Issues are classified by:
- **Impact Score** (1-10): Based on severity and domain
- **Likelihood Score** (1-10): Based on severity and file location
- **Risk Score**: Impact × Likelihood (1-100)
- **Severity Label**: Critical (≥70), Major (≥40), Minor (≥20), Enhancement (<20)

## Safe Mode

All fixes are applied on topic branches (`fix/<slug>`) - never directly to main:
- Fix scripts are idempotent and non-destructive
- PRs are created automatically for review
- Changes require manual approval before merge

## CI Integration

The workflow runs:
- **On schedule**: Daily at 4 AM UTC
- **On workflow_dispatch**: Manual trigger
- **On pull_request**: Audit only (no PR creation)

## Customization

### Adding New Audit Domain

1. Create `audit_<domain>.py` in `docs/audit_investor_suite/`
2. Add to `run_all_audits.py` audits list
3. Implement `run_<domain>_audit()` function

### Custom Fix Scripts

Edit fix scripts in `infra/fixes/` to implement specific fixes. Each script should:
- Be idempotent (safe to run multiple times)
- Be non-destructive (create backups, validate first)
- Output clear success/failure messages

## Quality Bar

- ✅ Every finding logged with severity and PR plan
- ✅ Critical issues create auto PRs on isolated branches
- ✅ Validation report shows before/after status
- ✅ No direct commits to main (PR-based only)

## Next Steps

1. Review `ISSUE_REGISTER.json` for prioritized issues
2. Review `EXEC_SUMMARY_FIXED.md` for investor-ready summary
3. Apply fixes for Critical issues first
4. Review and merge PRs
5. Re-run validation to confirm fixes

## Support

For questions or issues:
- Review `docs/audit_investor_suite/EXEC_SUMMARY_FIXED.md`
- Check `docs/audit_investor_suite/VALIDATION_REPORT.md`
- Review PR plans in `docs/audit_investor_suite/PR_PLANS/`
