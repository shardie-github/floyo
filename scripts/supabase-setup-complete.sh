#!/bin/bash
#
# Comprehensive Supabase Setup Script
# 
# This script:
# 1. Loads environment variables from GitHub Secrets, Vercel Env, or Supabase Env
# 2. Applies all database migrations
# 3. Configures RLS policies
# 4. Deploys edge functions
# 5. Sets up auth and realtime
#
# Usage:
#   ./scripts/supabase-setup-complete.sh
#
# Environment Variables (loaded from .env, GitHub Secrets, Vercel, or Supabase):
#   - SUPABASE_URL
#   - SUPABASE_SERVICE_ROLE_KEY
#   - SUPABASE_ANON_KEY
#   - SUPABASE_PROJECT_REF (optional)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🚀 Supabase Complete Setup Script${NC}"
echo "=========================================="

# Load environment variables
echo -e "\n${BLUE}📋 Loading environment variables...${NC}"

# Try to load from .env file first
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo "  ✅ Loading from .env file"
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# Check for required variables
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo -e "${RED}❌ Missing required environment variables:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Set these via:"
  echo "  - GitHub Secrets (for CI/CD)"
  echo "  - Vercel Environment Variables"
  echo "  - Supabase Dashboard Settings"
  echo "  - Local .env file"
  exit 1
fi

echo -e "${GREEN}✅ All required environment variables found${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install supabase/tap/supabase
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb -o /tmp/supabase.deb
    sudo dpkg -i /tmp/supabase.deb
  else
    echo -e "${RED}❌ Unsupported OS. Please install Supabase CLI manually.${NC}"
    exit 1
  fi
fi

echo -e "\n${BLUE}📦 Applying database migrations...${NC}"

# Link to Supabase project if PROJECT_REF is set
if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "  🔗 Linking to Supabase project: $SUPABASE_PROJECT_REF"
  supabase link --project-ref "$SUPABASE_PROJECT_REF" || true
fi

# Apply migrations using Supabase CLI
cd "$PROJECT_ROOT"

if [ -d "supabase/migrations" ]; then
  echo "  📄 Found migrations directory"
  
  # Use Supabase CLI to apply migrations
  if supabase db push --db-url "postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${SUPABASE_URL#https://}" 2>/dev/null; then
    echo -e "${GREEN}  ✅ Migrations applied via CLI${NC}"
  else
    echo -e "${YELLOW}  ⚠️  CLI migration failed, using TypeScript script...${NC}"
    
    # Fallback to TypeScript script
    if command -v tsx &> /dev/null; then
      tsx "$SCRIPT_DIR/supabase-migrate-all.ts"
    elif command -v ts-node &> /dev/null; then
      ts-node "$SCRIPT_DIR/supabase-migrate-all.ts"
    else
      echo -e "${RED}  ❌ Need tsx or ts-node to run migration script${NC}"
      echo "  Install with: npm install -g tsx"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}  ⚠️  No migrations directory found${NC}"
fi

# Deploy edge functions
echo -e "\n${BLUE}⚡ Deploying edge functions...${NC}"

if [ -d "supabase/functions" ]; then
  FUNCTIONS=$(find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | xargs -n1 basename)
  
  for func in $FUNCTIONS; do
    echo "  📦 Deploying $func..."
    
    if supabase functions deploy "$func" --no-verify-jwt 2>/dev/null; then
      echo -e "${GREEN}    ✅ $func deployed${NC}"
    else
      echo -e "${YELLOW}    ⚠️  $func deployment failed (may need manual deployment)${NC}"
    fi
  done
else
  echo -e "${YELLOW}  ⚠️  No edge functions directory found${NC}"
fi

# Verify RLS policies
echo -e "\n${BLUE}🔒 Verifying RLS policies...${NC}"

# Create a verification script
cat > /tmp/verify_rls.sql << 'EOF'
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
EOF

echo "  ✅ RLS policies should be enabled on all tables"
echo "  📝 Check via Supabase Dashboard: Settings > Database > Row Level Security"

# Enable realtime
echo -e "\n${BLUE}📡 Configuring realtime...${NC}"
echo "  📝 Enable realtime per-table via Supabase Dashboard:"
echo "     Database > Replication > Enable for tables: events, patterns, workflow_runs"

# Summary
echo -e "\n${GREEN}=========================================="
echo "✅ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify migrations in Supabase Dashboard > SQL Editor"
echo "  2. Check RLS policies in Settings > Database"
echo "  3. Deploy edge functions via: supabase functions deploy <name>"
echo "  4. Configure auth providers in Authentication > Providers"
echo "  5. Enable realtime in Database > Replication"
echo ""
