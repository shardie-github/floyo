#!/usr/bin/env python3
"""
Run all guardrails defined in guardrails.yaml.
Returns exit code 0 if all pass, 1 if any fail.
"""
import sys
import yaml
import subprocess
from pathlib import Path

def load_guardrails():
    """Load guardrails from YAML file."""
    guardrails_file = Path(__file__).parent / "guardrails.yaml"
    with open(guardrails_file, 'r') as f:
        return yaml.safe_load(f)

def run_check(check_def, category, name):
    """Run a single guardrail check."""
    check_cmd = check_def.get('check', '')
    description = check_def.get('description', name)
    severity = check_def.get('severity', 'medium')
    
    if not check_cmd:
        print(f"SKIP: {category}.{name} - No check defined")
        return True
    
    # Skip if status is pending_implementation
    if check_def.get('status') == 'pending_implementation':
        print(f"SKIP: {category}.{name} - Pending implementation")
        return True
    
    try:
        # Run the check command
        result = subprocess.run(
            check_cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent,
            timeout=60
        )
        
        if result.returncode == 0:
            print(f"✓ PASS: {category}.{name} - {description}")
            return True
        else:
            if severity == 'critical':
                print(f"✗ FAIL: {category}.{name} - {description}", file=sys.stderr)
                print(f"  Command: {check_cmd}", file=sys.stderr)
                if result.stderr:
                    print(f"  Error: {result.stderr[:200]}", file=sys.stderr)
                return False
            else:
                print(f"⚠ WARN: {category}.{name} - {description}", file=sys.stderr)
                if result.stderr:
                    print(f"  Warning: {result.stderr[:200]}", file=sys.stderr)
                return True  # Non-critical warnings don't fail
    
    except subprocess.TimeoutExpired:
        print(f"✗ TIMEOUT: {category}.{name} - Check timed out", file=sys.stderr)
        return severity != 'critical'
    except Exception as e:
        print(f"✗ ERROR: {category}.{name} - {e}", file=sys.stderr)
        return severity != 'critical'

def main():
    """Main entry point."""
    guardrails = load_guardrails()
    
    failures = []
    warnings = []
    
    # Run all guardrails
    for category, checks in guardrails.items():
        if category == 'metadata':
            continue
        
        if not isinstance(checks, dict):
            continue
        
        for name, check_def in checks.items():
            if not isinstance(check_def, dict):
                continue
            
            passed = run_check(check_def, category, name)
            if not passed:
                failures.append(f"{category}.{name}")
    
    # Summary
    print("\n" + "="*60)
    print("Guardrails Summary")
    print("="*60)
    
    if failures:
        print(f"\n✗ FAILED: {len(failures)} critical guardrail(s) failed")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    else:
        print("\n✓ All guardrails passed")
        return 0

if __name__ == "__main__":
    sys.exit(main())
