#!/bin/bash
# Complete setup script for YC readiness
# Usage: bash yc/scripts/setup_complete.sh

set -e

echo "🎯 YC Readiness Complete Setup"
echo "==============================="
echo ""

# Make scripts executable
chmod +x yc/scripts/*.sh
chmod +x yc/scripts/*.ts 2>/dev/null || true

echo "✅ Made all scripts executable"
echo ""

# Run all automation scripts
echo "Running automation scripts..."
bash yc/scripts/run_all_next_steps.sh

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Review /yc/ folder for generated files"
echo "2. Fill in team information: /yc/YC_TEAM_NOTES.md"
echo "3. Update financial model: /yc/FINANCIAL_MODEL.md"
echo "4. Test metrics dashboard: Visit /admin/metrics"
echo "5. Deploy referral system: bash yc/scripts/deploy_referral_system.sh"
