#!/usr/bin/env bash
set -euo pipefail
AUDIT_DIR="${AUDIT_DIR:-docs/audit}"; mkdir -p "$AUDIT_DIR"
echo "## CI Health" > "$AUDIT_DIR/ci_health.md"
if [ -f .github/workflows/project-governance.yml ]; then echo "- governance workflow present" >> "$AUDIT_DIR/ci_health.md"; else echo "- governance workflow missing" >> "$AUDIT_DIR/ci_health.md"; fi
if [ -f package.json ] && jq -e '.scripts.test' package.json >/dev/null 2>&1; then echo "- test script present" >> "$AUDIT_DIR/ci_health.md"; else echo "- test script missing" >> "$AUDIT_DIR/ci_health.md"; fi
