"""
API v1 Insights Routes

Versioned insights endpoints.
"""

from fastapi import APIRouter
from backend.endpoints.insights import router as insights_router_base

# Re-export insights router for v1
router = insights_router_base
