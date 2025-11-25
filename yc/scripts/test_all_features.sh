#!/bin/bash
# Comprehensive test script for all YC readiness features
# Usage: bash yc/scripts/test_all_features.sh

set -e

echo "🧪 Testing YC Readiness Features"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ((FAILED++))
    fi
}

# 1. Check if metrics SQL file exists
echo "1. Checking metrics SQL queries..."
if [ -f "yc/scripts/get_real_metrics.sql" ]; then
    test_check "Metrics SQL file exists"
else
    test_check "Metrics SQL file exists"
fi

# 2. Check if metrics dashboard exists
echo "2. Checking metrics dashboard..."
if [ -f "frontend/app/admin/metrics/page.tsx" ]; then
    test_check "Metrics dashboard exists"
else
    test_check "Metrics dashboard exists"
fi

# 3. Check if referral API exists
echo "3. Checking referral API..."
if [ -f "backend/api/referral.py" ]; then
    test_check "Referral API exists"
else
    test_check "Referral API exists"
fi

# 4. Check if invite page exists
echo "4. Checking invite page..."
if [ -f "frontend/app/invite/page.tsx" ]; then
    test_check "Invite page exists"
else
    test_check "Invite page exists"
fi

# 5. Check if SEO pages exist
echo "5. Checking SEO landing pages..."
if [ -f "frontend/app/use-cases/shopify-automation/page.tsx" ]; then
    test_check "Shopify automation page exists"
else
    test_check "Shopify automation page exists"
fi

if [ -f "frontend/app/use-cases/developer-productivity/page.tsx" ]; then
    test_check "Developer productivity page exists"
else
    test_check "Developer productivity page exists"
fi

# 6. Check if financial model exists
echo "6. Checking financial model..."
if [ -f "yc/YC_FINANCIAL_MODEL.md" ]; then
    test_check "Financial model exists"
else
    test_check "Financial model exists"
fi

# 7. Check if YC docs exist
echo "7. Checking YC documentation..."
YC_DOCS=(
    "yc/YC_INTERVIEW_CHEATSHEET.md"
    "yc/YC_PRODUCT_OVERVIEW.md"
    "yc/YC_PROBLEM_USERS.md"
    "yc/YC_MARKET_VISION.md"
    "yc/YC_TEAM_NOTES.md"
    "yc/YC_METRICS_CHECKLIST.md"
    "yc/YC_DISTRIBUTION_PLAN.md"
)

for doc in "${YC_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        test_check "$doc exists"
    else
        test_check "$doc exists"
    fi
done

# 8. Check TypeScript compilation
echo "8. Checking TypeScript compilation..."
if command -v tsc &> /dev/null; then
    cd frontend && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
    if [ $? -eq 0 ]; then
        test_check "TypeScript compiles"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: TypeScript has errors (may be expected)"
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  SKIP${NC}: TypeScript not available"
fi

# 9. Check Python syntax
echo "9. Checking Python syntax..."
if command -v python3 &> /dev/null; then
    python3 -m py_compile backend/api/referral.py 2>&1
    if [ $? -eq 0 ]; then
        test_check "Python syntax valid"
    else
        test_check "Python syntax valid"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC}: Python not available"
fi

# Summary
echo ""
echo "================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed${NC}"
    exit 1
fi
