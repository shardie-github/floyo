"""API route registration."""

from fastapi import FastAPI

from backend.api import (
    auth, events, patterns, suggestions, stats, config,
    telemetry, insights, organizations, workflows, integrations,
    billing, admin, enterprise, growth, operational, security,
    privacy, autonomous, v1
)
from backend.api.analytics import dashboard as analytics_dashboard
from backend.api.integrations import zapier, tiktok, meta
from backend.api.marketplace import __init__ as marketplace_module
from backend.analytics import router as analytics_router
from backend.api.referral import router as referral_router


def register_routes(app: FastAPI):
    """Register all API routes."""
    
    # Legacy routes (deprecated)
    app.include_router(auth.router)
    app.include_router(events.router)
    app.include_router(patterns.router)
    app.include_router(suggestions.router)
    app.include_router(stats.router)
    app.include_router(config.router)
    app.include_router(telemetry.router)
    app.include_router(insights.router)
    app.include_router(organizations.router)
    app.include_router(workflows.router)
    app.include_router(integrations.router)
    app.include_router(billing.router)
    app.include_router(admin.router)
    app.include_router(enterprise.router)
    app.include_router(growth.router)
    app.include_router(operational.router)
    app.include_router(security.router)
    app.include_router(privacy.router)
    app.include_router(autonomous.router)
    
    # Analytics routes
    app.include_router(analytics_dashboard.router)
    app.include_router(analytics_router)
    
    # Referral routes
    app.include_router(referral_router)
    
    # Integration-specific routes
    app.include_router(zapier.router)
    app.include_router(tiktok.router)
    app.include_router(meta.router)
    
    # Marketplace routes
    from backend.api.marketplace import __init__ as marketplace
    app.include_router(marketplace.router)
    
    # Versioned routes (v1)
    app.include_router(v1.workflows.router, prefix="/api/v1")
    app.include_router(v1.billing.router, prefix="/api/v1")
