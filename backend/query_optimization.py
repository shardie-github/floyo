"""
Database query optimization utilities.

Provides utilities for detecting and optimizing database queries:
- N+1 query detection
- Query result caching
- Query performance monitoring
"""

from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session, Query
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)

# Query performance threshold (milliseconds)
SLOW_QUERY_THRESHOLD_MS = 100

# Track queries for N+1 detection
_query_tracker: Dict[str, List[float]] = {}


@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Track query execution start time."""
    context._query_start_time = time.time()


@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Track query execution end time and log slow queries."""
    if hasattr(context, "_query_start_time"):
        duration_ms = (time.time() - context._query_start_time) * 1000
        
        # Log slow queries
        if duration_ms > SLOW_QUERY_THRESHOLD_MS:
            logger.warning(
                f"Slow query detected: {duration_ms:.2f}ms",
                extra={
                    "query": statement[:200] if statement else None,
                    "duration_ms": duration_ms,
                    "threshold_ms": SLOW_QUERY_THRESHOLD_MS,
                }
            )
        
        # Track for N+1 detection
        query_key = statement[:100] if statement else "unknown"
        if query_key not in _query_tracker:
            _query_tracker[query_key] = []
        _query_tracker[query_key].append(duration_ms)


def detect_n_plus_one(
    db: Session,
    query: Query,
    relationship_name: str,
    threshold: int = 5
) -> Dict[str, Any]:
    """
    Detect potential N+1 query patterns.
    
    Args:
        db: Database session
        relationship_name: Name of relationship to check
        threshold: Number of queries to trigger warning
        
    Returns:
        Dict[str, Any]: Detection results
    """
    # This is a simplified check - in production, use SQLAlchemy's
    # query logging or tools like django-debug-toolbar equivalent
    
    query_count_before = len(_query_tracker)
    
    # Execute query
    results = query.all()
    
    # Access relationship (this might trigger N+1)
    for result in results:
        getattr(result, relationship_name, None)
    
    query_count_after = len(_query_tracker)
    queries_executed = query_count_after - query_count_before
    
    is_n_plus_one = queries_executed > threshold
    
    if is_n_plus_one:
        logger.warning(
            f"Potential N+1 query detected: {queries_executed} queries for {len(results)} results",
            extra={
                "relationship": relationship_name,
                "result_count": len(results),
                "query_count": queries_executed,
                "threshold": threshold,
            }
        )
    
    return {
        "is_n_plus_one": is_n_plus_one,
        "queries_executed": queries_executed,
        "result_count": len(results),
        "relationship": relationship_name,
        "recommendation": "Use joinedload or selectinload to eager load relationship" if is_n_plus_one else None,
    }


def optimize_query_with_eager_loading(
    query: Query,
    relationships: List[str]
) -> Query:
    """
    Optimize query with eager loading for relationships.
    
    Args:
        query: SQLAlchemy query
        relationships: List of relationship names to eager load
        
    Returns:
        Query: Optimized query with eager loading
    """
    from sqlalchemy.orm import joinedload, selectinload
    
    optimized = query
    for rel in relationships:
        # Try joinedload first (more efficient for small relationships)
        try:
            optimized = optimized.options(joinedload(rel))
        except Exception:
            # Fall back to selectinload for larger relationships
            try:
                optimized = optimized.options(selectinload(rel))
            except Exception:
                logger.warning(f"Could not eager load relationship: {rel}")
    
    return optimized


def get_query_stats() -> Dict[str, Any]:
    """
    Get query performance statistics.
    
    Returns:
        Dict[str, Any]: Query statistics
    """
    if not _query_tracker:
        return {
            "total_queries": 0,
            "slow_queries": 0,
            "average_duration_ms": 0,
        }
    
    all_durations = []
    slow_count = 0
    
    for query_key, durations in _query_tracker.items():
        all_durations.extend(durations)
        slow_count += sum(1 for d in durations if d > SLOW_QUERY_THRESHOLD_MS)
    
    avg_duration = sum(all_durations) / len(all_durations) if all_durations else 0
    
    return {
        "total_queries": len(all_durations),
        "slow_queries": slow_count,
        "average_duration_ms": round(avg_duration, 2),
        "slow_query_threshold_ms": SLOW_QUERY_THRESHOLD_MS,
        "unique_query_patterns": len(_query_tracker),
    }


def clear_query_stats():
    """Clear query statistics."""
    global _query_tracker
    _query_tracker = {}


def cached_query_result(
    cache_key: str,
    ttl: int = 300,
    namespace: Optional[str] = "query"
):
    """
    Decorator to cache query results.
    
    Args:
        cache_key: Cache key template (can use {args} and {kwargs})
        ttl: Time to live in seconds
        namespace: Cache namespace
        
    Usage:
        @cached_query_result("user:{user_id}", ttl=600)
        def get_user(user_id: UUID):
            return db.query(User).filter(User.id == user_id).first()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from backend.cache import get, set
            
            # Generate cache key
            key = cache_key.format(*args, **kwargs)
            
            # Check cache
            cached_result = get(key, namespace=namespace)
            if cached_result is not None:
                return cached_result
            
            # Execute query
            result = func(*args, **kwargs)
            
            # Cache result
            set(key, result, ttl=ttl, namespace=namespace)
            
            return result
        
        return wrapper
    return decorator
