"""
Performance Monitoring Middleware

FastAPI middleware to track request latency and performance metrics.
"""

import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.monitoring.performance import get_performance_monitor

logger = None


def get_logger():
    """Lazy import logger to avoid circular imports."""
    global logger
    if logger is None:
        from backend.logging_config import get_logger as _get_logger
        logger = _get_logger(__name__)
    return logger


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to track API performance."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Track request latency and performance."""
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000
        
        # Record metrics
        monitor = get_performance_monitor()
        endpoint = request.url.path
        method = request.method
        
        monitor.record_latency(
            endpoint=endpoint,
            method=method,
            latency_ms=latency_ms,
            status_code=response.status_code,
        )
        
        # Add performance headers
        response.headers["X-Response-Time-Ms"] = str(round(latency_ms, 2))
        
        # Log slow requests
        if latency_ms > 500:
            get_logger().warning(
                f"Slow request: {method} {endpoint} took {latency_ms:.2f}ms "
                f"(status: {response.status_code})"
            )
        
        return response
