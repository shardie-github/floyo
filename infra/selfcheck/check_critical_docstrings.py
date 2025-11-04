#!/usr/bin/env python3
"""Check that critical functions have docstrings."""
import ast
import sys
from pathlib import Path

CRITICAL_FUNCTIONS = [
    "get_current_user",
    "execute_workflow",
    "process_event_batch",
    "validate_production"
]

def check_docstrings(file_path: Path) -> list:
    """Check if critical functions have docstrings."""
    if not file_path.exists():
        return []
    
    missing = []
    try:
        with open(file_path, 'r') as f:
            tree = ast.parse(f.read(), filename=str(file_path))
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                if node.name in CRITICAL_FUNCTIONS:
                    if not ast.get_docstring(node):
                        missing.append(node.name)
    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}")
    
    return missing

if __name__ == "__main__":
    files_to_check = [
        Path("backend/main.py"),
        Path("backend/workflow_scheduler.py"),
        Path("backend/batch_processor.py"),
        Path("backend/config.py")
    ]
    
    all_missing = []
    for file_path in files_to_check:
        missing = check_docstrings(file_path)
        if missing:
            all_missing.extend([f"{file_path.name}::{func}" for func in missing])
    
    if all_missing:
        print(f"⚠️  Missing docstrings for {len(all_missing)} critical functions:")
        for func in all_missing:
            print(f"   - {func}")
        # Don't fail, just warn
        sys.exit(0)
    else:
        print("✅ All critical functions have docstrings")
        sys.exit(0)
