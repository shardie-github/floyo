#!/bin/bash
# Run Seed Data and Migration
# 
# This script applies the NPS migration and generates seed data.
# Usage: bash scripts/run-seed-and-migration.sh

set -euo pipefail

echo "🌱 Floyo Seed Data & Migration Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Prisma schema
echo "📋 Step 1: Checking Prisma schema..."
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ prisma/schema.prisma not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma schema found${NC}"
echo ""

# Step 2: Generate Prisma client (if needed)
echo "📋 Step 2: Generating Prisma client..."
if command -v npx &> /dev/null; then
    echo "Running: npm run prisma:generate"
    npm run prisma:generate || {
        echo -e "${YELLOW}⚠️  Prisma generate failed. This is okay if Prisma client is already generated.${NC}"
    }
else
    echo -e "${YELLOW}⚠️  npx not found. Skipping Prisma client generation.${NC}"
fi
echo ""

# Step 3: Check Supabase migration
echo "📋 Step 3: Checking Supabase migration..."
if [ -f "supabase/migrations/99999999999999_master_consolidated_schema.sql" ]; then
    echo -e "${GREEN}✓ Master consolidated schema found${NC}"
    
    # Check if NPS table is in master schema
    if grep -q "nps_submissions" supabase/migrations/99999999999999_master_consolidated_schema.sql; then
        echo -e "${GREEN}✓ NPS table included in master schema${NC}"
    else
        echo -e "${YELLOW}⚠️  NPS table not found in master schema${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Master consolidated schema not found${NC}"
fi
echo ""

# Step 4: Apply migration (if Supabase is linked)
echo "📋 Step 4: Applying Supabase migration..."
if command -v npx &> /dev/null; then
    # Check if Supabase is linked
    if npx supabase projects list &> /dev/null; then
        echo "Applying migrations..."
        npx supabase migration up || {
            echo -e "${YELLOW}⚠️  Migration failed. This is okay if migrations are applied via CI/CD.${NC}"
            echo "   To apply manually: npx supabase migration up"
        }
    else
        echo -e "${YELLOW}⚠️  Supabase not linked. Migration will be applied via CI/CD.${NC}"
        echo "   To apply manually:"
        echo "   1. npx supabase link --project-ref <your-ref>"
        echo "   2. npx supabase migration up"
    fi
else
    echo -e "${YELLOW}⚠️  npx not found. Skipping migration.${NC}"
fi
echo ""

# Step 5: Generate seed data
echo "📋 Step 5: Generating seed data..."
echo ""

if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set.${NC}"
    echo "   Set DATABASE_URL environment variable to generate seed data."
    echo "   Example: export DATABASE_URL='postgresql://...'"
    echo ""
    echo "   Or run seed script manually:"
    echo "   npm run seed:production"
    exit 0
fi

echo "Running seed data generation..."
npm run seed:production || {
    echo -e "${YELLOW}⚠️  Seed data generation failed.${NC}"
    echo "   This is okay if you want to generate seed data manually."
    echo "   Run: npm run seed:production"
    exit 0
}

echo ""
echo -e "${GREEN}✅ Seed data and migration complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify data in Prisma Studio: npm run prisma:studio"
echo "  2. Check NPS dashboard: /admin/nps"
echo "  3. Check revenue dashboard: /admin/revenue"
echo ""
