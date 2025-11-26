#!/bin/bash
# Comprehensive script to fetch metrics and update all documentation
# 
# Usage:
#   bash scripts/update-all-metrics.sh
#
# Requirements:
#   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
#   - Node.js and tsx installed

set -e

echo "🚀 Floyo Metrics Update Script"
echo "================================"
echo ""

# Check environment variables
if [ -z "$SUPABASE_URL" ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not set"
    echo ""
    echo "Set environment variables:"
    echo "  export SUPABASE_URL=https://your-project.supabase.co"
    echo "  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set"
    echo ""
    echo "Get your service role key from:"
    echo "  https://supabase.com/dashboard/project/[your-project]/settings/api"
    echo ""
    exit 1
fi

echo "✅ Environment variables set"
echo ""

# Run metrics fetch script
echo "📊 Fetching metrics from database..."
tsx scripts/fetch-metrics-and-update-docs.ts

echo ""
echo "✅ Metrics update complete!"
echo ""
echo "📝 Updated files:"
echo "   - yc/YC_PRODUCT_OVERVIEW.md"
echo "   - yc/YC_INTERVIEW_CHEATSHEET.md"
echo "   - yc/YC_METRICS_CHECKLIST.md"
echo "   - dataroom/03_METRICS_OVERVIEW.md"
echo "   - dataroom/04_CUSTOMER_PROOF.md"
echo ""
echo "🔍 Next steps:"
echo "   1. Review updated files"
echo "   2. Fill in any remaining TODOs"
echo "   3. Add testimonials or case studies if available"
echo ""
