#!/bin/bash
# [CRUX+HARDEN] Migration helper for concurrent index creation
# Detects transaction wrapping and splits migrations if needed

set -e

MIGRATION_FILE="${1:-supabase/migrations/20251105_crux_hardening.sql}"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "Analyzing migration: $MIGRATION_FILE"

# Check if migration contains CONCURRENTLY
if grep -q "CREATE INDEX CONCURRENTLY" "$MIGRATION_FILE"; then
  echo "⚠️  Found CONCURRENTLY indexes"
  
  # Check if wrapped in transaction
  if grep -q "^BEGIN\|^BEGIN TRANSACTION" "$MIGRATION_FILE"; then
    echo "❌ Migration appears to be wrapped in transaction"
    echo "⚠️  CONCURRENTLY indexes cannot run inside transactions"
    echo ""
    echo "Options:"
    echo "1. Split indexes into separate migration files"
    echo "2. Run indexes manually via CLI:"
    echo ""
    
    # Extract index statements
    grep "CREATE INDEX CONCURRENTLY" "$MIGRATION_FILE" | while read -r line; do
      echo "   supabase db execute --sql \"$line\""
    done
    
    echo ""
    echo "3. Use Supabase CLI without transaction wrapper"
    exit 1
  else
    echo "✅ No transaction wrapper detected"
    echo "Migration should run safely"
  fi
else
  echo "✅ No CONCURRENTLY indexes found"
fi

echo ""
echo "Migration analysis complete"
