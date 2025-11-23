"""
API v1 Events Routes

Versioned event endpoints.
"""

from fastapi import APIRouter
from backend.api.events import router as events_router_base

# Re-export events router for v1
router = events_router_base
