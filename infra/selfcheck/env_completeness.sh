#!/usr/bin/env bash
set -euo pipefail
AUDIT_DIR="${AUDIT_DIR:-docs/audit}"
mkdir -p "$AUDIT_DIR"
EXAMPLE="$(ls .env*.example 2>/dev/null | head -n1 || true)"
TARGETS=(".env" ".env.local")
echo "## Env Completeness Report" > "$AUDIT_DIR/env_completeness.md"
if [ -z "$EXAMPLE" ]; then echo "No .env.example found" >> "$AUDIT_DIR/env_completeness.md"; exit 0; fi
KEYS=$(grep -o '^[A-Za-z0-9_]\+=' "$EXAMPLE" | sed 's/=//')
for T in "${TARGETS[@]}"; do
  echo "### Check: $T" >> "$AUDIT_DIR/env_completeness.md"
  if [ ! -f "$T" ]; then echo "- missing file" >> "$AUDIT_DIR/env_completeness.md"; continue; fi
  MISSING=()
  while read -r K; do grep -q "^$K=" "$T" || MISSING+=("$K"); done <<< "$KEYS"
  if [ "${#MISSING[@]}" -gt 0 ]; then
    echo "- missing keys: ${MISSING[*]}" >> "$AUDIT_DIR/env_completeness.md"; exit 1
  else echo "- complete"; fi
done
echo "Env completeness OK."
