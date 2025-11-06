"""
Troubleshooting and debugging utilities.

Provides tools for diagnosing issues, debugging problems, and gathering diagnostic information.
"""

import traceback
import sys
import inspect
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from functools import wraps

logger = logging.getLogger(__name__)


def get_diagnostic_info() -> Dict[str, Any]:
    """
    Get comprehensive diagnostic information about the system.
    
    Returns:
        Dict[str, Any]: Diagnostic information
    """
    import os
    import platform
    from backend.config import settings
    from backend.database import get_pool_status
    from backend.cache import get_cache_stats
    
    info = {
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "platform": platform.platform(),
            "python_version": sys.version,
            "environment": settings.environment,
        },
        "database": get_pool_status(),
        "cache": get_cache_stats(),
        "configuration": {
            "environment": settings.environment,
            "database_pool_size": settings.database_pool_size,
            "rate_limit_per_minute": settings.rate_limit_per_minute,
        }
    }
    
    # Add memory info if available
    try:
        import psutil
        process = psutil.Process(os.getpid())
        info["memory"] = {
            "rss_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "vms_mb": round(process.memory_info().vms / 1024 / 1024, 2),
            "percent": round(process.memory_percent(), 2),
        }
    except Exception:
        pass
    
    return info


def debug_endpoint(func):
    """
    Decorator to add debugging information to endpoint.
    
    Usage:
        @debug_endpoint
        @app.get("/api/test")
        def test_endpoint():
            ...
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        import time
        from fastapi import Request
        
        start_time = time.time()
        request = None
        
        # Find Request object in args/kwargs
        for arg in args:
            if isinstance(arg, Request):
                request = arg
                break
        
        if not request:
            for value in kwargs.values():
                if isinstance(value, Request):
                    request = value
                    break
        
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            
            logger.debug(
                f"Endpoint {func.__name__} completed",
                extra={
                    "endpoint": func.__name__,
                    "duration_ms": round(duration * 1000, 2),
                    "path": request.url.path if request else None,
                    "method": request.method if request else None,
                }
            )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Endpoint {func.__name__} failed",
                extra={
                    "endpoint": func.__name__,
                    "duration_ms": round(duration * 1000, 2),
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                    "path": request.url.path if request else None,
                },
                exc_info=True
            )
            raise
    
    return wrapper


def trace_function_calls(func):
    """
    Decorator to trace function calls with arguments and return values.
    
    Usage:
        @trace_function_calls
        def my_function(arg1, arg2):
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(
            f"Calling {func.__name__}",
            extra={
                "function": func.__name__,
                "args": str(args)[:200],  # Limit length
                "kwargs": str(kwargs)[:200],
            }
        )
        
        try:
            result = func(*args, **kwargs)
            logger.debug(
                f"{func.__name__} returned",
                extra={
                    "function": func.__name__,
                    "result_type": type(result).__name__,
                }
            )
            return result
        except Exception as e:
            logger.error(
                f"{func.__name__} raised exception",
                extra={
                    "function": func.__name__,
                    "exception": str(e),
                    "traceback": traceback.format_exc(),
                },
                exc_info=True
            )
            raise
    
    return wrapper


def get_error_context(error: Exception) -> Dict[str, Any]:
    """
    Get detailed context about an error.
    
    Args:
        error: Exception object
        
    Returns:
        Dict[str, Any]: Error context
    """
    return {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "traceback": traceback.format_exc(),
        "frame_info": [],
    }


def check_health_detailed() -> Dict[str, Any]:
    """
    Perform detailed health check with diagnostics.
    
    Returns:
        Dict[str, Any]: Detailed health information
    """
    from backend.database import engine
    from backend.cache import redis_client
    
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {},
        "diagnostics": get_diagnostic_info(),
    }
    
    # Database check
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        health["checks"]["database"] = {"status": "ok"}
    except Exception as e:
        health["checks"]["database"] = {"status": "error", "error": str(e)}
        health["status"] = "unhealthy"
    
    # Cache check
    try:
        if redis_client:
            redis_client.ping()
            health["checks"]["cache"] = {"status": "ok", "backend": "redis"}
        else:
            health["checks"]["cache"] = {"status": "ok", "backend": "memory"}
    except Exception as e:
        health["checks"]["cache"] = {"status": "error", "error": str(e)}
        health["status"] = "degraded"
    
    return health


def log_request_details(request, include_body: bool = False):
    """
    Log detailed request information for debugging.
    
    Args:
        request: FastAPI request object
        include_body: Whether to include request body
    """
    details = {
        "method": request.method,
        "path": request.url.path,
        "query_params": dict(request.query_params),
        "headers": dict(request.headers),
        "client": request.client.host if request.client else None,
    }
    
    if include_body:
        try:
            # Note: This consumes the body stream
            body = request.body()
            details["body"] = body.decode()[:500]  # Limit length
        except Exception:
            pass
    
    logger.debug("Request details", extra=details)


class PerformanceProfiler:
    """Simple performance profiler."""
    
    def __init__(self):
        self.timings: Dict[str, List[float]] = {}
    
    def start(self, name: str):
        """Start timing an operation."""
        import time
        if name not in self.timings:
            self.timings[name] = []
        self.timings[name].append(time.perf_counter())
    
    def end(self, name: str):
        """End timing an operation."""
        import time
        if name in self.timings and self.timings[name]:
            start = self.timings[name][-1]
            elapsed = time.perf_counter() - start
            self.timings[name][-1] = elapsed
            return elapsed
        return None
    
    def get_report(self) -> Dict[str, Any]:
        """Get profiling report."""
        report = {}
        for name, times in self.timings.items():
            if times:
                report[name] = {
                    "count": len(times),
                    "total_ms": round(sum(times) * 1000, 2),
                    "mean_ms": round(sum(times) / len(times) * 1000, 2),
                    "min_ms": round(min(times) * 1000, 2),
                    "max_ms": round(max(times) * 1000, 2),
                }
        return report
    
    def reset(self):
        """Reset all timings."""
        self.timings = {}


# Global profiler instance
_profiler = PerformanceProfiler()


def profile_function(func):
    """
    Decorator to profile function execution time.
    
    Usage:
        @profile_function
        def my_function():
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        _profiler.start(func.__name__)
        try:
            return func(*args, **kwargs)
        finally:
            _profiler.end(func.__name__)
    
    return wrapper


def get_profiling_report() -> Dict[str, Any]:
    """Get current profiling report."""
    return _profiler.get_report()
