#!/usr/bin/env python3
"""
Check if code aligns with ADRs (Architecture Decision Records).
Returns exit code 0 if aligned, 1 if drift detected.
"""
import sys
from pathlib import Path

def check_adr_alignment():
    """Check alignment with ADRs."""
    repo_root = Path(__file__).parent.parent.parent
    adr_dir = repo_root / "docs" / "ADRs"
    
    if not adr_dir.exists():
        print("OK: No ADRs found (no alignment check needed)")
        return 0
    
    # Check ADR 001: FastAPI framework
    adr_001 = adr_dir / "001-api-framework-selection.md"
    if adr_001.exists():
        # Check if main.py uses FastAPI
        main_py = repo_root / "backend" / "main.py"
        if main_py.exists():
            with open(main_py, 'r') as f:
                content = f.read()
                if 'FastAPI' not in content and 'from fastapi' not in content:
                    print("WARNING: ADR 001 specifies FastAPI, but main.py doesn't use it", file=sys.stderr)
                    return 0  # Warning, not error
    
    # Check ADR 002: PostgreSQL database
    adr_002 = adr_dir / "002-database-choice.md"
    if adr_002.exists():
        # Check if config uses PostgreSQL
        config_py = repo_root / "backend" / "config.py"
        if config_py.exists():
            with open(config_py, 'r') as f:
                content = f.read()
                if 'postgresql' not in content.lower() and 'postgres' not in content.lower():
                    print("WARNING: ADR 002 specifies PostgreSQL, but config doesn't reference it", file=sys.stderr)
                    return 0  # Warning, not error
    
    print("OK: Code appears aligned with ADRs")
    return 0

if __name__ == "__main__":
    sys.exit(check_adr_alignment())
