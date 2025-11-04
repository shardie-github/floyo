#!/usr/bin/env bash
# Fix: Unpinned dependencies in requirements.txt
# Issue: varies
# Severity: Minor
set -euo pipefail

echo "Applying fix: Unpinned dependencies in requirements.txt"

if [ ! -f backend/requirements.txt ]; then
  echo "ERROR: backend/requirements.txt not found"
  exit 1
fi

# Create backup
cp backend/requirements.txt backend/requirements.txt.bak

# Add comment header about pinning strategy
if ! grep -q "# Pinning Strategy" backend/requirements.txt; then
  cat > backend/requirements.txt.new <<EOF
# Pinning Strategy
# For production, pin exact versions: package==1.2.3
# For development, use minimum versions: package>=1.2.3
# Update this file when dependencies change and test thoroughly

EOF
  cat backend/requirements.txt >> backend/requirements.txt.new
  mv backend/requirements.txt.new backend/requirements.txt
fi

echo "✅ Added pinning strategy comment to requirements.txt"
echo "⚠️  Note: Manual review required to pin specific versions"
echo "Fix applied: Unpinned dependencies in requirements.txt"
