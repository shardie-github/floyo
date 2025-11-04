#!/usr/bin/env python3
"""
Generate Validation Report
Re-runs checks and produces before/after comparison
"""
import json
import sys
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def run_validation_checks() -> Dict[str, Any]:
    """Run validation checks."""
    repo_root = Path(__file__).parent.parent.parent
    
    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'checks': {}
    }
    
    # Check guardrails
    guardrails_script = repo_root / 'infra' / 'selfcheck' / 'validate_guardrails.py'
    if guardrails_script.exists():
        try:
            result = subprocess.run(
                [sys.executable, str(guardrails_script), '--json'],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                results['checks']['guardrails'] = json.loads(result.stdout)
            else:
                results['checks']['guardrails'] = {'error': result.stderr}
        except Exception as e:
            results['checks']['guardrails'] = {'error': str(e)}
    
    # Check env completeness
    env_check = repo_root / 'infra' / 'selfcheck' / 'check_env_completeness.py'
    if env_check.exists():
        try:
            result = subprocess.run(
                [sys.executable, str(env_check)],
                capture_output=True,
                text=True,
                timeout=30
            )
            results['checks']['env_completeness'] = {
                'passed': result.returncode == 0,
                'output': result.stdout
            }
        except Exception as e:
            results['checks']['env_completeness'] = {'error': str(e)}
    
    return results

def generate_validation_report() -> str:
    """Generate validation report markdown."""
    register_file = Path(__file__).parent / 'ISSUE_REGISTER.json'
    
    if not register_file.exists():
        return "# Validation Report\n\nNo ISSUE_REGISTER.json found."
    
    register = json.loads(register_file.read_text())
    
    validation = run_validation_checks()
    
    resolved = [i for i in register['issues'] if i.get('status') == 'resolved']
    open_issues = [i for i in register['issues'] if i.get('status') != 'resolved']
    
    report = f"""# Validation Report

**Generated**: {datetime.utcnow().isoformat()}

## Summary

- **Total Issues**: {len(register['issues'])}
- **Resolved**: {len(resolved)}
- **Open**: {len(open_issues)}
- **Resolution Rate**: {len(resolved) / len(register['issues']) * 100:.1f}%

## Status by Severity

"""
    
    for severity in ['Critical', 'Major', 'Minor', 'Enhancement']:
        total = len([i for i in register['issues'] if i['severity'] == severity])
        resolved_count = len([i for i in resolved if i['severity'] == severity])
        report += f"- **{severity}**: {resolved_count}/{total} resolved\n"
    
    report += "\n## Validation Checks\n\n"
    
    if 'guardrails' in validation['checks']:
        guardrail_results = validation['checks']['guardrails']
        if 'passed' in guardrail_results:
            report += f"✅ Guardrails: {guardrail_results['passed']} passed\n"
        if 'failed' in guardrail_results:
            report += f"❌ Guardrails: {guardrail_results['failed']} failed\n"
    
    if 'env_completeness' in validation['checks']:
        env_check = validation['checks']['env_completeness']
        if env_check.get('passed'):
            report += "✅ Environment completeness: PASSED\n"
        else:
            report += "❌ Environment completeness: FAILED\n"
    
    report += "\n## Open Issues\n\n"
    
    for issue in open_issues[:10]:  # Top 10
        report += f"### {issue['title']}\n"
        report += f"- **ID**: {issue['id']}\n"
        report += f"- **Severity**: {issue['severity']}\n"
        report += f"- **Risk Score**: {issue['risk_score']}\n"
        report += f"- **Status**: {issue.get('status', 'open')}\n\n"
    
    if len(open_issues) > 10:
        report += f"\n*... and {len(open_issues) - 10} more issues*\n"
    
    report += "\n## Next Steps\n\n"
    report += "1. Review open issues\n"
    report += "2. Apply fixes for Critical and Major issues\n"
    report += "3. Re-run validation to confirm fixes\n"
    report += "4. Update issue status in ISSUE_REGISTER.json\n"
    
    return report

if __name__ == '__main__':
    report = generate_validation_report()
    output_file = Path(__file__).parent / 'VALIDATION_REPORT.md'
    output_file.write_text(report)
    print(f"✅ Validation report generated: {output_file}")
