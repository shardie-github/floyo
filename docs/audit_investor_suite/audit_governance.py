#!/usr/bin/env python3
"""
Governance & Compliance Audit
Assesses: compliance, IP, bus-factor, documentation
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def check_compliance() -> List[Dict]:
    """Check compliance requirements."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for GDPR compliance (data export/deletion)
    main_py = repo_root / 'backend' / 'main.py'
    if main_py.exists():
        content = main_py.read_text()
        if '/api/data/export' in content and '/api/data/delete' in content:
            # GDPR endpoints exist
            pass
        else:
            issues.append({
                'severity': 'high',
                'title': 'Missing GDPR compliance endpoints',
                'file': 'backend/main.py',
                'description': 'Data export/deletion endpoints may be missing'
            })
    
    # Check for audit logging
    audit_py = repo_root / 'backend' / 'audit.py'
    if not audit_py.exists():
        issues.append({
            'severity': 'high',
            'title': 'Missing audit logging',
            'file': 'backend/audit.py',
            'description': 'No audit trail infrastructure'
        })
    
    # Check for privacy policy / terms
    docs = repo_root / 'docs'
    if docs.exists():
        privacy_files = list(docs.rglob('*privacy*')) + list(docs.rglob('*terms*'))
        if not privacy_files:
            issues.append({
                'severity': 'medium',
                'title': 'Missing privacy/terms documentation',
                'file': 'docs',
                'description': 'No privacy policy or terms of service found'
            })
    
    return issues

def check_ip_licensing() -> List[Dict]:
    """Check IP and licensing."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for LICENSE file
    license_file = repo_root / 'LICENSE'
    if not license_file.exists():
        issues.append({
            'severity': 'high',
            'title': 'Missing LICENSE file',
            'file': 'LICENSE',
            'description': 'No license file found'
        })
    else:
        content = license_file.read_text()
        if 'Apache' in content or 'MIT' in content or 'GPL' in content:
            # Has a license
            pass
        else:
            issues.append({
                'severity': 'medium',
                'title': 'Unclear license',
                'file': 'LICENSE',
                'description': 'License file may not specify clear terms'
            })
    
    # Check for dependency licenses
    # This would require license scanning tool
    issues.append({
        'severity': 'low',
        'title': 'Dependency license audit recommended',
        'file': 'requirements.txt',
        'description': 'Run license scanner (e.g., pip-licenses) to verify compliance'
    })
    
    return issues

def check_bus_factor() -> List[Dict]:
    """Check bus factor / documentation."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for onboarding docs
    onboarding = repo_root / 'docs' / 'DEVELOPER_ONBOARDING.md'
    if not onboarding.exists():
        issues.append({
            'severity': 'medium',
            'title': 'Missing developer onboarding guide',
            'file': 'docs/DEVELOPER_ONBOARDING.md',
            'description': 'No onboarding documentation for new developers'
        })
    
    # Check for architecture docs
    arch_docs = list((repo_root / 'docs').rglob('*architect*')) + list((repo_root / 'docs').rglob('*system*'))
    if not arch_docs:
        issues.append({
            'severity': 'medium',
            'title': 'Missing architecture documentation',
            'file': 'docs',
            'description': 'No system architecture documentation'
        })
    
    # Check for ADRs
    adr_dir = repo_root / 'docs' / 'ADRs'
    if adr_dir.exists():
        adrs = list(adr_dir.glob('*.md'))
        if not adrs:
            issues.append({
                'severity': 'low',
                'title': 'No Architecture Decision Records',
                'file': 'docs/ADRs',
                'description': 'ADR directory exists but no records found'
            })
    
    return issues

def check_rbac() -> List[Dict]:
    """Check role-based access control."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for RBAC implementation
    rbac_py = repo_root / 'backend' / 'rbac.py'
    if not rbac_py.exists():
        issues.append({
            'severity': 'high',
            'title': 'Missing RBAC implementation',
            'file': 'backend/rbac.py',
            'description': 'No role-based access control system'
        })
    
    # Check models for Role model
    models = repo_root / 'database' / 'models.py'
    if models.exists():
        content = models.read_text()
        if 'class Role' not in content:
            issues.append({
                'severity': 'medium',
                'title': 'Missing Role model',
                'file': 'database/models.py',
                'description': 'No Role model in database schema'
            })
    
    return issues

def run_governance_audit() -> Dict[str, Any]:
    """Run governance audit."""
    print("🛡️ Running Governance & Compliance Audit...")
    
    all_issues = []
    all_issues.extend(check_compliance())
    all_issues.extend(check_ip_licensing())
    all_issues.extend(check_bus_factor())
    all_issues.extend(check_rbac())
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'domain': 'governance',
        'issues': all_issues,
        'summary': {
            'total_issues': len(all_issues),
            'critical': len([i for i in all_issues if i['severity'] == 'critical']),
            'high': len([i for i in all_issues if i['severity'] == 'high']),
            'medium': len([i for i in all_issues if i['severity'] == 'medium']),
            'low': len([i for i in all_issues if i['severity'] == 'low'])
        }
    }

if __name__ == '__main__':
    results = run_governance_audit()
    output_file = Path(__file__).parent / 'governance_audit.json'
    output_file.write_text(json.dumps(results, indent=2))
    print(f"✅ Governance audit complete: {results['summary']['total_issues']} issues found")
    print(f"   Saved to: {output_file}")
