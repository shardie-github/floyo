#!/usr/bin/env python3
"""Check for configuration duplication across files."""
import sys
from pathlib import Path
import re

def find_config_patterns(file_path: Path, patterns: list) -> dict:
    """Find configuration patterns in a file."""
    if not file_path.exists():
        return {}
    
    matches = {}
    with open(file_path, 'r') as f:
        content = f.read()
        for pattern in patterns:
            regex = re.compile(pattern, re.IGNORECASE)
            for match in regex.finditer(content):
                key = match.group(1) if match.groups() else match.group(0)
                if key not in matches:
                    matches[key] = []
                matches[key].append(str(file_path))
    
    return matches

if __name__ == "__main__":
    # Patterns to check for
    patterns = [
        r'SECRET_KEY\s*[:=]',
        r'DATABASE_URL\s*[:=]',
        r'REDIS_URL\s*[:=]',
        r'CORS_ORIGINS\s*[:=]'
    ]
    
    files_to_check = [
        Path("backend/config.py"),
        Path("docker-compose.yml"),
        Path("alembic.ini"),
        Path(".env.example")
    ]
    
    all_matches = {}
    for file_path in files_to_check:
        matches = find_config_patterns(file_path, patterns)
        for key, locations in matches.items():
            if key not in all_matches:
                all_matches[key] = []
            all_matches[key].extend(locations)
    
    duplicates = {k: v for k, v in all_matches.items() if len(set(v)) > 1}
    
    if duplicates:
        print("⚠️  Found configuration duplication:")
        for key, locations in duplicates.items():
            print(f"   {key} appears in: {', '.join(set(locations))}")
        # Don't fail, just warn
        sys.exit(0)
    else:
        print("✅ No significant configuration duplication found")
        sys.exit(0)
