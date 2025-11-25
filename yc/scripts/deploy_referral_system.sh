#!/bin/bash
# Deploy referral system migration
# Usage: bash yc/scripts/deploy_referral_system.sh

set -e

echo "🚀 Deploying Referral System"
echo "============================="
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "Install it: npm install -g supabase"
    exit 1
fi

# Check if migration file exists
MIGRATION_FILE="supabase/migrations/20250121000000_referral_system.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file found: $MIGRATION_FILE"
echo ""

# Option 1: Apply via Supabase CLI
if [ -n "$SUPABASE_PROJECT_REF" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "Applying migration via Supabase CLI..."
    supabase db push --project-ref "$SUPABASE_PROJECT_REF" --db-url "$DATABASE_URL" || {
        echo "⚠️  Direct push failed, trying link method..."
        supabase link --project-ref "$SUPABASE_PROJECT_REF"
        supabase db push
    }
    echo "✅ Migration applied successfully"
else
    echo "⚠️  Supabase credentials not set"
    echo "To apply migration manually:"
    echo "1. Go to Supabase Dashboard > SQL Editor"
    echo "2. Copy contents of $MIGRATION_FILE"
    echo "3. Paste and run in SQL Editor"
    echo ""
    echo "Or set environment variables:"
    echo "  export SUPABASE_PROJECT_REF=your-project-ref"
    echo "  export SUPABASE_ACCESS_TOKEN=your-access-token"
    echo "  export DATABASE_URL=your-database-url"
fi

echo ""
echo "✅ Referral system deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test referral API: curl http://localhost:8000/api/referral/code"
echo "2. Visit invite page: http://localhost:3000/invite"
echo "3. Test referral code usage"
