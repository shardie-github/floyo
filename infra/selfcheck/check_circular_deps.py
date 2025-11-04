#!/usr/bin/env python3
"""
Check for circular dependencies in backend modules.
Returns exit code 0 if no circular deps found, 1 otherwise.
"""
import sys
import os
import ast
from pathlib import Path
from collections import defaultdict

def find_imports(file_path):
    """Find all imports in a Python file."""
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filename=str(file_path))
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module.split('.')[0])
    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}", file=sys.stderr)
    
    return imports

def build_dependency_graph():
    """Build dependency graph for backend modules."""
    backend_dir = Path(__file__).parent.parent.parent / "backend"
    graph = defaultdict(set)
    modules = {}
    
    # Find all Python files
    for py_file in backend_dir.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
        
        module_name = py_file.stem
        modules[module_name] = py_file
        
        # Find imports
        imports = find_imports(py_file)
        for imp in imports:
            # Check if it's a backend module
            if imp == "backend" or (imp in modules and imp != module_name):
                graph[module_name].add(imp)
    
    return graph, modules

def has_cycle(graph):
    """Check if graph has cycles using DFS."""
    visited = set()
    rec_stack = set()
    
    def dfs(node):
        if node in rec_stack:
            return True  # Cycle found
        if node in visited:
            return False
        
        visited.add(node)
        rec_stack.add(node)
        
        for neighbor in graph.get(node, []):
            if dfs(neighbor):
                return True
        
        rec_stack.remove(node)
        return False
    
    for node in graph:
        if node not in visited:
            if dfs(node):
                return True
    
    return False

def main():
    """Main entry point."""
    graph, modules = build_dependency_graph()
    
    if has_cycle(graph):
        print("ERROR: Circular dependencies detected in backend modules", file=sys.stderr)
        print("Dependency graph:", file=sys.stderr)
        for node, deps in graph.items():
            if deps:
                print(f"  {node} -> {deps}", file=sys.stderr)
        return 1
    
    print("OK: No circular dependencies detected")
    return 0

if __name__ == "__main__":
    sys.exit(main())
