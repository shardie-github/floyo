#!/usr/bin/env bash
set -euo pipefail
AUDIT_DIR="${AUDIT_DIR:-docs/audit}"; mkdir -p "$AUDIT_DIR"
# Heuristic: find deprecated keywords
grep -RIn "deprecated" --include=*.{ts,tsx,js,py,go,rs} . > "$AUDIT_DIR/api_deprecations.txt" || true
