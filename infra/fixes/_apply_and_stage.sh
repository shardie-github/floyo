#!/usr/bin/env bash
# Applies a single fix script and stages changed files for commit.
# Usage: _apply_and_stage.sh path/to/fix_script.sh
set -euo pipefail
FIX="$1"
echo "==> Running fix: $FIX"
chmod +x "$FIX"
# Each fix script must be idempotent and non-destructive.
"$FIX"
# Stage any changes produced by the fix.
git add -A
