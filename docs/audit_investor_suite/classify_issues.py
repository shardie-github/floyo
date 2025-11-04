#!/usr/bin/env python3
"""
Issue Classification & Register Generator
Creates ISSUE_REGISTER.json with impact×likelihood scoring
"""
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import hashlib

def calculate_impact_score(severity: str, domain: str) -> int:
    """Calculate impact score (1-10)."""
    severity_scores = {
        'critical': 10,
        'high': 7,
        'medium': 4,
        'low': 2
    }
    
    base_score = severity_scores.get(severity.lower(), 5)
    
    # Adjust based on domain
    domain_multipliers = {
        'technical': 1.0,  # Technical issues are critical
        'security': 1.2,   # Security issues are extra critical
        'financial': 1.1,  # Financial issues matter
        'governance': 1.0,
        'product': 0.9,
        'gtm': 0.8
    }
    
    multiplier = domain_multipliers.get(domain.lower(), 1.0)
    return min(10, int(base_score * multiplier))

def calculate_likelihood_score(severity: str, file: str) -> int:
    """Calculate likelihood score (1-10)."""
    # Critical issues are more likely to cause problems
    if severity == 'critical':
        return 9
    elif severity == 'high':
        return 7
    elif severity == 'medium':
        return 5
    elif severity == 'low':
        return 3
    
    # Check if it's in a critical path
    critical_files = ['main.py', 'config.py', 'database.py', 'models.py']
    if any(cf in file for cf in critical_files):
        return min(10, (calculate_likelihood_score(severity, '') + 2))
    
    return 5

def generate_issue_id(title: str, file: str) -> str:
    """Generate unique issue ID."""
    slug = f"{title}_{file}".lower().replace(' ', '_').replace('/', '_')
    hash_obj = hashlib.md5(slug.encode())
    return f"ISSUE-{hash_obj.hexdigest()[:8].upper()}"

def classify_issues() -> Dict[str, Any]:
    """Classify issues and create register."""
    repo_root = Path(__file__).parent.parent.parent
    issues_file = Path(__file__).parent / 'all_issues.json'
    
    if not issues_file.exists():
        print("ERROR: all_issues.json not found. Run run_all_audits.py first.")
        sys.exit(1)
    
    all_issues = json.loads(issues_file.read_text())
    
    register = {
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0',
        'issues': []
    }
    
    for idx, issue in enumerate(all_issues, 1):
        severity = issue.get('severity', 'medium')
        domain = issue.get('source_audit', 'unknown').replace('audit_', '').replace('.py', '')
        title = issue.get('title', 'Untitled Issue')
        file = issue.get('file', 'unknown')
        
        impact = calculate_impact_score(severity, domain)
        likelihood = calculate_likelihood_score(severity, file)
        risk_score = impact * likelihood
        
        # Determine final severity label
        if risk_score >= 70:
            final_severity = 'Critical'
        elif risk_score >= 40:
            final_severity = 'Major'
        elif risk_score >= 20:
            final_severity = 'Minor'
        else:
            final_severity = 'Enhancement'
        
        # Generate slug for fix script naming
        slug = title.lower().replace(' ', '-').replace('_', '-')
        slug = ''.join(c for c in slug if c.isalnum() or c == '-')[:50]
        
        classified_issue = {
            'id': generate_issue_id(title, file),
            'slug': slug,
            'title': title,
            'description': issue.get('description', ''),
            'severity': final_severity,
            'domain': domain,
            'file': file,
            'status': 'open',
            'impact_score': impact,
            'likelihood_score': likelihood,
            'risk_score': risk_score,
            'created_at': datetime.utcnow().isoformat(),
            'suggested_owner': infer_owner(domain, file),
            'tags': infer_tags(severity, domain, file)
        }
        
        register['issues'].append(classified_issue)
    
    # Sort by risk score
    register['issues'].sort(key=lambda x: x['risk_score'], reverse=True)
    
    # Save register
    register_file = Path(__file__).parent / 'ISSUE_REGISTER.json'
    register_file.write_text(json.dumps(register, indent=2))
    
    print(f"✅ Classified {len(register['issues'])} issues")
    print(f"   Critical: {len([i for i in register['issues'] if i['severity'] == 'Critical'])}")
    print(f"   Major: {len([i for i in register['issues'] if i['severity'] == 'Major'])}")
    print(f"   Minor: {len([i for i in register['issues'] if i['severity'] == 'Minor'])}")
    print(f"   Saved to: {register_file}")
    
    return register

def infer_owner(domain: str, file: str) -> str:
    """Infer suggested owner based on domain and file."""
    if 'backend' in file:
        return 'backend-team'
    elif 'frontend' in file:
        return 'frontend-team'
    elif 'database' in file or 'models' in file:
        return 'data-team'
    elif domain == 'security' or 'security' in file.lower():
        return 'security-team'
    elif domain == 'financial':
        return 'finance-team'
    elif domain == 'product':
        return 'product-team'
    elif domain == 'gtm':
        return 'growth-team'
    else:
        return 'engineering-team'

def infer_tags(severity: str, domain: str, file: str) -> List[str]:
    """Infer tags for issue."""
    tags = [domain, severity.lower()]
    
    if 'security' in file.lower() or 'secret' in file.lower():
        tags.append('security')
    if 'performance' in file.lower():
        tags.append('performance')
    if 'database' in file or 'migration' in file:
        tags.append('database')
    if 'config' in file:
        tags.append('configuration')
    if 'test' in file:
        tags.append('testing')
    
    return tags

if __name__ == '__main__':
    register = classify_issues()
    sys.exit(0)
