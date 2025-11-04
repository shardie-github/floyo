#!/usr/bin/env python3
"""
Update drift tracker with findings from guardrails run.
This enables adaptive learning - tracking recurring issues to suggest improvements.
"""
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from collections import defaultdict

def load_drift_tracker():
    """Load drift tracker JSON."""
    tracker_path = Path(__file__).parent / "drift_tracker.json"
    if tracker_path.exists():
        with open(tracker_path, 'r') as f:
            return json.load(f)
    else:
        return {
            "version": "1.0.0",
            "drift_history": [],
            "recurring_findings": {},
            "suggested_rules": [],
            "metadata": {
                "total_runs": 0,
                "total_findings": 0,
                "most_common_category": None,
                "trend": "stable"
            }
        }

def run_guardrails():
    """Run guardrails and capture output."""
    repo_root = Path(__file__).parent.parent.parent
    guardrails_script = repo_root / "infra" / "selfcheck" / "run_guardrails.py"
    
    try:
        result = subprocess.run(
            [str(guardrails_script)],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=str(repo_root)
        )
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), 1

def parse_guardrails_output(output):
    """Parse guardrails output to extract findings."""
    findings = []
    lines = output.split('\n')
    
    for line in lines:
        if '✗ FAIL' in line or '⚠ WARN' in line:
            # Extract guardrail name and category
            parts = line.split(':')
            if len(parts) >= 2:
                finding = {
                    "guardrail": parts[0].strip().replace('✗ FAIL:', '').replace('⚠ WARN:', '').strip(),
                    "message": ':'.join(parts[1:]).strip(),
                    "severity": "critical" if "✗ FAIL" in line else "warning",
                    "timestamp": datetime.utcnow().isoformat()
                }
                findings.append(finding)
    
    return findings

def update_recurring_findings(tracker, findings):
    """Update recurring findings based on new findings."""
    recurring = tracker.get("recurring_findings", {})
    
    for finding in findings:
        guardrail = finding.get("guardrail", "unknown")
        if guardrail not in recurring:
            recurring[guardrail] = {
                "count": 0,
                "first_seen": finding["timestamp"],
                "last_seen": finding["timestamp"],
                "severity": finding["severity"]
            }
        else:
            recurring[guardrail]["count"] += 1
            recurring[guardrail]["last_seen"] = finding["timestamp"]
    
    tracker["recurring_findings"] = recurring
    
    # Generate suggestions for frequently recurring issues
    suggestions = []
    for guardrail, data in recurring.items():
        if data["count"] >= 3:  # Appeared 3+ times
            suggestions.append({
                "guardrail": guardrail,
                "reason": f"Recurring issue (appeared {data['count']} times)",
                "suggestion": f"Review and update guardrail rule for {guardrail}",
                "priority": "high" if data["severity"] == "critical" else "medium"
            })
    
    tracker["suggested_rules"] = suggestions

def main():
    """Main entry point."""
    tracker = load_drift_tracker()
    
    # Run guardrails
    stdout, stderr, returncode = run_guardrails()
    
    # Parse findings
    findings = parse_guardrails_output(stdout + stderr)
    
    # Update history
    run_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "findings": findings,
        "total_findings": len(findings),
        "returncode": returncode
    }
    tracker["drift_history"].append(run_entry)
    
    # Keep only last 100 runs
    if len(tracker["drift_history"]) > 100:
        tracker["drift_history"] = tracker["drift_history"][-100:]
    
    # Update recurring findings
    update_recurring_findings(tracker, findings)
    
    # Update metadata
    tracker["metadata"]["total_runs"] = len(tracker["drift_history"])
    tracker["metadata"]["total_findings"] = sum(
        run["total_findings"] for run in tracker["drift_history"]
    )
    
    # Find most common category
    category_counts = defaultdict(int)
    for finding in findings:
        # Try to extract category from guardrail name
        if '.' in finding.get("guardrail", ""):
            category = finding["guardrail"].split('.')[0]
            category_counts[category] += 1
    
    if category_counts:
        tracker["metadata"]["most_common_category"] = max(category_counts, key=category_counts.get)
    
    # Update trend (simplified: compare last 2 runs)
    if len(tracker["drift_history"]) >= 2:
        recent = tracker["drift_history"][-2:]
        recent_findings = recent[1]["total_findings"]
        previous_findings = recent[0]["total_findings"]
        
        if recent_findings < previous_findings:
            tracker["metadata"]["trend"] = "improving"
        elif recent_findings > previous_findings:
            tracker["metadata"]["trend"] = "worsening"
        else:
            tracker["metadata"]["trend"] = "stable"
    
    tracker["last_updated"] = datetime.utcnow().isoformat()
    
    # Save tracker
    tracker_path = Path(__file__).parent / "drift_tracker.json"
    with open(tracker_path, 'w') as f:
        json.dump(tracker, f, indent=2)
    
    # Print summary
    print(f"Drift tracker updated: {len(findings)} findings, {len(tracker['suggested_rules']])} suggestions")
    
    if tracker["suggested_rules"]:
        print("\nSuggested rule updates:")
        for suggestion in tracker["suggested_rules"]:
            print(f"  - {suggestion['guardrail']}: {suggestion['suggestion']}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
