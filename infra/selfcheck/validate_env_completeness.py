#!/usr/bin/env python3
"""Validate that .env.example contains all required configuration variables."""
import sys
from pathlib import Path
import re

def parse_env_file(file_path: Path) -> dict:
    """Parse .env file and return dict of variables."""
    env_vars = {}
    if not file_path.exists():
        return env_vars
    
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key = line.split('=')[0].strip()
                env_vars[key] = True
    
    return env_vars

def get_config_fields() -> set:
    """Get required fields from backend/config.py."""
    config_file = Path("backend/config.py")
    if not config_file.exists():
        return set()
    
    fields = set()
    with open(config_file, 'r') as f:
        content = f.read()
        # Extract Field definitions
        pattern = r'(\w+):\s*str\s*=\s*Field\(|(\w+):\s*int\s*=\s*Field\(|(\w+):\s*Optional\[.*\]\s*=\s*Field\('
        for match in re.finditer(pattern, content):
            field_name = match.group(1) or match.group(2) or match.group(3)
            if field_name:
                # Convert snake_case to UPPER_CASE
                env_name = field_name.upper()
                fields.add(env_name)
    
    return fields

if __name__ == "__main__":
    env_example = Path(".env.example")
    if not env_example.exists():
        print("❌ .env.example not found")
        sys.exit(1)
    
    env_vars = parse_env_file(env_example)
    required_fields = get_config_fields()
    
    missing = []
    for field in required_fields:
        # Check various possible names
        found = False
        for env_key in env_vars.keys():
            if field in env_key or env_key in field:
                found = True
                break
        if not found:
            missing.append(field)
    
    if missing:
        print(f"❌ Missing {len(missing)} environment variables in .env.example:")
        for var in missing:
            print(f"   - {var}")
        sys.exit(1)
    else:
        print("✅ .env.example contains all required variables")
        sys.exit(0)
