"""
Dependency and Route Audit Report

This script checks for missing dependencies and incomplete API route setups.
"""

import ast
import os
from pathlib import Path
from typing import Set, Dict, List
import re

# Standard library imports (don't need to be in requirements)
STDLIB_MODULES = {
    'os', 'sys', 'json', 'time', 'datetime', 'typing', 'uuid', 'logging',
    'hashlib', 'secrets', 'base64', 'traceback', 'inspect', 'functools',
    'collections', 'itertools', 'pathlib', 're', 'urllib', 'email',
    'http', 'html', 'io', 'statistics', 'concurrent', 'subprocess',
    'platform', 'threading', 'asyncio', 'contextlib', 'dataclasses',
    'enum', 'abc', 'copy', 'pickle', 'sqlite3', 'csv', 'xml', 'zipfile',
    'gzip', 'shutil', 'tempfile', 'glob', 'fnmatch', 'random', 'math',
    'decimal', 'fractions', 'array', 'struct', 'heapq', 'bisect',
    'queue', 'weakref', 'gc', 'ctypes', 'multiprocessing', 'mmap',
    'select', 'socket', 'ssl', 'socketserver', 'http.server',
    'urllib.parse', 'urllib.request', 'urllib.error', 'email.mime',
    'email.message', 'email.utils', 'html.parser', 'html.entities',
    'http.client', 'http.cookies', 'http.server', 'xml.etree',
    'xml.dom', 'xml.sax', 'csv', 'configparser', 'netrc', 'xdrlib',
    'plistlib', 'shelve', 'dbm', 'sqlite3', 'zlib', 'gzip', 'bz2',
    'lzma', 'zipfile', 'tarfile', 'shutil', 'tempfile', 'fileinput',
    'linecache', 'shlex', 'netrc', 'getpass', 'curses', 'platform',
    'errno', 'io', 'readline', 'rlcompleter', 'pdb', 'profile',
    'pstats', 'timeit', 'trace', 'tracemalloc', 'gc', 'inspect',
    'site', 'fpectl', 'distutils', 'ensurepip', 'venv', 'zipapp',
    'faulthandler', 'pdb', 'profile', 'pstats', 'timeit', 'trace',
    'tracemalloc', 'gc', 'inspect', 'site', 'fpectl', 'distutils',
    'ensurepip', 'venv', 'zipapp', 'faulthandler', 'warnings',
    'contextlib', 'abc', 'atexit', 'traceback', 'future_builtins',
    'builtins', '__builtin__', 'exceptions', 'UserDict', 'UserList',
    'UserString', 'types', 'copy', 'pprint', 'reprlib', 'enum',
    'numbers', 'math', 'cmath', 'decimal', 'fractions', 'statistics',
    'random', 'secrets', 'string', 're', 'difflib', 'textwrap',
    'unicodedata', 'stringprep', 'readline', 'rlcompleter', 'struct',
    'codecs', 'encodings', 'unicodedata', 'stringprep', 'readline',
    'rlcompleter', 'struct', 'codecs', 'encodings', 'unicodedata',
    'stringprep', 'readline', 'rlcompleter', 'struct', 'codecs',
    'encodings', 'unicodedata', 'stringprep', 'readline', 'rlcompleter',
    'struct', 'codecs', 'encodings'
}

def extract_imports(file_path: Path) -> Set[str]:
    """Extract all imports from a Python file."""
    imports = set()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            tree = ast.parse(content, filename=str(file_path))
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        module = alias.name.split('.')[0]
                        if module not in STDLIB_MODULES:
                            imports.add(module)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        module = node.module.split('.')[0]
                        if module not in STDLIB_MODULES:
                            imports.add(module)
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    
    return imports

