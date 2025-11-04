#!/usr/bin/env python3
"""
Compute readiness score for release gate.
Aggregates sub-scores across Tech/Product/GTM/Finance/Governance domains.
"""
import json
import os
import sys
from pathlib import Path


def exists(p):
    """Check if file exists."""
    return os.path.exists(p)


def read_json_safe(path, default=None):
    """Safely read JSON file."""
    try:
        if exists(path):
            with open(path, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return default or {}


def check_critical_blockers():
    """Check ISSUE_REGISTER.json for CRITICAL open issues."""
    issue_reg = read_json_safe("docs/audit_investor_suite/ISSUE_REGISTER.json", {"issues": []})
    critical_open = [
        issue for issue in issue_reg.get("issues", [])
        if issue.get("severity") == "Critical" and issue.get("status") == "open"
    ]
    return len(critical_open), critical_open


def compute_readiness():
    """Compute readiness score (0-100)."""
    score = 0
    notes = []
    max_score = 100
    
    # Tech domain (20 points)
    tech_score = 0
    if exists("docs/audit_investor_suite/VALIDATION_REPORT.md"):
        tech_score += 10
        notes.append("✓ Validation report exists")
    else:
        notes.append("✗ Validation report missing")
    
    if exists("docs/audit_investor_suite/EXEC_SUMMARY_FIXED.md"):
        tech_score += 5
        notes.append("✓ Executive summary exists")
    
    if exists(".github/workflows/project-governance.yml") and exists(".github/workflows/remediation_orchestrator.yml"):
        tech_score += 5
        notes.append("✓ Required CI workflows present")
    else:
        notes.append("✗ Missing required CI workflows")
    
    score += tech_score
    notes.append(f"Tech domain: {tech_score}/20")
    
    # Product domain (20 points)
    product_score = 0
    if exists("docs/audit_investor_suite/PRODUCT_AUDIT.md"):
        product_score += 20
        notes.append("✓ Product audit exists")
    elif exists("PRODUCT_AUDIT.md"):
        product_score += 15
        notes.append("⚠ Product audit exists (wrong location)")
    else:
        product_score += 10
        notes.append("✗ Product audit missing")
    
    score += product_score
    notes.append(f"Product domain: {product_score}/20")
    
    # GTM domain (20 points)
    gtm_score = 0
    if exists("docs/audit_investor_suite/GTM_AUDIT.md"):
        gtm_score += 20
        notes.append("✓ GTM audit exists")
    else:
        gtm_score += 10
        notes.append("✗ GTM audit missing")
    
    score += gtm_score
    notes.append(f"GTM domain: {gtm_score}/20")
    
    # Finance domain (20 points)
    finance_score = 0
    if exists("docs/audit_investor_suite/FINANCIAL_FORECAST.md"):
        finance_score += 20
        notes.append("✓ Financial forecast exists")
    else:
        finance_score += 10
        notes.append("✗ Financial forecast missing")
    
    score += finance_score
    notes.append(f"Finance domain: {finance_score}/20")
    
    # Governance domain (20 points)
    gov_score = 0
    if exists("SECURITY.md"):
        gov_score += 5
        notes.append("✓ SECURITY.md exists")
    else:
        notes.append("✗ SECURITY.md missing")
    
    if exists(".github/CODEOWNERS"):
        gov_score += 5
        notes.append("✓ CODEOWNERS exists")
    else:
        notes.append("✗ CODEOWNERS missing")
    
    if exists("SUPPORT.md"):
        gov_score += 5
        notes.append("✓ SUPPORT.md exists")
    else:
        notes.append("✗ SUPPORT.md missing")
    
    if exists("LICENSE"):
        gov_score += 3
        notes.append("✓ LICENSE exists")
    else:
        notes.append("✗ LICENSE missing")
    
    if exists("CONTRIBUTING.md"):
        gov_score += 2
        notes.append("✓ CONTRIBUTING.md exists")
    else:
        notes.append("✗ CONTRIBUTING.md missing")
    
    score += gov_score
    notes.append(f"Governance domain: {gov_score}/20")
    
    # Check for critical blockers
    critical_count, critical_issues = check_critical_blockers()
    has_blockers = critical_count > 0
    
    if has_blockers:
        notes.append(f"⚠ BLOCKER: {critical_count} CRITICAL open issue(s) found")
        notes.append(f"  Issues: {', '.join([i.get('id', 'unknown') for i in critical_issues[:3]])}")
    
    # Final score
    threshold = int(os.environ.get("READINESS_THRESHOLD", "90"))
    
    data = {
        "score": score,
        "threshold": threshold,
        "max_score": max_score,
        "domains": {
            "tech": tech_score,
            "product": product_score,
            "gtm": gtm_score,
            "finance": finance_score,
            "governance": gov_score
        },
        "critical_blockers": critical_count,
        "has_blockers": has_blockers,
        "blocker_ids": [i.get("id") for i in critical_issues],
        "gated": score >= threshold and not has_blockers,
        "notes": notes,
        "timestamp": __import__("datetime").datetime.now().isoformat()
    }
    
    # Ensure directory exists
    os.makedirs("docs/audit_investor_suite", exist_ok=True)
    
    # Write readiness JSON
    with open("docs/audit_investor_suite/READINESS.json", "w") as f:
        json.dump(data, f, indent=2)
    
    # Print summary
    print(f"Readiness Score: {score}/{max_score}")
    print(f"Threshold: {threshold}")
    print(f"Critical Blockers: {critical_count}")
    print(f"Gate Status: {'PASS' if data['gated'] else 'FAIL'}")
    if not data['gated']:
        if score < threshold:
            print(f"  → Score {score} < threshold {threshold}")
        if has_blockers:
            print(f"  → {critical_count} CRITICAL blocker(s) found")
    
    return data


if __name__ == "__main__":
    data = compute_readiness()
    sys.exit(0 if data["gated"] else 1)
