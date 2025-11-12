> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Branch Curator — Stale/Merged Cleanup Report

**Generated:** $(date -Iseconds)  
**Default Branch:** main

## Executive Summary

Analysis of remote branches shows many merged branches that can be safely deleted. Several unmerged branches may be stale and require review.

## Merged Branches (Safe to Delete)

The following branches have been merged into `origin/main` and can be safely deleted:

```bash
# Safe to delete (merged)
origin/cursor/audit-and-enhance-trust-layer-3626
origin/cursor/automate-canadian-venture-operations-suite-ef92
origin/cursor/automate-ci-cd-with-vercel-and-supabase-1a87
origin/cursor/automate-production-framework-with-termux-and-wasm-d07c
origin/cursor/automated-environment-health-and-security-orchestrator-cd3d
origin/cursor/build-a-self-governing-privacy-guardian-system-54c3
origin/cursor/build-efficient-ai-agent-engine-bbb7
origin/cursor/codebase-hygiene-and-dead-code-reaper-2c21
origin/cursor/complete-and-connect-roadmap-and-next-steps-bcd0
origin/cursor/complete-outstanding-roadmap-items-bcd0
origin/cursor/configure-floyo-vercel-and-supabase-integration-21d9
origin/cursor/dynamically-configure-and-migrate-all-database-elements-2f58
origin/cursor/final-assurance-and-gated-release-6f9c
origin/cursor/generate-canadian-venture-business-document-stack-6c3d
origin/cursor/implement-meta-architectural-system-d706
origin/cursor/integrate-enrichment-services-3922
origin/cursor/orchestrate-front-end-excellence-and-external-code-6435
origin/cursor/orchestrate-investor-growth-remediation-and-auto-prs-da27
origin/cursor/run-security-self-check-for-hardonia-68c9
```

**Total Merged Branches:** ~20

## Unmerged Branches (Review Required)

The following branches have not been merged and may be active or stale:

```bash
# Review required (not merged)
origin/cursor/address-quick-wins-and-p0-p1-audit-issues-e450
origin/cursor/automate-integration-performance-and-accessibility-audits-ec2b
origin/cursor/build-efficient-ai-agent-engine-0e44
origin/cursor/complete-all-priority-issues-and-optimize-4788
origin/cursor/complete-dev-and-audit-project-c182
origin/cursor/complete-month-2-and-3-dve-work-87a0
origin/cursor/complete-month-one-roadmap-tasks-4ab5
origin/cursor/implement-stepback-baseline-and-reliability-features-5fb7
origin/dependabot/npm_and_yarn/npm_and_yarn-0a69fc38c5
origin/feat/perf-ux-stability
```

**Total Unmerged Branches:** 10

## Recommended Actions

### Safe Actions (No Risk)

**Delete merged branches:**
```bash
# Verify branch is merged
git branch -r --merged origin/main | grep "cursor/"

# Delete remote branch (safe - already merged)
git push origin --delete <branch-name>
```

**Example for one branch:**
```bash
git push origin --delete cursor/audit-and-enhance-trust-layer-3626
```

### Risky Actions (Require Review)

**Review unmerged branches:**
1. Check last commit date: `git log origin/<branch> -1 --format="%ci"`
2. Check if branch is still needed
3. Consider merging or closing associated PRs
4. Delete only if confirmed stale

**Check branch age:**
```bash
# Check last activity
for branch in $(git branch -r --no-merged origin/main | grep -v HEAD); do
  echo "$branch: $(git log $branch -1 --format='%ci %s')"
done
```

## Automation Script

**Safe cleanup script (merged branches only):**
```bash
#!/bin/bash
# cleanup-merged-branches.sh

MERGED_BRANCHES=$(git branch -r --merged origin/main | grep -v HEAD | grep -v "origin/main")

for branch in $MERGED_BRANCHES; do
  branch_name=$(echo $branch | sed 's/origin\///')
  echo "Deleting merged branch: $branch_name"
  git push origin --delete "$branch_name" || echo "Failed to delete $branch_name"
done
```

**⚠️ Warning:** Review output before running. Only deletes merged branches.

## Metrics

- **Merged Branches:** ~20
- **Unmerged Branches:** 10
- **Dependabot Branches:** 1 (may auto-delete)
- **Feature Branches:** 1 (`feat/perf-ux-stability`)

## Notes

1. **Dependabot branches** may auto-delete after PR merge
2. **Feature branches** should be reviewed before deletion
3. **Cursor branches** appear to be auto-generated and can be cleaned up after merge
4. Always verify branch is merged before deletion

---

**Status:** ✅ Analysis complete  
**Action Required:** Manual review of unmerged branches, safe deletion of merged branches

**⚠️ No automatic deletions performed - manual review required**
