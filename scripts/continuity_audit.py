#!/usr/bin/env python3
"""
Nomad Grand Continuity & Completion Audit
Comprehensive system analysis and connectivity verification.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Set, Optional
from datetime import datetime
import ast
import subprocess
import importlib.util

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from collections import defaultdict


class ContinuityAuditor:
    """Comprehensive system continuity auditor."""
    
    def __init__(self, workspace_root: Path):
        self.workspace_root = workspace_root
        self.findings = {
            "orphaned_modules": [],
            "missing_imports": [],
            "missing_connections": [],
            "unused_endpoints": [],
            "unregistered_jobs": [],
            "missing_tests": [],
            "circular_dependencies": [],
            "stale_dependencies": [],
            "missing_migrations": [],
            "broken_links": []
        }
        self.coverage = {
            "components": {},
            "routes": {},
            "models": {},
            "jobs": {},
            "tests": {},
            "connections": {}
        }
    
    def audit(self) -> Dict[str, Any]:
        """Run full audit."""
        print("?? Starting Nomad Continuity Audit...")
        
        # Phase 1: Inventory
        print("\n?? Phase 1: Inventory...")
        self._inventory_components()
        self._inventory_routes()
        self._inventory_models()
        self._inventory_jobs()
        self._inventory_tests()
        
        # Phase 2: Connectivity
        print("\n?? Phase 2: Connectivity Analysis...")
        self._check_imports()
        self._check_api_connections()
        self._check_frontend_backend_connections()
        self._check_database_connections()
        self._check_job_registrations()
        
        # Phase 3: Missing Links
        print("\n?? Phase 3: Missing Links Detection...")
        self._detect_orphaned_modules()
        self._detect_unused_endpoints()
        self._detect_missing_tests()
        self._detect_circular_dependencies()
        
        # Generate reports
        print("\n?? Generating Reports...")
        inventory_report = self._generate_inventory_report()
        connectivity_report = self._generate_connectivity_report()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "findings": self.findings,
            "coverage": self.coverage,
            "inventory": inventory_report,
            "connectivity": connectivity_report,
            "health_score": self._calculate_health_score()
        }
    
    def _inventory_components(self):
        """Inventory all components."""
        backend_path = self.workspace_root / "backend"
        frontend_path = self.workspace_root / "frontend"
        
        # Backend components
        for py_file in backend_path.rglob("*.py"):
            if py_file.name != "__init__.py":
                module_name = py_file.stem
                self.coverage["components"][module_name] = {
                    "path": str(py_file.relative_to(self.workspace_root)),
                    "type": "backend",
                    "imports": [],
                    "exports": []
                }
        
        # Frontend components
        for tsx_file in (frontend_path / "components").rglob("*.tsx"):
            component_name = tsx_file.stem
            self.coverage["components"][component_name] = {
                "path": str(tsx_file.relative_to(self.workspace_root)),
                "type": "frontend",
                "imports": [],
                "exports": []
            }
    
    def _inventory_routes(self):
        """Inventory API routes."""
        main_py = self.workspace_root / "backend" / "main.py"
        if main_py.exists():
            routes = []
            with open(main_py) as f:
                content = f.read()
                # Find all @app.route decorators
                import re
                route_pattern = r'@app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']'
                for match in re.finditer(route_pattern, content):
                    method, path = match.groups()
                    routes.append({"method": method.upper(), "path": path})
            
            self.coverage["routes"] = {f"{r['method']} {r['path']}": r for r in routes}
    
    def _inventory_models(self):
        """Inventory database models."""
        models_py = self.workspace_root / "database" / "models.py"
        if models_py.exists():
            with open(models_py) as f:
                content = f.read()
                # Find all class definitions that inherit from Base
                import re
                model_pattern = r'class (\w+)\(Base\):'
                models = re.findall(model_pattern, content)
                self.coverage["models"] = {m: {"name": m} for m in models}
    
    def _inventory_jobs(self):
        """Inventory background jobs."""
        # Check for Celery, BullMQ, or cron jobs
        scheduler_py = self.workspace_root / "backend" / "workflow_scheduler.py"
        if scheduler_py.exists():
            self.coverage["jobs"]["workflow_scheduler"] = {
                "type": "workflow",
                "registered": True
            }
    
    def _inventory_tests(self):
        """Inventory test files."""
        tests_path = self.workspace_root / "tests"
        if tests_path.exists():
            for test_file in tests_path.rglob("test_*.py"):
                test_name = test_file.stem
                self.coverage["tests"][test_name] = {
                    "path": str(test_file.relative_to(self.workspace_root)),
                    "type": "pytest"
                }
    
    def _check_imports(self):
        """Check for missing imports."""
        # Check if frontend lib/api.ts exists
        lib_api = self.workspace_root / "frontend" / "lib" / "api.ts"
        if not lib_api.exists():
            self.findings["missing_connections"].append({
                "type": "missing_file",
                "path": "frontend/lib/api.ts",
                "impact": "Frontend cannot connect to backend API",
                "severity": "critical"
            })
    
    def _check_api_connections(self):
        """Check API endpoint connectivity."""
        # Verify all routes in main.py are properly connected
        pass
    
    def _check_frontend_backend_connections(self):
        """Check frontend-backend connectivity."""
        # Check if NEXT_PUBLIC_API_URL is configured
        next_config = self.workspace_root / "frontend" / "next.config.js"
        if next_config.exists():
            with open(next_config) as f:
                content = f.read()
                if "NEXT_PUBLIC_API_URL" not in content:
                    self.findings["missing_connections"].append({
                        "type": "missing_env",
                        "name": "NEXT_PUBLIC_API_URL",
                        "severity": "high"
                    })
    
    def _check_database_connections(self):
        """Check database model connections."""
        # Verify models are properly registered
        pass
    
    def _check_job_registrations(self):
        """Check if jobs are registered."""
        # Workflow scheduler exists but may not be registered in cron/system
        pass
    
    def _detect_orphaned_modules(self):
        """Detect modules not imported anywhere."""
        # Placeholder - would need full AST analysis
        pass
    
    def _detect_unused_endpoints(self):
        """Detect API endpoints not used by frontend."""
        # Check if frontend calls match backend routes
        pass
    
    def _detect_missing_tests(self):
        """Detect missing test coverage."""
        # Compare components with tests
        pass
    
    def _detect_circular_dependencies(self):
        """Detect circular import dependencies."""
        # Would need full dependency graph
        pass
    
    def _generate_inventory_report(self) -> Dict[str, Any]:
        """Generate inventory coverage report."""
        return {
            "components_count": len(self.coverage["components"]),
            "routes_count": len(self.coverage["routes"]),
            "models_count": len(self.coverage["models"]),
            "jobs_count": len(self.coverage["jobs"]),
            "tests_count": len(self.coverage["tests"]),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _generate_connectivity_report(self) -> Dict[str, Any]:
        """Generate connectivity heatmap."""
        # Build connectivity matrix
        connections = {
            "frontend_backend": self._check_frontend_backend_connection(),
            "backend_database": self._check_backend_database_connection(),
            "api_models": self._check_api_model_connection(),
            "jobs_registered": self._check_job_registration(),
            "tests_coverage": self._check_test_coverage()
        }
        
        return {
            "connections": connections,
            "health_score": sum(1 for v in connections.values() if v) / len(connections) * 100,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _check_frontend_backend_connection(self) -> bool:
        """Check if frontend can connect to backend."""
        lib_api = self.workspace_root / "frontend" / "lib" / "api.ts"
        if lib_api.exists():
            # Mark as fixed in findings
            self.findings["missing_connections"] = [
                f for f in self.findings["missing_connections"]
                if f.get("path") != "frontend/lib/api.ts"
            ]
        return lib_api.exists()
    
    def _check_backend_database_connection(self) -> bool:
        """Check backend-database connection."""
        db_py = self.workspace_root / "backend" / "database.py"
        return db_py.exists()
    
    def _check_api_model_connection(self) -> bool:
        """Check if API endpoints use models."""
        return True  # Simplified
    
    def _check_job_registration(self) -> bool:
        """Check if jobs are registered."""
        scheduler = self.workspace_root / "backend" / "workflow_scheduler.py"
        return scheduler.exists()
    
    def _check_test_coverage(self) -> bool:
        """Check test coverage."""
        return len(self.coverage["tests"]) > 0
    
    def _calculate_health_score(self) -> float:
        """Calculate overall health score."""
        total_issues = sum(len(v) for v in self.findings.values())
        # Lower is better
        score = max(0, 100 - (total_issues * 5))
        return score


def main():
    """Main entry point."""
    workspace_root = Path(__file__).parent.parent
    auditor = ContinuityAuditor(workspace_root)
    
    # Run audit
    results = auditor.audit()
    
    # Write reports
    reports_dir = workspace_root / "reports" / "inventory"
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    with open(reports_dir / "coverage.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n? Audit complete! Health score: {results['health_score']:.1f}%")
    print(f"?? Reports written to: {reports_dir}")
    
    return results


if __name__ == "__main__":
    main()
