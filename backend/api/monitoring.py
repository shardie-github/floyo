"""
Performance Monitoring API Endpoints

Provides endpoints to view performance metrics.
"""

from fastapi import APIRouter, Depends
from backend.monitoring.performance import get_performance_monitor
from backend.auth.utils import get_current_user
from database.models import User

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/performance")
async def get_performance_metrics(
    current_user: User = Depends(get_current_user),
):
    """
    Get performance metrics for all endpoints.
    
    Requires authentication.
    """
    monitor = get_performance_monitor()
    stats = monitor.get_all_stats()
    
    return {
        "metrics": stats,
        "timestamp": "2025-01-XXT00:00:00Z",  # TODO: Use actual timestamp
    }


@router.get("/performance/{endpoint:path}")
async def get_endpoint_performance(
    endpoint: str,
    method: str = "GET",
    current_user: User = Depends(get_current_user),
):
    """
    Get performance metrics for a specific endpoint.
    
    Args:
        endpoint: API endpoint path
        method: HTTP method (default: GET)
    
    Returns:
        Performance statistics
    """
    monitor = get_performance_monitor()
    stats = monitor.get_stats(endpoint, method)
    
    return {
        "endpoint": endpoint,
        "method": method,
        "stats": stats,
    }
