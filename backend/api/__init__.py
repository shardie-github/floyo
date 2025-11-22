"""API route registration and organization."""

from fastapi import APIRouter

from backend.api.auth import router as auth_router
from backend.api.health import router as health_router
from backend.monitoring import router as monitoring_router
from backend.analytics import router as analytics_router
from backend.endpoints.insights import router as insights_router
from backend.api.privacy import router as privacy_router
from backend.guardian.api import router as guardian_router
from backend.ml.api import router as ml_router
from backend.api.v1 import billing_router, workflow_router, workflow_automation_router
from backend.notifications.api import router as notifications_router
from backend.webhooks import router as webhook_router

# Create API routers
api_v1_router = APIRouter(prefix="/api/v1", tags=["v1"])
api_router = APIRouter(prefix="/api", tags=["legacy"])


def register_routes(app):
    """
    Register all API routes with the FastAPI application.
    
    This centralizes route registration for better organization and maintainability.
    
    Args:
        app: FastAPI application instance
    """
    # Root and health endpoints (no prefix)
    app.include_router(health_router)
    
    # Versioned API routes
    app.include_router(api_v1_router)
    
    # Legacy API routes
    app.include_router(api_router)
    
    # Auth routes (under /api/auth)
    app.include_router(auth_router)
    
    # Monitoring routes
    app.include_router(monitoring_router)
    
    # Analytics routes
    app.include_router(analytics_router)
    
    # Insights routes
    app.include_router(insights_router)
    
    # Privacy routes
    app.include_router(privacy_router)
    
    # Guardian routes
    app.include_router(guardian_router)
    
    # ML routes
    app.include_router(ml_router)
    
    # Workflow automation routes
    app.include_router(workflow_automation_router)
    
    # Notifications routes
    app.include_router(notifications_router)
    
    # Billing routes
    app.include_router(billing_router)
    
    # Workflow routes
    app.include_router(workflow_router)
    
    # Webhook routes
    app.include_router(webhook_router)
