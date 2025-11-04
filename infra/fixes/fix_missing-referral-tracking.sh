#!/usr/bin/env bash
# Fix: Missing referral tracking
# Issue: ISSUE-90BEDD2B
# Severity: Enhancement
set -euo pipefail

echo "Applying fix: Missing referral tracking"

# Generate migration diff and create PR plan
# DO NOT apply migrations directly - create PR instead

echo "Generating migration PR plan..."
cat > docs/audit_investor_suite/PR_PLANS/missing-referral-tracking.md <<EOF
# PR Plan: Missing referral tracking

## Issue
- ID: ISSUE-90BEDD2B
- Severity: Enhancement
- Domain: gtm

## Description
No referral/invite system in data model

## Changes Required
1. Review database schema drift
2. Generate Alembic migration
3. Test migration on staging
4. Create PR with migration

## Testing
- [ ] Test migration on local database
- [ ] Test rollback
- [ ] Verify schema matches models

## Rollback Plan
If migration fails:
1. Rollback using: alembic downgrade -1
2. Investigate issue
3. Fix and re-apply

EOF

echo "Migration PR plan created: docs/audit_investor_suite/PR_PLANS/missing-referral-tracking.md"
echo "DO NOT apply migration automatically - requires manual review"
