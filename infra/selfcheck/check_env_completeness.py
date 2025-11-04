#!/usr/bin/env python3
"""
Check if .env.example includes all required environment variables.
Returns exit code 0 if complete, 1 if missing variables.
"""
import sys
import re
from pathlib import Path

def extract_env_vars_from_config(config_path):
    """Extract environment variable names from config.py."""
    if not config_path.exists():
        return set()
    
    env_vars = set()
    with open(config_path, 'r') as f:
        content = f.read()
        # Match Field(..., description=...) or Field(default=..., description=...)
        # Look for patterns that suggest env vars
        matches = re.findall(r'(\w+):\s*\w+\s*=\s*Field\(', content)
        env_vars.update(matches)
    
    # Also look for explicit env var names
    matches = re.findall(r'env["\'](\w+)["\']', content, re.IGNORECASE)
    env_vars.update([m.upper() for m in matches])
    
    return env_vars

def extract_env_vars_from_example(example_path):
    """Extract environment variable names from .env.example."""
    if not example_path.exists():
        return set()
    
    env_vars = set()
    with open(example_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                var_name = line.split('=')[0].strip()
                env_vars.add(var_name)
    
    return env_vars

def main():
    """Main entry point."""
    repo_root = Path(__file__).parent.parent.parent
    config_path = repo_root / "backend" / "config.py"
    example_path = repo_root / ".env.example"
    
    if not example_path.exists():
        print("WARNING: .env.example not found", file=sys.stderr)
        return 0
    
    # Core required variables (from audit)
    required_vars = {
        'DATABASE_URL',
        'SECRET_KEY',
        'ENVIRONMENT',
        'CORS_ORIGINS',
    }
    
    example_vars = extract_env_vars_from_example(example_path)
    missing = required_vars - example_vars
    
    if missing:
        print(f"ERROR: .env.example missing required variables: {missing}", file=sys.stderr)
        return 1
    
    print(f"OK: .env.example includes required variables ({len(example_vars)} total)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