def get_installed_packages() -> Set[str]:
    """Get list of installed packages from requirements.txt."""
    packages = set()
    req_file = Path("backend/requirements.txt")
    
    if req_file.exists():
        with open(req_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Extract package name (before >=, ==, etc.)
                    package = re.split(r'[>=<!=]', line)[0].strip()
                    packages.add(package.lower())
    
    return packages

def find_missing_dependencies() -> Dict[str, List[str]]:
    """Find missing dependencies."""
    backend_dir = Path("backend")
    all_imports = set()
    
    # Scan all Python files
    for py_file in backend_dir.rglob("*.py"):
        imports = extract_imports(py_file)
        all_imports.update(imports)
    
    installed = get_installed_packages()
    missing = []
    
    # Common package name mappings
    package_mappings = {
        'fastapi': 'fastapi',
        'uvicorn': 'uvicorn',
        'sqlalchemy': 'sqlalchemy',
        'psycopg2': 'psycopg2-binary',
        'alembic': 'alembic',
        'jose': 'python-jose',
        'passlib': 'passlib',
        'pydantic': 'pydantic',
        'redis': 'redis',
        'celery': 'celery',
        'sentry': 'sentry-sdk',
        'psutil': 'psutil',
        'slowapi': 'slowapi',
        'pyotp': 'pyotp',
        'qrcode': 'qrcode',
        'cryptography': 'cryptography',
        'yaml': 'pyyaml',
        'sendgrid': 'sendgrid',
        'sklearn': 'scikit-learn',
        'pandas': 'pandas',
        'numpy': 'numpy',
        'tensorflow': 'tensorflow',
        'transformers': 'transformers',
        'torch': 'torch',
        'scipy': 'scipy',
        'pytest': 'pytest',
        'httpx': 'httpx',
        'faker': 'faker',
        'croniter': 'croniter',
        'requests': 'requests',  # Might be used but not in requirements
        'stripe': 'stripe',  # For webhook verification
    }
    
    for imp in all_imports:
        package = package_mappings.get(imp.lower(), imp.lower())
        if package not in installed and imp.lower() not in ['database', 'backend']:
            missing.append(f"{imp} -> {package}")
    
    return {
        "missing": missing,
        "total_imports": len(all_imports),
        "installed_packages": len(installed)
    }

def audit_api_routes() -> Dict[str, Any]:
    """Audit API routes for completeness."""
    main_file = Path("backend/main.py")
    
    if not main_file.exists():
        return {"error": "main.py not found"}
    
    routes = {
        "auth": [],
        "events": [],
        "patterns": [],
        "suggestions": [],
        "workflows": [],
        "integrations": [],
        "organizations": [],
        "billing": [],
        "security": [],
        "monitoring": [],
        "admin": [],
        "other": []
    }
    
    with open(main_file, 'r') as f:
        content = f.read()
        
        # Find all route definitions
        route_pattern = r'@app\.(get|post|put|delete|patch|websocket)\(["\']([^"\']+)["\']'
        matches = re.findall(route_pattern, content)
        
        for method, path in matches:
            route_info = {"method": method.upper(), "path": path}
            
            if "/auth" in path:
                routes["auth"].append(route_info)
            elif "/events" in path:
                routes["events"].append(route_info)
            elif "/patterns" in path:
                routes["patterns"].append(route_info)
            elif "/suggestions" in path:
                routes["suggestions"].append(route_info)
            elif "/workflows" in path:
                routes["workflows"].append(route_info)
            elif "/integrations" in path:
                routes["integrations"].append(route_info)
            elif "/organizations" in path:
                routes["organizations"].append(route_info)
            elif "/billing" in path:
                routes["billing"].append(route_info)
            elif "/security" in path:
                routes["security"].append(route_info)
            elif "/monitoring" in path:
                routes["monitoring"].append(route_info)
            elif "/admin" in path:
                routes["admin"].append(route_info)
            else:
                routes["other"].append(route_info)
    
    # Expected routes checklist
    expected_routes = {
        "auth": [
            "POST /api/auth/register",
            "POST /api/auth/login",
            "POST /api/auth/refresh",
            "GET /api/auth/me",
            "PUT /api/auth/profile",
            "POST /api/auth/logout",
            "POST /api/auth/forgot-password",
            "POST /api/auth/reset-password",
            "GET /api/auth/verify-email/{token}",
        ],
        "events": [
            "POST /api/events",
            "GET /api/events",
            "GET /api/events/{event_id}",
            "POST /api/events/batch",
        ],
        "workflows": [
            "POST /api/workflows",
            "GET /api/workflows",
            "GET /api/workflows/{workflow_id}",
            "PUT /api/workflows/{workflow_id}",
            "DELETE /api/workflows/{workflow_id}",
            "POST /api/workflows/{workflow_id}/execute",
        ],
        "monitoring": [
            "GET /api/v1/monitoring/metrics",
            "GET /api/v1/monitoring/cache/stats",
            "GET /api/v1/monitoring/database/pool",
        ]
    }
    
    # Check what's missing
    missing_routes = {}
    for category, expected in expected_routes.items():
        found_paths = {f"{r['method']} {r['path']}" for r in routes.get(category, [])}
        expected_set = set(expected)
        missing = expected_set - found_paths
        if missing:
            missing_routes[category] = list(missing)
    
    return {
        "total_routes": sum(len(r) for r in routes.values()),
        "routes_by_category": {k: len(v) for k, v in routes.items()},
        "missing_routes": missing_routes,
        "all_routes": routes
    }

if __name__ == "__main__":
    print("=" * 80)
    print("DEPENDENCY AND ROUTE AUDIT")
    print("=" * 80)
    
    print("\n1. DEPENDENCY AUDIT")
    print("-" * 80)
    deps = find_missing_dependencies()
    print(f"Total unique imports found: {deps['total_imports']}")
    print(f"Installed packages: {deps['installed_packages']}")
    
    if deps['missing']:
        print(f"\n⚠️  Missing dependencies ({len(deps['missing'])}):")
        for missing in deps['missing'][:20]:  # Show first 20
            print(f"  - {missing}")
        if len(deps['missing']) > 20:
            print(f"  ... and {len(deps['missing']) - 20} more")
    else:
        print("✅ All dependencies appear to be installed")
    
    print("\n2. API ROUTE AUDIT")
    print("-" * 80)
    routes = audit_api_routes()
    print(f"Total routes found: {routes['total_routes']}")
    print(f"\nRoutes by category:")
    for category, count in routes['routes_by_category'].items():
        print(f"  {category}: {count}")
    
    if routes['missing_routes']:
        print(f"\n⚠️  Missing expected routes:")
        for category, missing in routes['missing_routes'].items():
            print(f"  {category}:")
            for route in missing:
                print(f"    - {route}")
    else:
        print("\n✅ All expected routes appear to be present")
    
    print("\n" + "=" * 80)
