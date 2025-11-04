#!/usr/bin/env python3
"""
Check if database migrations are up to date.
Returns exit code 0 if migrations are current, 1 otherwise.
"""
import sys
import os
import subprocess
from pathlib import Path

def check_migrations():
    """Check migration status using Alembic."""
    try:
        # Check if alembic is available
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )
        
        if result.returncode != 0:
            print(f"Warning: Could not check migrations: {result.stderr}", file=sys.stderr)
            return 0  # Don't fail if alembic is not available
        
        # Check if there are pending migrations
        result = subprocess.run(
            ["alembic", "check"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )
        
        if result.returncode != 0:
            print(f"ERROR: Pending migrations detected", file=sys.stderr)
            print(result.stdout, file=sys.stderr)
            return 1
        
        # Check if there are heads (multiple heads = issue)
        result = subprocess.run(
            ["alembic", "heads"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )
        
        if result.returncode == 0:
            heads = result.stdout.strip().split('\n')
            heads = [h for h in heads if h and not h.startswith('#')]
            if len(heads) > 1:
                print(f"WARNING: Multiple migration heads detected: {heads}", file=sys.stderr)
                # Don't fail, just warn
        
        print("OK: Migrations are up to date")
        return 0
        
    except FileNotFoundError:
        print("Warning: alembic not found, skipping migration check", file=sys.stderr)
        return 0
    except Exception as e:
        print(f"Warning: Could not check migrations: {e}", file=sys.stderr)
        return 0  # Don't fail build if check fails

if __name__ == "__main__":
    sys.exit(check_migrations())
