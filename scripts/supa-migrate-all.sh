#!/bin/sh
# Supabase Migration Helper Script
# Applies all pending migrations via Supabase CLI
#
# Usage:
#   ./scripts/supa-migrate-all.sh
#
# Environment Variables:
#   SUPABASE_PROJECT_REF - Your Supabase project reference ID
#   SUPABASE_ACCESS_TOKEN - Your Supabase access token (for supabase login)
#
# Prerequisites:
#   1. Supabase CLI installed: https://supabase.com/docs/guides/cli
#   2. Run 'supabase login' once to store your access token
#   3. Set SUPABASE_PROJECT_REF environment variable or update DEFAULT_PROJECT_REF below
#
# This script is Termux-friendly (POSIX-compliant shell script)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default project ref (TODO: Update with your project ref if not using env var)
DEFAULT_PROJECT_REF=""

# Get project ref from environment or use default
PROJECT_REF="${SUPABASE_PROJECT_REF:-${DEFAULT_PROJECT_REF}}"

# Check if Supabase CLI is installed
if ! command -v supabase >/dev/null 2>&1; then
    echo "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if project ref is set
if [ -z "$PROJECT_REF" ]; then
    echo "${YELLOW}Warning: SUPABASE_PROJECT_REF not set${NC}"
    echo "Please set SUPABASE_PROJECT_REF environment variable:"
    echo "  export SUPABASE_PROJECT_REF=your-project-ref"
    echo ""
    echo "Or update DEFAULT_PROJECT_REF in this script"
    exit 1
fi

echo "${GREEN}🚀 Starting Supabase Migration${NC}"
echo "Project Ref: ${PROJECT_REF}"
echo ""

# Ensure we're in the repo root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
    echo "${RED}Error: supabase/migrations directory not found${NC}"
    exit 1
fi

# Check if master migration exists
if [ ! -f "supabase/migrations/99999999999999_master_consolidated_schema.sql" ]; then
    echo "${YELLOW}Warning: Master migration file not found${NC}"
    echo "Expected: supabase/migrations/99999999999999_master_consolidated_schema.sql"
fi

# Link to Supabase project (idempotent - safe to run multiple times)
echo "${GREEN}📎 Linking to Supabase project...${NC}"
if supabase link --project-ref "$PROJECT_REF" 2>/dev/null; then
    echo "${GREEN}✅ Project linked${NC}"
else
    # Check if already linked
    if supabase projects list 2>/dev/null | grep -q "$PROJECT_REF"; then
        echo "${GREEN}✅ Project already linked${NC}"
    else
        echo "${RED}Error: Failed to link project${NC}"
        echo "Make sure you've run 'supabase login' first"
        exit 1
    fi
fi

echo ""

# Apply migrations
echo "${GREEN}📦 Applying migrations...${NC}"
if supabase migration up; then
    echo ""
    echo "${GREEN}✅ Migrations applied successfully!${NC}"
    exit 0
else
    echo ""
    echo "${RED}❌ Migration failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi
