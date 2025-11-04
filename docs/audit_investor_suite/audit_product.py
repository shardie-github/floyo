#!/usr/bin/env python3
"""
Product Manager Audit
Assesses: roadmap clarity, UX coherence, telemetry, adoption metrics
"""
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def check_roadmap_clarity() -> List[Dict]:
    """Check for roadmap documentation."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    roadmap_files = [
        'ROADMAP.md',
        'ROADMAP_CONCISE.md',
        'NEXT_DEV_ROADMAP.md'
    ]
    
    found_roadmaps = []
    for fname in roadmap_files:
        if (repo_root / fname).exists():
            found_roadmaps.append(fname)
    
    if not found_roadmaps:
        issues.append({
            'severity': 'high',
            'title': 'Missing product roadmap',
            'file': 'ROADMAP.md',
            'description': 'No roadmap documentation found'
        })
    else:
        # Check if roadmap is recent
        for fname in found_roadmaps:
            file_path = repo_root / fname
            mtime = file_path.stat().st_mtime
            from datetime import datetime, timedelta
            age_days = (datetime.now().timestamp() - mtime) / 86400
            if age_days > 90:
                issues.append({
                    'severity': 'medium',
                    'title': f'Stale roadmap ({fname})',
                    'file': fname,
                    'description': f'Roadmap file last updated {int(age_days)} days ago'
                })
    
    return issues

def check_ux_coherence() -> List[Dict]:
    """Check UX consistency."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for design system / component library
    frontend_components = repo_root / 'frontend' / 'components'
    if frontend_components.exists():
        components = list(frontend_components.glob('*.tsx'))
        if not components:
            issues.append({
                'severity': 'medium',
                'title': 'No reusable components found',
                'file': 'frontend/components',
                'description': 'Missing component library/design system'
            })
    
    # Check for accessibility
    a11y_script = repo_root / 'infra' / 'selfcheck' / 'a11y_scan.mjs'
    if not a11y_script.exists():
        issues.append({
            'severity': 'medium',
            'title': 'Missing accessibility audit',
            'file': 'infra/selfcheck/a11y_scan.mjs',
            'description': 'No automated a11y scanning'
        })
    
    # Check for consistent styling
    tailwind_config = repo_root / 'frontend' / 'tailwind.config.js'
    if not tailwind_config.exists():
        issues.append({
            'severity': 'low',
            'title': 'Missing Tailwind config',
            'file': 'frontend/tailwind.config.js',
            'description': 'No design token configuration'
        })
    
    return issues

def check_telemetry() -> List[Dict]:
    """Check analytics and telemetry setup."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for analytics tracking
    analytics_contracts = repo_root / 'infra' / 'selfcheck' / 'analytics_contracts.mjs'
    if not analytics_contracts.exists():
        issues.append({
            'severity': 'medium',
            'title': 'Missing analytics contracts',
            'file': 'infra/selfcheck/analytics_contracts.mjs',
            'description': 'No analytics event tracking defined'
        })
    
    # Check for error tracking
    sentry_config = repo_root / 'backend' / 'sentry_config.py'
    if sentry_config.exists():
        content = sentry_config.read_text()
        if 'SENTRY_DSN' not in content or 'optional' in content.lower():
            issues.append({
                'severity': 'medium',
                'title': 'Sentry not fully configured',
                'file': 'backend/sentry_config.py',
                'description': 'Sentry DSN may be optional/missing'
            })
    else:
        issues.append({
            'severity': 'high',
            'title': 'Missing error tracking',
            'file': 'backend/sentry_config.py',
            'description': 'No error tracking setup'
        })
    
    return issues

def check_adoption_metrics() -> List[Dict]:
    """Check for user adoption tracking."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for user onboarding tracking
    onboarding_index = repo_root / 'infra' / 'selfcheck' / 'onboarding_index.py'
    if not onboarding_index.exists():
        issues.append({
            'severity': 'low',
            'title': 'Missing onboarding metrics',
            'file': 'infra/selfcheck/onboarding_index.py',
            'description': 'No onboarding completion tracking'
        })
    
    # Check for feature flag hygiene
    feature_flags = repo_root / 'backend' / 'feature_flags.py'
    if not feature_flags.exists():
        issues.append({
            'severity': 'medium',
            'title': 'Missing feature flag system',
            'file': 'backend/feature_flags.py',
            'description': 'No feature flag infrastructure'
        })
    
    return issues

def run_product_audit() -> Dict[str, Any]:
    """Run product audit."""
    print("📊 Running Product Audit...")
    
    all_issues = []
    all_issues.extend(check_roadmap_clarity())
    all_issues.extend(check_ux_coherence())
    all_issues.extend(check_telemetry())
    all_issues.extend(check_adoption_metrics())
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'domain': 'product',
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
    results = run_product_audit()
    output_file = Path(__file__).parent / 'product_audit.json'
    output_file.write_text(json.dumps(results, indent=2))
    print(f"✅ Product audit complete: {results['summary']['total_issues']} issues found")
    print(f"   Saved to: {output_file}")
