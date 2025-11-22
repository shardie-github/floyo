#!/bin/bash
# Run load tests for activation flow
# Usage: ./scripts/run-load-tests.sh

set -e

echo "🚀 Running load tests for activation flow..."

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed. Install it from https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Set base URL (default to localhost)
BASE_URL=${BASE_URL:-"http://localhost:8000"}

echo "📊 Testing against: $BASE_URL"
echo ""

# Run load test
k6 run \
  --env BASE_URL="$BASE_URL" \
  k6/load-test-activation.js

echo ""
echo "✅ Load tests completed!"
echo "📄 Results saved to load-test-results.json"
