"""
API v1 Telemetry Routes

Versioned telemetry endpoints.
"""

from fastapi import APIRouter
from backend.api.telemetry import router as telemetry_router_base

# Re-export telemetry router for v1
router = telemetry_router_base
