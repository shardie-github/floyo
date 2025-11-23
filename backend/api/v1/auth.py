"""
API v1 Auth Routes

Versioned authentication endpoints.
"""

from fastapi import APIRouter
from backend.api.auth import router as auth_router_base

# Create v1-specific router (reuses auth router but with v1 prefix)
router = APIRouter(prefix="/auth", tags=["auth"])

# Import all routes from base auth router
# Note: The base router already has /api/auth prefix, so we'll use it directly
# For v1, we'll create wrapper routes if needed
router = auth_router_base
