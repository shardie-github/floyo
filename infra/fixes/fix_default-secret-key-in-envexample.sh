#!/usr/bin/env bash
# Fix: Default SECRET_KEY in .env.example
# Issue: ISSUE-D39DC5D9
# Severity: Critical
set -euo pipefail

echo "Applying fix: Default SECRET_KEY in .env.example"

# Replace default SECRET_KEY with a placeholder that's clearly not a real key
if [ ! -f .env.example ]; then
  echo "ERROR: .env.example not found"
  exit 1
fi

# Create backup
cp .env.example .env.example.bak

# Replace the default secret key with a clear placeholder
sed -i.bak 's/SECRET_KEY=your-secret-key-change-in-production/SECRET_KEY=CHANGE_ME_GENERATE_STRONG_SECRET_KEY_MIN_32_CHARS/g' .env.example

# Add comment warning about the secret key if not present
if ! grep -q "# WARNING.*SECRET_KEY" .env.example; then
  # Add warning comment before SECRET_KEY line
  sed -i.bak2 '/^SECRET_KEY=/i# WARNING: Generate a strong random secret key for production (minimum 32 characters)\n# Use: python -c "import secrets; print(secrets.token_urlsafe(32))"' .env.example
fi

echo "✅ Updated .env.example to use placeholder SECRET_KEY with warning comment"
echo "Fix applied: Default SECRET_KEY in .env.example"
