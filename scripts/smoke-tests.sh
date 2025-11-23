#!/bin/bash
# Smoke Tests for Floyo
# Quick validation that critical systems are working

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="${BASE_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "🧪 Running Floyo Smoke Tests"
echo "=============================="
echo ""

FAILED=0
PASSED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" -eq "$expected_status" ]; then
            echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
            PASSED=$((PASSED + 1))
            return 0
        else
            echo -e "${RED}❌ FAIL${NC} (Expected HTTP $expected_status, got $http_code)"
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (Connection error)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Backend Health Checks
echo "Backend Health Checks"
echo "---------------------"
test_endpoint "Backend Health" "$BASE_URL/health"
test_endpoint "Backend Readiness" "$BASE_URL/health/readiness"
test_endpoint "Backend Liveness" "$BASE_URL/health/liveness"

# Frontend Health Checks
echo ""
echo "Frontend Health Checks"
echo "----------------------"
test_endpoint "Frontend Health" "$FRONTEND_URL/api/health"

# Database Connectivity (via health check)
echo ""
echo "Database Checks"
echo "---------------"
if curl -s "$BASE_URL/health/readiness" | grep -q '"database".*"ok"'; then
    echo -e "Database connectivity... ${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "Database connectivity... ${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

# Environment Validation
echo ""
echo "Environment Checks"
echo "------------------"
if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo -e "Environment file exists... ${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "Environment file exists... ${YELLOW}⚠️  WARN${NC} (.env.local not found)"
fi

# Summary
echo ""
echo "=============================="
echo "Test Summary"
echo "=============================="
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}Failed: 0${NC}"
    echo ""
    echo "✅ All smoke tests passed!"
    exit 0
fi
