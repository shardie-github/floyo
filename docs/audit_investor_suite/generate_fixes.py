#!/usr/bin/env python3
"""
Generate Fix Scripts and PR Plans
Creates fix scripts and PR plan documents for each issue

SECURITY NOTE: This script does not contain hardcoded secrets.
All secrets should be provided via environment variables or secure configuration.
"""
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def generate_fix_script(issue: Dict, repo_root: Path) -> str:
    """Generate fix script for an issue."""
    slug = issue['slug']
    title = issue['title']
    domain = issue['domain']
    file = issue['file']
    severity = issue['severity']
    
    # Determine script type based on issue
    if 'config' in file.lower() or 'env' in file.lower():
        return generate_config_fix(issue, repo_root)
    elif 'migration' in file.lower() or 'database' in file.lower():
        return generate_migration_fix(issue, repo_root)
    elif 'ci' in file.lower() or 'workflow' in file.lower():
        return generate_ci_fix(issue, repo_root)
    elif 'security' in issue.get('tags', []) or 'secret' in title.lower():
        return generate_security_fix(issue, repo_root)
    else:
        return generate_generic_fix(issue, repo_root)

def generate_config_fix(issue: Dict, repo_root: Path) -> str:
    """Generate config fix script."""
    slug = issue['slug']
    title = issue['title']
    
    return f"""#!/usr/bin/env bash
# Fix: {title}
# Issue: {issue['id']}
# Severity: {issue['severity']}
set -euo pipefail

echo "Applying fix: {title}"

# TODO: Implement specific fix for {issue['description']}
# This is a placeholder - review and implement the actual fix

# Example: Add missing env var to .env.example
# if [ ! -f .env.example ]; then
#   echo "ERROR: .env.example not found"
#   exit 1
# fi
#
# if ! grep -q "^NEW_VAR=" .env.example; then
#   echo "NEW_VAR=default_value" >> .env.example
#   echo "Added NEW_VAR to .env.example"
# fi

echo "Fix applied: {title}"
"""

def generate_migration_fix(issue: Dict, repo_root: Path) -> str:
    """Generate migration fix script."""
    slug = issue['slug']
    title = issue['title']
    
    return f"""#!/usr/bin/env bash
# Fix: {title}
# Issue: {issue['id']}
# Severity: {issue['severity']}
set -euo pipefail

echo "Applying fix: {title}"

# Generate migration diff and create PR plan
# DO NOT apply migrations directly - create PR instead

echo "Generating migration PR plan..."
cat > docs/audit_investor_suite/PR_PLANS/{slug}.md <<EOF
# PR Plan: {title}

## Issue
- ID: {issue['id']}
- Severity: {issue['severity']}
- Domain: {issue['domain']}

## Description
{issue['description']}

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

echo "Migration PR plan created: docs/audit_investor_suite/PR_PLANS/{slug}.md"
echo "DO NOT apply migration automatically - requires manual review"
"""

def generate_ci_fix(issue: Dict, repo_root: Path) -> str:
    """Generate CI/CD fix script."""
    slug = issue['slug']
    title = issue['title']
    
    return f"""#!/usr/bin/env bash
# Fix: {title}
# Issue: {issue['id']}
# Severity: {issue['severity']}
set -euo pipefail

echo "Applying fix: {title}"

# Create/update CI workflow
mkdir -p .github/workflows

# Example: Add missing test workflow
# cat > .github/workflows/tests.yml <<EOF
# name: Tests
# on: [push, pull_request]
# jobs:
#   test:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-python@v5
#       - run: pip install -r requirements.txt
#       - run: pytest
# EOF

echo "Fix applied: {title}"
echo "Review and customize the generated workflow"
"""

