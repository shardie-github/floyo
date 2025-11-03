"""Sentry error tracking configuration."""

import os
import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from backend.config import settings

def init_sentry() -> None:
    """Initialize Sentry error tracking."""
    dsn = settings.sentry_dsn
    
    if not dsn:
        # Sentry is optional - don't fail if not configured
        return
    
    environment = settings.environment
    release = os.getenv("RELEASE_VERSION", "unknown")
    
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release,
        traces_sample_rate=0.1 if environment == "production" else 1.0,
        profiles_sample_rate=0.1 if environment == "production" else 1.0,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            LoggingIntegration(level=None, event_level=logging.ERROR),
        ],
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production.
    )
