#!/usr/bin/env python3
"""Check for circular dependencies in backend modules."""
import ast
import os
from pathlib import Path
from collections import defaultdict
import sys

def get_imports(file_path: Path) -> set:
    """Extract import statements from a Python file."""
    imports = set()
    try:
        with open(file_path, 'r') as f:
            tree = ast.parse(f.read(), filename=str(file_path))
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}")
    
    return imports

def check_circular_deps(backend_dir: Path = Path("backend")) -> tuple[bool, list]:
    """
    Check for circular dependencies.
    Returns (has_circular, cycles_found)
    """
    if not backend_dir.exists():
        print(f"❌ Backend directory not found: {backend_dir}")
        return False, []
    
    # Build dependency graph
    graph = defaultdict(set)
    modules = {}
    
    for py_file in backend_dir.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
        module_name = py_file.stem
        modules[module_name] = py_file
        imports = get_imports(py_file)
        
        # Filter to only backend imports
        for imp in imports:
            if imp == "backend" or imp.startswith("backend."):
                # Extract module name
                if "." in imp:
                    dep_module = imp.split(".")[1]
                else:
                    dep_module = None
                
                if dep_module and dep_module in modules:
                    graph[module_name].add(dep_module)
    
    # Check for cycles using DFS
    def has_cycle(node, visited, rec_stack):
        visited.add(node)
        rec_stack.add(node)
        
        for neighbor in graph.get(node, set()):
            if neighbor not in visited:
                if has_cycle(neighbor, visited, rec_stack):
                    return True
            elif neighbor in rec_stack:
                return True
        
        rec_stack.remove(node)
        return False
    
    cycles = []
    visited = set()
    
    for module in modules:
        if module not in visited:
            rec_stack = set()
            if has_cycle(module, visited, rec_stack):
                cycles.append(list(rec_stack))
    
    return len(cycles) == 0, cycles

if __name__ == "__main__":
    backend_dir = Path(__file__).parent.parent.parent / "backend"
    has_no_circular, cycles = check_circular_deps(backend_dir)
    
    if has_no_circular:
        print("✅ No circular dependencies found")
        sys.exit(0)
    else:
        print(f"❌ Found {len(cycles)} circular dependency cycle(s):")
        for cycle in cycles:
            print(f"   {' -> '.join(cycle)} -> {cycle[0]}")
        sys.exit(1)
