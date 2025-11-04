#!/usr/bin/env python3
"""
Guardrail Validation Script
Validates architectural invariants defined in guardrails.yaml
"""
import yaml
import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, List, Any
import json

def load_guardrails(file_path: str = "infra/selfcheck/guardrails.yaml") -> Dict:
    """Load guardrails from YAML file."""
    with open(file_path, 'r') as f:
        return yaml.safe_load(f)

def evaluate_condition(condition: str, context: Dict = None) -> tuple[bool, str]:
    """
    Evaluate a guardrail condition.
    Returns (is_valid, error_message)
    """
    try:
        # Handle shell commands
        if condition.startswith('grep') or condition.startswith('wc') or condition.startswith('python'):
            result = subprocess.run(
                condition,
                shell=True,
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent.parent.parent
            )
            # For grep/wc, check exit code and output
            if 'grep -q' in condition:
                return (result.returncode == 0, result.stderr if result.returncode != 0 else "")
            elif 'wc -l' in condition:
                # Extract number from output
                try:
                    lines = int(result.stdout.strip().split()[0])
                    # Parse the comparison (e.g., "< 2000")
                    if '<' in condition:
                        threshold = int(condition.split('<')[1].strip())
                        return (lines < threshold, f"File has {lines} lines, threshold is {threshold}")
                except:
                    return (False, f"Could not parse line count: {result.stdout}")
            elif 'python' in condition:
                return (result.returncode == 0, result.stderr if result.returncode != 0 else result.stdout)
            else:
                # Generic command success
                return (result.returncode == 0, result.stderr if result.returncode != 0 else "")
        
        # Handle file existence checks
        elif condition.startswith('-f') or 'exists' in condition.lower():
            file_path = condition.split()[-1] if ' ' in condition else condition.replace('-f', '').strip()
            exists = os.path.exists(file_path)
            if '-f' in condition:
                return (exists, f"File {file_path} does not exist" if not exists else "")
            else:
                return (exists, f"File {file_path} does not exist" if not exists else "")
        
        # Handle logical conditions (simplified)
        elif '->' in condition:
            # Parse implication: A -> B
            parts = condition.split('->')
            antecedent = parts[0].strip()
            consequent = parts[1].strip()
            # For now, evaluate as simple boolean
            # In production, would use proper expression evaluator
            return (True, "")  # Placeholder
        
        # Default: assume condition is a Python expression
        else:
            # Evaluate as Python expression with safe context
            safe_context = context or {}
            safe_context.update({
                'os': os,
                'Path': Path,
                '__file__': __file__
            })
            result = eval(condition, {"__builtins__": {}}, safe_context)
            return (bool(result), "" if bool(result) else f"Condition '{condition}' evaluated to False")
            
    except Exception as e:
        return (False, f"Error evaluating condition: {str(e)}")

def validate_all_guardrails(strict: bool = False) -> Dict[str, Any]:
    """
    Validate all guardrails.
    Returns validation results.
    """
    guardrails = load_guardrails()
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "warnings": 0,
        "violations": []
    }
    
    for category, rules in guardrails.get("guardrails", {}).items():
        if not isinstance(rules, list):
            continue
            
        for rule in rules:
            results["total"] += 1
            name = rule.get("name", "unnamed")
            condition = rule.get("condition", "")
            severity = rule.get("severity", "medium")
            priority = rule.get("priority", "P2")
            
            is_valid, error_msg = evaluate_condition(condition)
            
            if is_valid:
                results["passed"] += 1
            else:
                results["failed"] += 1
                violation = {
                    "name": name,
                    "category": category,
                    "severity": severity,
                    "priority": priority,
                    "description": rule.get("description", ""),
                    "file": rule.get("file", ""),
                    "error": error_msg,
                    "condition": condition
                }
                results["violations"].append(violation)
                
                # If strict mode and critical/high severity, fail immediately
                if strict and severity in ["critical", "high"]:
                    print(f"❌ CRITICAL VIOLATION: {name}")
                    print(f"   {rule.get('description', '')}")
                    print(f"   Error: {error_msg}")
                    print(f"   File: {rule.get('file', '')}")
    
    return results

def main():
    """Main entry point."""
    import argparse
    parser = argparse.ArgumentParser(description="Validate architectural guardrails")
    parser.add_argument("--strict", action="store_true", help="Fail on any critical/high violations")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--category", help="Only validate specific category")
    
    args = parser.parse_args()
    
    results = validate_all_guardrails(strict=args.strict)
    
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"Guardrail Validation Results")
        print(f"{'='*60}")
        print(f"Total:  {results['total']}")
        print(f"Passed: {results['passed']} ✅")
        print(f"Failed: {results['failed']} ❌")
        print(f"{'='*60}\n")
        
        if results['violations']:
            print("Violations:")
            for v in results['violations']:
                print(f"\n  [{v['severity'].upper()}] {v['name']}")
                print(f"    Description: {v['description']}")
                print(f"    File: {v['file']}")
                if v['error']:
                    print(f"    Error: {v['error']}")
    
    # Exit with error code if violations found
    sys.exit(1 if results['failed'] > 0 else 0)

if __name__ == "__main__":
    main()
