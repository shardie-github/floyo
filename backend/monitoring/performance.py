"""
Performance Monitoring

Tracks API latency, database query performance, and system metrics.
"""

import time
from typing import Dict, Any, Optional, Callable
from functools import wraps
from datetime import datetime
from contextlib import contextmanager

from backend.logging_config import get_logger
from backend.cache import get, set

logger = get_logger(__name__)


class PerformanceMonitor:
    """Performance monitoring utility."""
    
    def __init__(self):
        self.metrics: Dict[str, list] = {}
    
    def record_latency(
        self,
        endpoint: str,
        method: str,
        latency_ms: float,
        status_code: int = 200,
    ):
        """
        Record API endpoint latency.
        
        Args:
            endpoint: API endpoint path
            method: HTTP method
            latency_ms: Latency in milliseconds
            status_code: HTTP status code
        """
        key = f"{method}:{endpoint}"
        
        if key not in self.metrics:
            self.metrics[key] = []
        
        self.metrics[key].append({
            'latency_ms': latency_ms,
            'status_code': status_code,
            'timestamp': datetime.utcnow().isoformat(),
        })
        
        # Keep only last 1000 measurements
        if len(self.metrics[key]) > 1000:
            self.metrics[key] = self.metrics[key][-1000:]
        
        # Log slow requests
        if latency_ms > 500:
            logger.warning(
                f"Slow request: {key} took {latency_ms:.2f}ms (status: {status_code})"
            )
    
    def get_stats(self, endpoint: str, method: str) -> Dict[str, Any]:
        """
        Get performance statistics for an endpoint.
        
        Args:
            endpoint: API endpoint path
            method: HTTP method
        
        Returns:
            Performance statistics
        """
        key = f"{method}:{endpoint}"
        measurements = self.metrics.get(key, [])
        
        if not measurements:
            return {
                'count': 0,
                'p50': 0,
                'p95': 0,
                'p99': 0,
                'avg': 0,
                'max': 0,
            }
        
        latencies = [m['latency_ms'] for m in measurements]
        latencies.sort()
        
        count = len(latencies)
        p50 = latencies[int(count * 0.5)] if count > 0 else 0
        p95 = latencies[int(count * 0.95)] if count > 0 else 0
        p99 = latencies[int(count * 0.99)] if count > 0 else 0
        avg = sum(latencies) / count if count > 0 else 0
        max_latency = max(latencies) if latencies else 0
        
        return {
            'count': count,
            'p50': round(p50, 2),
            'p95': round(p95, 2),
            'p99': round(p99, 2),
            'avg': round(avg, 2),
            'max': round(max_latency, 2),
        }
    
    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get performance statistics for all endpoints."""
        stats = {}
        for key in self.metrics.keys():
            method, endpoint = key.split(':', 1)
            stats[key] = self.get_stats(endpoint, method)
        return stats


# Global performance monitor instance
_performance_monitor = PerformanceMonitor()


def get_performance_monitor() -> PerformanceMonitor:
    """Get global performance monitor instance."""
    return _performance_monitor


def measure_latency(endpoint: str, method: str = "GET"):
    """
    Decorator to measure endpoint latency.
    
    Usage:
        @measure_latency("/api/events", "POST")
        async def create_event(...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                status_code = getattr(result, 'status_code', 200) if hasattr(result, 'status_code') else 200
                latency_ms = (time.time() - start_time) * 1000
                _performance_monitor.record_latency(endpoint, method, latency_ms, status_code)
                return result
            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000
                status_code = 500
                _performance_monitor.record_latency(endpoint, method, latency_ms, status_code)
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                status_code = getattr(result, 'status_code', 200) if hasattr(result, 'status_code') else 200
                latency_ms = (time.time() - start_time) * 1000
                _performance_monitor.record_latency(endpoint, method, latency_ms, status_code)
                return result
            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000
                status_code = 500
                _performance_monitor.record_latency(endpoint, method, latency_ms, status_code)
                raise
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


@contextmanager
def measure_query(query_name: str):
    """
    Context manager to measure database query performance.
    
    Usage:
        with measure_query("get_user_events"):
            events = db.query(Event).filter(...).all()
    """
    start_time = time.time()
    try:
        yield
    finally:
        latency_ms = (time.time() - start_time) * 1000
        if latency_ms > 100:  # Log slow queries
            logger.warning(f"Slow query: {query_name} took {latency_ms:.2f}ms")
        else:
            logger.debug(f"Query: {query_name} took {latency_ms:.2f}ms")
