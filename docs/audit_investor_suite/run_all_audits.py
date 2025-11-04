#!/usr/bin/env python3
"""
Master Audit Orchestrator
Runs all domain audits and compiles results
"""
import json
import sys
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def run_audit(script_name: str) -> Dict[str, Any]:
    """Run a single audit script."""
    script_path = Path(__file__).parent / script_name
    if not script_path.exists():
        return {
            'error': f'Script not found: {script_name}',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=Path(__file__).parent.parent.parent
        )
        
        # Try to load the output JSON file
        output_file = script_path.parent / script_name.replace('audit_', '').replace('.py', '_audit.json')
        if output_file.exists():
            return json.loads(output_file.read_text())
        else:
            return {
                'error': f'No output file generated: {output_file}',
                'stderr': result.stderr,
                'stdout': result.stdout,
                'timestamp': datetime.utcnow().isoformat()
            }
    except subprocess.TimeoutExpired:
        return {
            'error': f'Audit timed out: {script_name}',
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            'error': f'Error running audit: {str(e)}',
            'timestamp': datetime.utcnow().isoformat()
        }

def main():
    """Run all audits."""
    print("=" * 60)
    print("Investor & Growth Remediation Orchestrator")
    print("Running comprehensive audits...")
    print("=" * 60)
    
    audits = [
        'audit_technical.py',
        'audit_product.py',
        'audit_gtm.py',
        'audit_financial.py',
        'audit_governance.py'
    ]
    
    results = {}
    for audit in audits:
        print(f"\n📋 Running {audit}...")
        results[audit] = run_audit(audit)
    
    # Compile summary
    all_issues = []
    for audit_name, audit_result in results.items():
        if 'issues' in audit_result:
            for issue in audit_result['issues']:
                issue['source_audit'] = audit_name
                all_issues.append(issue)
    
    summary = {
        'timestamp': datetime.utcnow().isoformat(),
        'audits_run': len(audits),
        'total_issues': len(all_issues),
        'by_severity': {
            'critical': len([i for i in all_issues if i.get('severity') == 'critical']),
            'high': len([i for i in all_issues if i.get('severity') == 'high']),
            'medium': len([i for i in all_issues if i.get('severity') == 'medium']),
            'low': len([i for i in all_issues if i.get('severity') == 'low'])
        },
        'by_domain': {}
    }
    
    for audit_name, audit_result in results.items():
        if 'domain' in audit_result:
            domain = audit_result['domain']
            summary['by_domain'][domain] = audit_result.get('summary', {})
    
    # Save results
    output_dir = Path(__file__).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save individual audit results
    for audit_name, audit_result in results.items():
        output_file = output_dir / audit_name.replace('.py', '_results.json')
        output_file.write_text(json.dumps(audit_result, indent=2))
    
    # Save summary
    summary_file = output_dir / 'audit_summary.json'
    summary_file.write_text(json.dumps(summary, indent=2))
    
    # Save all issues
    issues_file = output_dir / 'all_issues.json'
    issues_file.write_text(json.dumps(all_issues, indent=2))
    
    print("\n" + "=" * 60)
    print("Audit Summary")
    print("=" * 60)
    print(f"Total Issues: {summary['total_issues']}")
    print(f"  Critical: {summary['by_severity']['critical']}")
    print(f"  High: {summary['by_severity']['high']}")
    print(f"  Medium: {summary['by_severity']['medium']}")
    print(f"  Low: {summary['by_severity']['low']}")
    print("=" * 60)
    print(f"\nResults saved to: {output_dir}")
    
    return summary, all_issues

if __name__ == '__main__':
    summary, issues = main()
    sys.exit(0 if summary['total_issues'] == 0 else 1)
