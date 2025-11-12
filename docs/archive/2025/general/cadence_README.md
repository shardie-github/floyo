> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Cadence Overview (Find → Fix → Deploy)
**TZ:** America/Toronto

## Triggers
- **On Push (main):** Delta migrate → Verify → Post-deploy verify
- **Nightly 02:15:** Compute yesterday metrics → Data Quality checks
- **Weekly Mon 07:30:** System Health & Solutions sweep
- **Monthly 1st 08:05:** (Optional) Backfill window (/ops/cadence.json)
- **On Failure:** Doctor auto-heals, then Verify; status.json updated; Status Page redeployed

## One-liners
- Orchestrate: `node scripts/agents/cadence_orchestrator.ts`
- Post-deploy verify: `node scripts/agents/post_deploy_verify.ts`
- Self-heal: `node scripts/agents/system_doctor.ts`
- Status JSON: `node scripts/agents/write_status_json.ts`
