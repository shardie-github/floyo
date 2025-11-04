#!/usr/bin/env python3
"""
Investor Technical Audit
Assesses: performance, security, CI/CD, scalability, code quality
"""
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def check_security_issues() -> List[Dict]:
    """Check for security vulnerabilities."""
    issues = []
    
    # Check for hardcoded secrets
    repo_root = Path(__file__).parent.parent.parent
    secret_patterns = [
        (r'password\s*=\s*["\'].*["\']', 'Hardcoded password'),
        (r'api[_-]?key\s*=\s*["\'][^"\']+["\']', 'Hardcoded API key'),
        (r'secret[_-]?key\s*=\s*["\'][^"\']+["\']', 'Hardcoded secret key'),
        (r'token\s*=\s*["\'][^"\']+["\']', 'Hardcoded token'),
    ]
    
    for py_file in repo_root.rglob('*.py'):
        if 'node_modules' in str(py_file) or '.git' in str(py_file):
            continue
        try:
            content = py_file.read_text()
            for pattern, desc in secret_patterns:
                import re
                if re.search(pattern, content, re.IGNORECASE):
                    issues.append({
                        'severity': 'critical',
                        'title': desc,
                        'file': str(py_file.relative_to(repo_root)),
                        'description': f'Potential hardcoded credential in {py_file.name}'
                    })
        except:
            pass
    
    # Check CORS configuration
    config_path = repo_root / 'backend' / 'config.py'
    if config_path.exists():
        content = config_path.read_text()
        if '*.*' in content or 'allow_origins=["*"]' in content:
            issues.append({
                'severity': 'high',
                'title': 'Permissive CORS configuration',
                'file': 'backend/config.py',
                'description': 'CORS allows all origins, security risk in production'
            })
    
    # Check for default/weak secret key
    env_example = repo_root / '.env.example'
    if env_example.exists():
        content = env_example.read_text()
        if 'SECRET_KEY=your-secret-key-change-in-production' in content or 'SECRET_KEY=change-me' in content:
            issues.append({
                'severity': 'critical',
                'title': 'Default SECRET_KEY in .env.example',
                'file': '.env.example',
                'description': 'Default secret key should not be in example file'
            })
    
    return issues

def check_performance_issues() -> List[Dict]:
    """Check for performance bottlenecks."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for N+1 query patterns
    main_py = repo_root / 'backend' / 'main.py'
    if main_py.exists():
        content = main_py.read_text()
        # Look for loops with DB queries
        if 'for' in content and 'db.query' in content:
            issues.append({
                'severity': 'medium',
                'title': 'Potential N+1 query pattern',
                'file': 'backend/main.py',
                'description': 'Review for N+1 query patterns in loops'
            })
    
    # Check database connection pool settings
    config_py = repo_root / 'backend' / 'config.py'
    if config_py.exists():
        content = config_py.read_text()
        if 'database_pool_size' in content:
            # Check if pool size is reasonable
            import re
            pool_match = re.search(r'database_pool_size:\s*int\s*=\s*Field\(default=(\d+)', content)
            if pool_match:
                pool_size = int(pool_match.group(1))
                if pool_size < 5:
                    issues.append({
                        'severity': 'medium',
                        'title': 'Small database connection pool',
                        'file': 'backend/config.py',
                        'description': f'Pool size ({pool_size}) may be too small for production'
                    })
    
    return issues

def check_ci_cd_issues() -> List[Dict]:
    """Check CI/CD configuration."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    workflows_dir = repo_root / '.github' / 'workflows'
    
    if not workflows_dir.exists():
        issues.append({
            'severity': 'high',
            'title': 'Missing CI/CD workflows',
            'file': '.github/workflows',
            'description': 'No GitHub Actions workflows found'
        })
    else:
        workflows = list(workflows_dir.glob('*.yml'))
        if not workflows:
            issues.append({
                'severity': 'high',
                'title': 'No CI/CD workflow files',
                'file': '.github/workflows',
                'description': 'No workflow YAML files found'
            })
        
        # Check for test coverage
        has_test_workflow = any('test' in w.name.lower() or 'ci' in w.name.lower() for w in workflows)
        if not has_test_workflow:
            issues.append({
                'severity': 'medium',
                'title': 'Missing automated test workflow',
                'file': '.github/workflows',
                'description': 'No dedicated test automation workflow'
            })
    
    return issues

