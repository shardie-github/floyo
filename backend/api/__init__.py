"""API route registration and organization."""

from fastapi import APIRouter

from backend.api.auth import router as auth_router
from backend.api.health import router as health_router
from backend.api.events import router as events_router
from backend.api.suggestions import router as suggestions_router
from backend.api.patterns import router as patterns_router
from backend.api.organizations import router as organizations_router
from backend.api.workflows import router as workflows_router
from backend.api.integrations import router as integrations_router
from backend.api.growth import router as growth_router
from backend.api.operational import router as operational_router
from backend.api.autonomous import router as autonomous_router
from backend.api.enterprise import router as enterprise_router
from backend.api.security import router as security_router
from backend.api.admin import router as admin_router
from backend.api.stats import router as stats_router
from backend.api.billing import router as billing_router
from backend.api.websocket import router as websocket_router
from backend.monitoring import router as monitoring_router
from backend.analytics import router as analytics_router
from backend.endpoints.insights import router as insights_router
from backend.api.privacy import router as privacy_router
from backend.api.telemetry import router as telemetry_router
from backend.guardian.api import router as guardian_router
from backend.ml.api import router as ml_router
from backend.api.v1 import billing_router as v1_billing_router, workflow_router as v1_workflow_router, workflow_automation_router
from backend.api.v1 import v1_router
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
    
    # WebSocket routes (no prefix)
    app.include_router(websocket_router)
    
    # Versioned API routes (v1)
    app.include_router(v1_router)
    
    # Legacy API routes
    app.include_router(api_router)
    
    # Auth routes (under /api/auth)
    app.include_router(auth_router)
    
    # Events routes
    app.include_router(events_router)
    
    # Suggestions routes
    app.include_router(suggestions_router)
    
    # Patterns routes
    app.include_router(patterns_router)
    
    # Organizations routes
    app.include_router(organizations_router)
    
    # Workflows routes (legacy)
    app.include_router(workflows_router)
    
    # Integrations routes
    app.include_router(integrations_router)
    
    # Growth routes
    app.include_router(growth_router)
    
    # Operational routes
    app.include_router(operational_router)
    
    # Autonomous routes
    app.include_router(autonomous_router)
    
    # Enterprise routes
    app.include_router(enterprise_router)
    
    # Security routes
    app.include_router(security_router)
    
    # Admin routes
    app.include_router(admin_router)
    
    # Stats/config/data routes
    app.include_router(stats_router)
    
    # Billing routes (legacy)
    app.include_router(billing_router)
    
    # Monitoring routes
    app.include_router(monitoring_router)
    
    # Analytics routes
    app.include_router(analytics_router)
    
    # Insights routes
    app.include_router(insights_router)
    
    # Privacy routes
    app.include_router(privacy_router)
    
    # Telemetry routes
    app.include_router(telemetry_router)
    
    # Guardian routes
    app.include_router(guardian_router)
    
    # ML routes
    app.include_router(ml_router)
    
    # Workflow automation routes (v1)
    app.include_router(workflow_automation_router)
    
    # Notifications routes
    app.include_router(notifications_router)
    
    # Billing routes (v1)
    app.include_router(v1_billing_router)
    
    # Workflow routes (v1)
    app.include_router(v1_workflow_router)
    
    # Webhook routes
    app.include_router(webhook_router)
