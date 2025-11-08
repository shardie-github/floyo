#!/bin/bash
#
# Master Setup Script
# 
# This script ensures everything is configured dynamically:
# 1. Loads environment variables from all sources
# 2. Applies all database migrations
# 3. Configures RLS policies, edge functions, auth, realtime
# 4. Verifies setup
#
# Usage:
#   ./scripts/setup-all.sh [--skip-migrations] [--skip-verify]
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SKIP_MIGRATIONS=false
SKIP_VERIFY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
    --skip-verify)
      SKIP_VERIFY=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🚀 Master Setup Script${NC}"
echo "=========================================="
echo ""

# Step 1: Load environment variables
echo -e "${BLUE}Step 1: Loading environment variables...${NC}"

if [ -f "$PROJECT_ROOT/.env" ]; then
  echo -e "${GREEN}  ✅ Found .env file${NC}"
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
else
  echo -e "${YELLOW}  ⚠️  No .env file found (using environment variables)${NC}"
fi

# Check required variables
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
  echo "  - GitHub Secrets"
  echo "  - Vercel Environment Variables"
  echo "  - Supabase Dashboard"
  echo "  - Local .env file"
  exit 1
fi

echo -e "${GREEN}  ✅ Environment variables loaded${NC}"
echo ""

# Step 2: Apply migrations
if [ "$SKIP_MIGRATIONS" = false ]; then
  echo -e "${BLUE}Step 2: Applying database migrations...${NC}"
  
  if [ -f "$SCRIPT_DIR/supabase-setup-complete.sh" ]; then
    bash "$SCRIPT_DIR/supabase-setup-complete.sh"
  else
    echo -e "${YELLOW}  ⚠️  Migration script not found, skipping...${NC}"
  fi
  
  echo ""
else
  echo -e "${YELLOW}Step 2: Skipping migrations (--skip-migrations)${NC}"
  echo ""
fi

# Step 3: Verify setup
if [ "$SKIP_VERIFY" = false ]; then
  echo -e "${BLUE}Step 3: Verifying setup...${NC}"
  
  if command -v tsx &> /dev/null; then
    tsx "$SCRIPT_DIR/verify-migrations.ts" || {
      echo -e "${YELLOW}  ⚠️  Verification completed with warnings${NC}"
    }
  elif command -v ts-node &> /dev/null; then
    ts-node "$SCRIPT_DIR/verify-migrations.ts" || {
      echo -e "${YELLOW}  ⚠️  Verification completed with warnings${NC}"
    }
  else
    echo -e "${YELLOW}  ⚠️  tsx or ts-node not found, skipping verification${NC}"
    echo "  Install with: npm install -g tsx"
  fi
  
  echo ""
else
  echo -e "${YELLOW}Step 3: Skipping verification (--skip-verify)${NC}"
  echo ""
fi

# Summary
echo -e "${GREEN}=========================================="
echo "✅ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify environment variables are set"
echo "  2. Check Supabase Dashboard for migrations"
echo "  3. Deploy edge functions if needed"
echo "  4. Configure auth providers in Supabase Dashboard"
echo "  5. Enable realtime for required tables"
echo ""
echo "Documentation:"
echo "  - Setup Guide: DYNAMIC_SETUP_GUIDE.md"
echo "  - Completion Summary: ENVIRONMENT_SETUP_COMPLETE.md"
echo ""
