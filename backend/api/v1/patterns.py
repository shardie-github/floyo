"""
API v1 Patterns Routes

Versioned pattern endpoints.
"""

from fastapi import APIRouter
from backend.api.patterns import router as patterns_router_base

# Re-export patterns router for v1
router = patterns_router_base
