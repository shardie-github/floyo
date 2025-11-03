"""API v1 routes - versioned API structure."""

# NOTE: API versioning is currently not fully implemented.
# All routes are currently under /api/* (not /api/v1/*).
#
# Status: This file exists as a stub for future versioning implementation.
# Current routes are defined in backend/main.py under /api/* prefix.
#
# To implement versioning:
#   1. Move routes from main.py to versioned router modules
#   2. Mount api_v1_router with prefix="/api/v1"
#   3. Keep /api/* routes for backward compatibility during transition
#
# See: backend/main.py:174-175 for router definitions