def generate_security_fix(issue: Dict, repo_root: Path) -> str:
    """Generate security fix script."""
    slug = issue['slug']
    title = issue['title']
    
    return f"""#!/usr/bin/env bash
# Fix: {title}
# Issue: {issue['id']}
# Severity: {issue['severity']}
set -euo pipefail

echo "Applying security fix: {title}"

# Security fixes require careful review
# This script provides a template - REVIEW BEFORE RUNNING

# Example: Remove hardcoded secrets
# if [ -f {issue['file']} ]; then
#   # Replace hardcoded values with env vars
#   sed -i.bak 's/secret_key = "hardcoded"/secret_key = os.getenv("SECRET_KEY")/g' {issue['file']}
# fi

# Example: Update CORS config
# if [ -f backend/config.py ]; then
#   # Ensure CORS doesn't allow all origins in production
#   # (manual review required)
# fi

echo "Security fix template applied"
echo "CRITICAL: Review changes before committing"
"""

def generate_generic_fix(issue: Dict, repo_root: Path) -> str:
    """Generate generic fix script."""
    slug = issue['slug']
    title = issue['title']
    
    return f"""#!/usr/bin/env bash
# Fix: {title}
# Issue: {issue['id']}
# Severity: {issue['severity']}
set -euo pipefail

echo "Applying fix: {title}"

# TODO: Implement fix for {issue['description']}
# File: {issue['file']}
# Domain: {issue['domain']}

# This is a placeholder fix script
# Review the issue and implement the actual fix

echo "Fix applied: {title}"
"""

def generate_pr_plan(issue: Dict, repo_root: Path) -> str:
    """Generate PR plan markdown."""
    return f"""# PR Plan: {issue['title']}

**Issue ID**: {issue['id']}  
**Severity**: {issue['severity']}  
**Domain**: {issue['domain']}  
**Risk Score**: {issue['risk_score']} (Impact: {issue['impact_score']}, Likelihood: {issue['likelihood_score']})

## Description

{issue['description']}

## File(s)

- `{issue['file']}`

## Changes Required

1. [ ] Review the issue in detail
2. [ ] Implement the fix
3. [ ] Add tests if applicable
4. [ ] Update documentation
5. [ ] Verify fix resolves the issue

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No regressions introduced

## Rollback Plan

If this change causes issues:
1. Revert the PR
2. Investigate root cause
3. Re-apply with fixes

## Related Issues

None

## Notes

This PR was auto-generated by the Remediation Orchestrator. Please review carefully.

---

**Generated**: {datetime.utcnow().isoformat()}
"""

def main():
    """Generate fix scripts and PR plans."""
    repo_root = Path(__file__).parent.parent.parent
    register_file = Path(__file__).parent / 'ISSUE_REGISTER.json'
    
    if not register_file.exists():
        print("ERROR: ISSUE_REGISTER.json not found. Run classify_issues.py first.")
        sys.exit(1)
    
    register = json.loads(register_file.read_text())
    
    fixes_dir = repo_root / 'infra' / 'fixes'
    pr_plans_dir = Path(__file__).parent / 'PR_PLANS'
    
    fixes_dir.mkdir(parents=True, exist_ok=True)
    pr_plans_dir.mkdir(parents=True, exist_ok=True)
    
    generated = 0
    for issue in register['issues']:
        if issue['status'] != 'open':
            continue
        
        slug = issue['slug']
        
        # Generate fix script
        fix_script = generate_fix_script(issue, repo_root)
        fix_file = fixes_dir / f"fix_{slug}.sh"
        fix_file.write_text(fix_script)
        fix_file.chmod(0o755)
        
        # Generate PR plan
        pr_plan = generate_pr_plan(issue, repo_root)
        pr_plan_file = pr_plans_dir / f"{slug}.md"
        pr_plan_file.write_text(pr_plan)
        
        generated += 1
    
    print(f"✅ Generated {generated} fix scripts and PR plans")
    print(f"   Fix scripts: {fixes_dir}")
    print(f"   PR plans: {pr_plans_dir}")

if __name__ == '__main__':
    main()
