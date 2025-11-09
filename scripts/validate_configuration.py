#!/usr/bin/env python3
"""Validate configuration for new features."""

import os
import sys
from pathlib import Path

def check_env_var(name, required=True, description=""):
    """Check if environment variable is set."""
    value = os.getenv(name)
    if required and not value:
        print(f"❌ {name}: NOT SET (Required)")
        if description:
            print(f"   {description}")
        return False
    elif value:
        # Mask sensitive values
        if "KEY" in name or "SECRET" in name or "PASSWORD" in name:
            masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
            print(f"✅ {name}: {masked}")
        else:
            print(f"✅ {name}: {value}")
        return True
    else:
        print(f"⚠️  {name}: NOT SET (Optional)")
        if description:
            print(f"   {description}")
        return True


def main():
    """Validate configuration."""
    print("=" * 60)
    print("Configuration Validation")
    print("=" * 60)
    print()
    
    issues = []
    
    print("Analytics Configuration:")
    print("-" * 60)
    if not check_env_var("NEXT_PUBLIC_POSTHOG_KEY", required=False, 
                        description="PostHog API key for analytics"):
        issues.append("PostHog key not set - analytics will not work")
    check_env_var("NEXT_PUBLIC_POSTHOG_HOST", required=False,
                 description="PostHog host (default: https://us.i.posthog.com)")
    print()
    
    print("Stripe Configuration:")
    print("-" * 60)
    if not check_env_var("STRIPE_API_KEY", required=False,
                        description="Stripe API key for billing"):
        issues.append("Stripe API key not set - billing will not work")
    if not check_env_var("STRIPE_WEBHOOK_SECRET", required=False,
                        description="Stripe webhook secret for webhook verification"):
        issues.append("Stripe webhook secret not set - webhooks will fail")
    print()
    
    print("Email Configuration:")
    print("-" * 60)
    sendgrid_set = check_env_var("SENDGRID_API_KEY", required=False,
                                 description="SendGrid API key for emails")
    smtp_set = check_env_var("SMTP_HOST", required=False,
                            description="SMTP host (alternative to SendGrid)")
    
    if not sendgrid_set and not smtp_set:
        issues.append("No email service configured - retention campaigns will not send emails")
        print("   ⚠️  Either SENDGRID_API_KEY or SMTP_* variables must be set")
    
    check_env_var("SENDGRID_FROM_EMAIL", required=False,
                 description="From email address for SendGrid")
    check_env_var("SMTP_FROM_EMAIL", required=False,
                 description="From email address for SMTP")
    print()
    
    print("Frontend Configuration:")
    print("-" * 60)
    check_env_var("FRONTEND_URL", required=False,
                 description="Frontend URL for email links (default: http://localhost:3000)")
    print()
    
    print("Database Configuration:")
    print("-" * 60)
    if not check_env_var("DATABASE_URL", required=True,
                        description="PostgreSQL database URL"):
        issues.append("DATABASE_URL not set - application will not start")
    print()
    
    print("Redis Configuration:")
    print("-" * 60)
    check_env_var("REDIS_URL", required=False,
                 description="Redis URL (default: redis://localhost:6379/0)")
    check_env_var("CELERY_BROKER_URL", required=False,
                 description="Celery broker URL")
    check_env_var("CELERY_RESULT_BACKEND", required=False,
                 description="Celery result backend URL")
    print()
    
    print("Security Configuration:")
    print("-" * 60)
    if not check_env_var("SECRET_KEY", required=True,
                        description="Secret key for JWT tokens"):
        issues.append("SECRET_KEY not set - security risk!")
    print()
    
    print("=" * 60)
    if issues:
        print("\n⚠️  Configuration Issues Found:")
        for issue in issues:
            print(f"   - {issue}")
        print("\n💡 Copy .env.example to .env and fill in the values")
        return 1
    else:
        print("\n✅ All required configuration is set!")
        return 0


if __name__ == "__main__":
    # Load .env file if it exists
    env_file = Path(".env")
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
    
    sys.exit(main())