def check_scalability_issues() -> List[Dict]:
    """Check scalability concerns."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check for rate limiting
    rate_limit_file = repo_root / 'backend' / 'rate_limit.py'
    if not rate_limit_file.exists():
        issues.append({
            'severity': 'high',
            'title': 'Missing rate limiting',
            'file': 'backend/rate_limit.py',
            'description': 'No rate limiting implementation found'
        })
    
    # Check for caching
    cache_file = repo_root / 'backend' / 'cache.py'
    if not cache_file.exists():
        issues.append({
            'severity': 'medium',
            'title': 'Missing caching layer',
            'file': 'backend/cache.py',
            'description': 'No caching implementation found'
        })
    
    # Check for database migrations
    migrations_dir = repo_root / 'migrations'
    if not migrations_dir.exists() or not list(migrations_dir.glob('*.py')):
        issues.append({
            'severity': 'critical',
            'title': 'Missing database migrations',
            'file': 'migrations',
            'description': 'No Alembic migration files found'
        })
    
    return issues

def check_dependency_issues() -> List[Dict]:
    """Check for dependency vulnerabilities."""
    issues = []
    
    repo_root = Path(__file__).parent.parent.parent
    
    # Check Python requirements
    requirements = repo_root / 'backend' / 'requirements.txt'
    if requirements.exists():
        content = requirements.read_text()
        # Check for unpinned versions (no ==)
        unpinned = [line for line in content.split('\n') 
                   if line.strip() and not line.startswith('#') 
                   and '>=' in line and '<' not in line]
        if unpinned:
            issues.append({
                'severity': 'medium',
                'title': 'Unpinned dependencies in requirements.txt',
                'file': 'backend/requirements.txt',
                'description': f'{len(unpinned)} dependencies without exact version pins'
            })
    
    # Check Node dependencies
    package_json = repo_root / 'frontend' / 'package.json'
    if package_json.exists():
        import json
        try:
            data = json.loads(package_json.read_text())
            deps = data.get('dependencies', {})
            unpinned_node = [k for k, v in deps.items() if '^' in str(v) or '~' in str(v)]
            if unpinned_node:
                issues.append({
                    'severity': 'medium',
                    'title': 'Unpinned Node dependencies',
                    'file': 'frontend/package.json',
                    'description': f'{len(unpinned_node)} dependencies with version ranges'
                })
        except:
            pass
    
    return issues

def run_technical_audit() -> Dict[str, Any]:
    """Run comprehensive technical audit."""
    print("🔍 Running Technical Audit...")
    
    all_issues = []
    all_issues.extend(check_security_issues())
    all_issues.extend(check_performance_issues())
    all_issues.extend(check_ci_cd_issues())
    all_issues.extend(check_scalability_issues())
    all_issues.extend(check_dependency_issues())
    
    # Run existing guardrails if available
    guardrails_script = Path(__file__).parent.parent.parent / 'infra' / 'selfcheck' / 'validate_guardrails.py'
    guardrail_results = {}
    if guardrails_script.exists():
        try:
            result = subprocess.run(
                [sys.executable, str(guardrails_script), '--json'],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                guardrail_results = json.loads(result.stdout)
        except:
            pass
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'domain': 'technical',
        'issues': all_issues,
        'guardrail_results': guardrail_results,
        'summary': {
            'total_issues': len(all_issues),
            'critical': len([i for i in all_issues if i['severity'] == 'critical']),
            'high': len([i for i in all_issues if i['severity'] == 'high']),
            'medium': len([i for i in all_issues if i['severity'] == 'medium']),
            'low': len([i for i in all_issues if i['severity'] == 'low'])
        }
    }

if __name__ == '__main__':
    results = run_technical_audit()
    output_file = Path(__file__).parent / 'technical_audit.json'
    output_file.write_text(json.dumps(results, indent=2))
    print(f"✅ Technical audit complete: {results['summary']['total_issues']} issues found")
    print(f"   Saved to: {output_file}")
