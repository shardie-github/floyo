#!/usr/bin/env python3
"""
Check for hardcoded secrets, tokens, or API keys in code.
Returns exit code 0 if no secrets found, 1 if secrets detected.
"""
import sys
import re
from pathlib import Path

# Patterns that might indicate hardcoded secrets
SECRET_PATTERNS = [
    (r'["\'](sk-|pk-|secret|api_key|apikey|password|token|bearer)\s*[:=]\s*["\']([^"\']{20,})["\']', re.IGNORECASE),
    (r'secret_key\s*=\s*["\']([^"\']{10,})["\']', re.IGNORECASE),
    (r'api[_-]?key\s*=\s*["\']([^"\']{10,})["\']', re.IGNORECASE),
    (r'password\s*=\s*["\']([^"\']{5,})["\']', re.IGNORECASE),
    (r'token\s*=\s*["\']([^"\']{20,})["\']', re.IGNORECASE),
]

# Files/directories to exclude
EXCLUDE_PATTERNS = [
    'node_modules',
    '__pycache__',
    '.git',
    '.env',
    '.env.example',
    'migrations',
    'tests',  # Test files may have fake secrets
    'infra/selfcheck',  # Our own check scripts
]

# Known safe defaults (from config.py)
SAFE_DEFAULTS = [
    'your-secret-key-change-in-production',
    'change-me-in-production',
    'localhost',
    'postgresql://',
    'http://localhost',
]

def is_excluded(file_path):
    """Check if file should be excluded from scanning."""
    path_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in path_str:
            return True
    return False

def scan_file(file_path):
    """Scan a file for potential hardcoded secrets."""
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        for line_num, line in enumerate(lines, 1):
            for pattern, flags in SECRET_PATTERNS:
                matches = re.finditer(pattern, line, flags)
                for match in matches:
                    value = match.group(1) if match.groups() else match.group(0)
                    # Check if it's a safe default
                    if any(safe in value.lower() for safe in SAFE_DEFAULTS):
                        continue
                    # Check if it's a comment or docstring
                    if line.strip().startswith('#') or '"""' in line or "'''" in line:
                        continue
                    findings.append({
                        'file': str(file_path),
                        'line': line_num,
                        'match': match.group(0),
                        'context': line.strip()[:100]
                    })
    except Exception as e:
        # Skip files that can't be read
        pass
    
    return findings

def main():
    """Main entry point."""
    repo_root = Path(__file__).parent.parent.parent
    findings = []
    
    # Scan Python files
    for py_file in repo_root.rglob("*.py"):
        if is_excluded(py_file):
            continue
        findings.extend(scan_file(py_file))
    
    # Scan JavaScript/TypeScript files
    for js_file in repo_root.rglob("*.{js,ts,tsx}"):
        if is_excluded(js_file):
            continue
        findings.extend(scan_file(js_file))
    
    if findings:
        print("ERROR: Potential hardcoded secrets detected:", file=sys.stderr)
        for finding in findings[:10]:  # Limit to first 10
            print(f"  {finding['file']}:{finding['line']}: {finding['match'][:50]}...", file=sys.stderr)
        if len(findings) > 10:
            print(f"  ... and {len(findings) - 10} more", file=sys.stderr)
        return 1
    
    print("OK: No hardcoded secrets detected")
    return 0

if __name__ == "__main__":
    sys.exit(main())
