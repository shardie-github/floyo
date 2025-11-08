"""
Performance Optimization Module
Implements:
- Query optimization
- Advanced caching strategies
- Response compression
- Database connection pooling optimization
- Query result pagination
- Lazy loading optimization
"""

import time
import functools
import hashlib
import json
from typing import Optional, Dict, Any, Callable, List
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, Query
from sqlalchemy import text, func
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import gzip
import logging
from backend.config import settings
from backend.cache import get, set, delete

logger = logging.getLogger(__name__)

# Performance metrics
QUERY_TIMES: Dict[str, List[float]] = {}
CACHE_HIT_RATES: Dict[str, float] = {}


class QueryOptimizer:
    """Database query optimization utilities."""
    
    @staticmethod
    def optimize_query(query: Query, limit: Optional[int] = None, offset: int = 0) -> Query:
        """
        Optimize a SQLAlchemy query.
        
        Args:
            query: SQLAlchemy query object
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            Query: Optimized query
        """
        # Add limit if specified
        if limit:
            query = query.limit(limit)
        
        # Add offset
        if offset > 0:
            query = query.offset(offset)
        
        return query
    
    @staticmethod
    def add_eager_loading(query: Query, relationships: List[str]) -> Query:
        """
        Add eager loading for relationships to prevent N+1 queries.
        
        Args:
            query: SQLAlchemy query object
            relationships: List of relationship names to eager load
            
        Returns:
            Query: Query with eager loading
        """
        from sqlalchemy.orm import joinedload
        
        for rel in relationships:
            query = query.options(joinedload(rel))
        
        return query
    
    @staticmethod
    def use_index_hint(query: Query, table: str, index: str) -> Query:
        """
        Add index hint to query (PostgreSQL specific).
        
        Args:
            query: SQLAlchemy query object
            table: Table name
            index: Index name
            
        Returns:
            Query: Query with index hint
        """
        # PostgreSQL index hint syntax
        # Note: SQLAlchemy doesn't directly support index hints,
        # so this would need to be done via raw SQL if needed
        return query
    
    @staticmethod
    def measure_query_time(func: Callable) -> Callable:
        """Decorator to measure query execution time."""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            query_name = func.__name__
            if query_name not in QUERY_TIMES:
                QUERY_TIMES[query_name] = []
            QUERY_TIMES[query_name].append(execution_time)
            
            # Log slow queries
            if execution_time > 1.0:  # More than 1 second
                logger.warning(
                    f"Slow query detected: {query_name} took {execution_time:.2f}s"
                )
            
            return result
        return wrapper


class ResponseCompression:
    """Response compression utilities."""
    
    @staticmethod
    def compress_response(content: bytes, min_size: int = 1024) -> tuple[bytes, bool]:
        """
        Compress response content if it exceeds minimum size.
        
        Args:
            content: Response content bytes
            min_size: Minimum size to compress (bytes)
            
        Returns:
            tuple: (compressed_content, is_compressed)
        """
        if len(content) < min_size:
            return content, False
        
        try:
            compressed = gzip.compress(content, compresslevel=6)
            # Only use compression if it actually reduces size
            if len(compressed) < len(content):
                return compressed, True
        except Exception as e:
            logger.warning(f"Failed to compress response: {e}")
        
        return content, False
    
    @staticmethod
    def add_compression_headers(response: Response, is_compressed: bool):
        """Add compression headers to response."""
        if is_compressed:
            response.headers["Content-Encoding"] = "gzip"
            response.headers["Vary"] = "Accept-Encoding"


