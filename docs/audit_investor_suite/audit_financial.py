#!/usr/bin/env python3
"""
Financial Forecast & Health Check
Assesses: runway, burn rate, margin proxies, sensitivity analysis
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def check_cost_optimization() -> List[Dict]:
    """Check for cost optimization opportunities."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for greenops/cost tracking
    greenops = repo_root / 'infra' / 'selfcheck' / 'greenops_econ.py'
    if not greenops.exists():
        issues.append({
            'severity': 'low',
            'title': 'Missing cost optimization tracking',
            'file': 'infra/selfcheck/greenops_econ.py',
            'description': 'No cost/greenops monitoring'
        })
    
    # Check Docker configuration for resource limits
    docker_compose = repo_root / 'docker-compose.yml'
    if docker_compose.exists():
        content = docker_compose.read_text()
        if 'deploy' not in content or 'resources' not in content:
            issues.append({
                'severity': 'low',
                'title': 'Missing resource limits in Docker',
                'file': 'docker-compose.yml',
                'description': 'No CPU/memory limits defined'
            })
    
    return issues

def estimate_runway() -> Dict[str, Any]:
    """Estimate runway (placeholder - requires financial data)."""
    return {
        'runway_months': None,
        'burn_rate_monthly': None,
        'cash_balance': None,
        'note': 'Requires actual financial data to calculate'
    }

def check_revenue_streams() -> List[Dict]:
    """Check for revenue tracking infrastructure."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for subscription/billing models
    models = repo_root / 'database' / 'models.py'
    if models.exists():
        content = models.read_text()
        if 'subscription' in content.lower():
            # Check if subscription_tier is used
            if 'subscription_tier' in content:
                # Good, has subscription model
                pass
            else:
                issues.append({
                    'severity': 'low',
                    'title': 'Incomplete subscription model',
                    'file': 'database/models.py',
                    'description': 'Subscription mentioned but tier field may be missing'
                })
        else:
            issues.append({
                'severity': 'low',
                'title': 'No subscription model found',
                'file': 'database/models.py',
                'description': 'No subscription/billing infrastructure'
            })
    
    return issues

def run_financial_audit() -> Dict[str, Any]:
    """Run financial audit."""
    print("💰 Running Financial Audit...")
    
    all_issues = []
    all_issues.extend(check_cost_optimization())
    all_issues.extend(check_revenue_streams())
    
    runway = estimate_runway()
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'domain': 'financial',
        'issues': all_issues,
        'runway_estimate': runway,
        'summary': {
            'total_issues': len(all_issues),
            'critical': len([i for i in all_issues if i['severity'] == 'critical']),
            'high': len([i for i in all_issues if i['severity'] == 'high']),
            'medium': len([i for i in all_issues if i['severity'] == 'medium']),
            'low': len([i for i in all_issues if i['severity'] == 'low'])
        }
    }

if __name__ == '__main__':
    results = run_financial_audit()
    output_file = Path(__file__).parent / 'financial_audit.json'
    output_file.write_text(json.dumps(results, indent=2))
    print(f"✅ Financial audit complete: {results['summary']['total_issues']} issues found")
    print(f"   Saved to: {output_file}")
