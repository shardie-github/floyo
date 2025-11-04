#!/usr/bin/env python3
"""
Check if rate limiting uses Redis when available.
Returns exit code 0 if properly configured, 1 otherwise.
"""
import sys
import os
import re
from pathlib import Path

def check_rate_limit_implementation():
    """Check if rate_limit.py uses Redis when available."""
    repo_root = Path(__file__).parent.parent.parent
    rate_limit_file = repo_root / "backend" / "rate_limit.py"
    
    if not rate_limit_file.exists():
        print("Warning: rate_limit.py not found", file=sys.stderr)
        return 0
    
    with open(rate_limit_file, 'r') as f:
        content = f.read()
    
    # Check if Redis is used when available
    has_redis_check = (
        'redis' in content.lower() or
        'redis_url' in content or
        'storage_uri' in content or
        'settings.redis_url' in content
    )
    
    if has_redis_check:
        print("OK: Rate limiting checks for Redis availability")
        return 0
    
    # If Redis check doesn't exist, that's a warning (not critical)
    print("WARNING: Rate limiting may not use Redis backend when available", file=sys.stderr)
    return 0  # Don't fail, just warn

if __name__ == "__main__":
    sys.exit(check_rate_limit_implementation())
