#!/usr/bin/env python3
"""
GTM & Growth Audit
Assesses: funnel health, CAC/LTV, channel mix, conversion tracking
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def check_funnel_tracking() -> List[Dict]:
    """Check funnel conversion tracking."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for signup/login tracking
    main_py = repo_root / 'backend' / 'main.py'
    if main_py.exists():
        content = main_py.read_text()
        if '/api/auth/register' in content:
            # Check if registration is tracked
            if 'log_audit' not in content or 'analytics' not in content.lower():
                issues.append({
                    'severity': 'medium',
                    'title': 'Missing signup conversion tracking',
                    'file': 'backend/main.py',
                    'description': 'Registration endpoint not tracked for funnel analysis'
                })
    
    return issues

def check_growth_infrastructure() -> List[Dict]:
    """Check growth tooling."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for A/B testing infrastructure
    experiments = repo_root / 'backend' / 'experiments.py'
    if not experiments.exists():
        issues.append({
            'severity': 'low',
            'title': 'Missing experimentation framework',
            'file': 'backend/experiments.py',
            'description': 'No A/B testing infrastructure'
        })
    
    # Check for referral tracking
    # This would be in models typically
    models = repo_root / 'database' / 'models.py'
    if models.exists():
        content = models.read_text()
        if 'referral' not in content.lower() and 'invite' not in content.lower():
            issues.append({
                'severity': 'low',
                'title': 'Missing referral tracking',
                'file': 'database/models.py',
                'description': 'No referral/invite system in data model'
            })
    
    return issues

def check_channel_tracking() -> List[Dict]:
    """Check marketing channel attribution."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for UTM parameter tracking
    # This would typically be in user registration or session tracking
    models = repo_root / 'database' / 'models.py'
    if models.exists():
        content = models.read_text()
        # Look for User model with source tracking
        if 'source' not in content.lower() and 'utm' not in content.lower():
            issues.append({
                'severity': 'medium',
                'title': 'Missing channel attribution',
                'file': 'database/models.py',
                'description': 'No UTM/source tracking in user model'
            })
    
    return issues

def estimate_cac_ltv() -> Dict[str, Any]:
    """Estimate CAC/LTV metrics (placeholder)."""
    # This would require actual data
    return {
        'cac_estimate': None,
        'ltv_estimate': None,
        'ltv_cac_ratio': None,
        'note': 'Requires actual user acquisition and revenue data'
    }

def run_gtm_audit() -> Dict[str, Any]:
    """Run GTM audit."""
    print("📈 Running GTM & Growth Audit...")
    
    all_issues = []
    all_issues.extend(check_funnel_tracking())
    all_issues.extend(check_growth_infrastructure())
    all_issues.extend(check_channel_tracking())
    
    cac_ltv = estimate_cac_ltv()
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'domain': 'gtm',
        'issues': all_issues,
        'cac_ltv_metrics': cac_ltv,
        'summary': {
            'total_issues': len(all_issues),
            'critical': len([i for i in all_issues if i['severity'] == 'critical']),
            'high': len([i for i in all_issues if i['severity'] == 'high']),
            'medium': len([i for i in all_issues if i['severity'] == 'medium']),
            'low': len([i for i in all_issues if i['severity'] == 'low'])
        }
    }

if __name__ == '__main__':
    results = run_gtm_audit()
    output_file = Path(__file__).parent / 'gtm_audit.json'
    output_file.write_text(json.dumps(results, indent=2))
    print(f"✅ GTM audit complete: {results['summary']['total_issues']} issues found")
    print(f"   Saved to: {output_file}")
