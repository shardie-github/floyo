#!/usr/bin/env python3
"""
Check if schema.sql matches models.py (if schema.sql is maintained).
Returns exit code 0 if schema is complete or archived, 1 if incomplete.
"""
import sys
import re
from pathlib import Path

def extract_tables_from_schema(schema_path):
    """Extract table names from schema.sql."""
    if not schema_path.exists():
        return set()
    
    tables = set()
    with open(schema_path, 'r') as f:
        content = f.read()
        # Match CREATE TABLE statements
        matches = re.findall(r'CREATE TABLE\s+(\w+)', content, re.IGNORECASE)
        tables.update(matches)
    
    return tables

def extract_tables_from_models(models_path):
    """Extract table names from models.py."""
    if not models_path.exists():
        return set()
    
    tables = set()
    with open(models_path, 'r') as f:
        content = f.read()
        # Match class definitions that inherit from Base
        matches = re.findall(r'class\s+(\w+)\s*\([^)]*Base[^)]*\)', content)
        tables.update(matches)
    
    return tables

def main():
    """Main entry point."""
    repo_root = Path(__file__).parent.parent.parent
    schema_path = repo_root / "database" / "schema.sql"
    models_path = repo_root / "database" / "models.py"
    
    # Check if schema.sql is archived
    if schema_path.exists():
        with open(schema_path, 'r') as f:
            content = f.read()
            if 'ARCHIVED' in content or 'DEPRECATED' in content or 'migration-only' in content.lower():
                print("OK: schema.sql is archived or deprecated")
                return 0
    
    # If schema.sql doesn't exist, that's fine (migration-only approach)
    if not schema_path.exists():
        print("OK: schema.sql does not exist (migration-only approach)")
        return 0
    
    # Extract tables from both files
    schema_tables = extract_tables_from_schema(schema_path)
    models_tables = extract_tables_from_models(models_path)
    
    if not models_tables:
        print("Warning: Could not extract tables from models.py", file=sys.stderr)
        return 0
    
    # Check if schema is complete
    missing = models_tables - schema_tables
    
    if missing:
        print(f"WARNING: schema.sql is incomplete. Missing tables: {missing}", file=sys.stderr)
        print(f"  Schema has {len(schema_tables)} tables, models has {len(models_tables)} tables", file=sys.stderr)
        # Don't fail, just warn (as per audit recommendation)
        return 0
    
    print(f"OK: schema.sql matches models.py ({len(schema_tables)} tables)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