class CacheStrategy:
    """Advanced caching strategies."""
    
    @staticmethod
    def generate_cache_key(prefix: str, *args, **kwargs) -> str:
        """
        Generate a cache key from arguments.
        
        Args:
            prefix: Cache key prefix
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            str: Cache key
        """
        key_data = {
            "args": args,
            "kwargs": sorted(kwargs.items())
        }
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:{key_hash}"
    
    @staticmethod
    def cache_result(ttl: int = 300, key_prefix: str = "cache"):
        """
        Decorator to cache function results.
        
        Args:
            ttl: Time to live in seconds
            key_prefix: Cache key prefix
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = CacheStrategy.generate_cache_key(
                    f"{key_prefix}:{func.__name__}",
                    *args,
                    **kwargs
                )
                
                # Try to get from cache
                cached_result = await get(cache_key)
                if cached_result is not None:
                    # Track cache hit
                    if func.__name__ not in CACHE_HIT_RATES:
                        CACHE_HIT_RATES[func.__name__] = 0
                    CACHE_HIT_RATES[func.__name__] += 1
                    return cached_result
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Store in cache
                await set(cache_key, result, ttl=ttl)
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def invalidate_cache_pattern(pattern: str):
        """
        Invalidate all cache keys matching a pattern.
        
        Args:
            pattern: Cache key pattern to match
        """
        # This would need Redis SCAN or similar for pattern matching
        # For now, just log
        logger.info(f"Cache invalidation requested for pattern: {pattern}")


class PaginationOptimizer:
    """Optimize pagination queries."""
    
    @staticmethod
    def paginate_query(
        query: Query,
        page: int = 1,
        per_page: int = 20,
        max_per_page: int = 100
    ) -> Dict[str, Any]:
        """
        Paginate a query efficiently.
        
        Args:
            query: SQLAlchemy query object
            page: Page number (1-indexed)
            per_page: Items per page
            max_per_page: Maximum items per page
            
        Returns:
            dict: Paginated results with metadata
        """
        # Validate and limit per_page
        per_page = min(per_page, max_per_page)
        per_page = max(1, per_page)
        page = max(1, page)
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Get total count (cached if possible)
        total = query.count()
        
        # Get paginated results
        items = query.offset(offset).limit(per_page).all()
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page
        
        return {
            "items": items,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            }
        }


class DatabaseConnectionOptimizer:
    """Optimize database connection usage."""
    
    @staticmethod
    def optimize_connection_pool(
        pool_size: int = 10,
        max_overflow: int = 20,
        pool_recycle: int = 3600,
        pool_pre_ping: bool = True
    ) -> Dict[str, int]:
        """
        Get optimized connection pool settings.
        
        Args:
            pool_size: Base pool size
            max_overflow: Maximum overflow connections
            pool_recycle: Connection recycle time (seconds)
            pool_pre_ping: Enable connection health checks
            
        Returns:
            dict: Optimized pool settings
        """
        # Adjust based on environment
        if settings.environment == "production":
            # Larger pool for production
            pool_size = max(pool_size, 20)
            max_overflow = max(max_overflow, 40)
        elif settings.environment == "development":
            # Smaller pool for development
            pool_size = min(pool_size, 5)
            max_overflow = min(max_overflow, 10)
        
        return {
            "pool_size": pool_size,
            "max_overflow": max_overflow,
            "pool_recycle": pool_recycle,
            "pool_pre_ping": pool_pre_ping,
        }


class PerformanceMonitor:
    """Monitor and track performance metrics."""
    
    @staticmethod
    def get_query_stats() -> Dict[str, Any]:
        """Get query performance statistics."""
        stats = {}
        for query_name, times in QUERY_TIMES.items():
            if times:
                stats[query_name] = {
                    "count": len(times),
                    "avg_time": sum(times) / len(times),
                    "min_time": min(times),
                    "max_time": max(times),
                    "total_time": sum(times),
                }
        return stats
    
    @staticmethod
    def get_cache_stats() -> Dict[str, float]:
        """Get cache hit rate statistics."""
        return CACHE_HIT_RATES.copy()
    
    @staticmethod
    def reset_stats():
        """Reset performance statistics."""
        QUERY_TIMES.clear()
        CACHE_HIT_RATES.clear()


def optimize_response(response_data: Any, request: Request) -> Response:
    """
    Optimize API response with compression and caching headers.
    
    Args:
        response_data: Response data to send
        request: FastAPI request object
        
    Returns:
        Response: Optimized response
    """
    # Convert to JSON
    if isinstance(response_data, dict) or isinstance(response_data, list):
        content = json.dumps(response_data).encode('utf-8')
    else:
        content = str(response_data).encode('utf-8')
    
    # Compress if beneficial
    compressed_content, is_compressed = ResponseCompression.compress_response(content)
    
    # Create response
    response = Response(
        content=compressed_content,
        media_type="application/json"
    )
    
    # Add compression headers
    ResponseCompression.add_compression_headers(response, is_compressed)
    
    # Add caching headers
    response.headers["Cache-Control"] = "public, max-age=300"  # 5 minutes
    response.headers["ETag"] = hashlib.md5(content).hexdigest()
    
    # Add performance headers
    response.headers["X-Content-Size"] = str(len(content))
    if is_compressed:
        response.headers["X-Compressed-Size"] = str(len(compressed_content))
    
    return response
