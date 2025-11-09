#!/usr/bin/env python3
"""Test integrations without external dependencies."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    
    try:
        from backend.analytics_dashboard import AnalyticsDashboard
        print("✅ AnalyticsDashboard imported")
    except Exception as e:
        print(f"❌ AnalyticsDashboard import failed: {e}")
        return False
    
    try:
        from backend.stripe_integration import StripeIntegration
        print("✅ StripeIntegration imported")
    except Exception as e:
        print(f"❌ StripeIntegration import failed: {e}")
        return False
    
    try:
        from backend.retention_campaigns import RetentionCampaignService
        print("✅ RetentionCampaignService imported")
    except Exception as e:
        print(f"❌ RetentionCampaignService import failed: {e}")
        return False
    
    try:
        from backend.usage_limit_middleware import UsageLimitMiddleware
        print("✅ UsageLimitMiddleware imported")
    except Exception as e:
        print(f"❌ UsageLimitMiddleware import failed: {e}")
        return False
    
    try:
        from backend.retention_campaign_job import run_retention_campaigns
        print("✅ RetentionCampaignJob imported")
    except Exception as e:
        print(f"❌ RetentionCampaignJob import failed: {e}")
        return False
    
    return True


def test_analytics_methods():
    """Test analytics dashboard methods exist."""
    print("\nTesting analytics methods...")
    
    from backend.analytics_dashboard import AnalyticsDashboard
    
    methods = [
        "get_activation_metrics",
        "get_retention_cohorts",
        "get_conversion_funnel",
        "get_growth_metrics",
        "get_revenue_metrics",
        "get_engagement_metrics",
        "get_comprehensive_dashboard"
    ]
    
    for method in methods:
        if hasattr(AnalyticsDashboard, method):
            print(f"✅ {method} exists")
        else:
            print(f"❌ {method} missing")
            return False
    
    return True


def test_stripe_methods():
    """Test Stripe integration methods exist."""
    print("\nTesting Stripe integration methods...")
    
    from backend.stripe_integration import StripeIntegration
    
    methods = [
        "create_customer",
        "create_subscription",
        "cancel_subscription",
        "process_webhook"
    ]
    
    for method in methods:
        if hasattr(StripeIntegration, method):
            print(f"✅ {method} exists")
        else:
            print(f"❌ {method} missing")
            return False
    
    return True


def test_retention_methods():
    """Test retention campaign methods exist."""
    print("\nTesting retention campaign methods...")
    
    from backend.retention_campaigns import RetentionCampaignService
    
    methods = [
        "send_day_3_activation_email",
        "send_day_7_workflow_suggestions_email",
        "send_day_14_advanced_features_email",
        "process_retention_campaigns"
    ]
    
    for method in methods:
        if hasattr(RetentionCampaignService, method):
            print(f"✅ {method} exists")
        else:
            print(f"❌ {method} missing")
            return False
    
    return True


def main():
    """Run all tests."""
    print("=" * 60)
    print("Integration Tests")
    print("=" * 60)
    print()
    
    all_passed = True
    
    if not test_imports():
        all_passed = False
    
    if not test_analytics_methods():
        all_passed = False
    
    if not test_stripe_methods():
        all_passed = False
    
    if not test_retention_methods():
        all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
