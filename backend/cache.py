"""Caching layer for dashboard data and frequently accessed queries."""

import sys
from pathlib import Path
from typing import Any, Optional
from datetime import datetime, timedelta
import json
import hashlib

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.logging_config import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)

# In-memory cache (for development)
# In production, use Redis or similar
_cache: dict[str, tuple[Any, datetime]] = {}
_cache_stats = {
    'hits': 0,
    'misses': 0,
    'sets': 0,
}


def get_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a cache key from prefix and arguments."""
    key_data = {
        'prefix': prefix,
        'args': args,
        'kwargs': kwargs,
    }
    key_str = json.dumps(key_data, sort_keys=True)
    return f"{prefix}:{hashlib.md5(key_str.encode()).hexdigest()}"


def get(key: str, default: Any = None) -> Optional[Any]:
    """Get value from cache."""
    if key not in _cache:
        _cache_stats['misses'] += 1
        return default
    
    value, expiry = _cache[key]
    
    # Check if expired
    if datetime.utcnow() > expiry:
        del _cache[key]
        _cache_stats['misses'] += 1
        return default
    
    _cache_stats['hits'] += 1
    return value


def set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Set value in cache with TTL."""
    expiry = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    _cache[key] = (value, expiry)
    _cache_stats['sets'] += 1
    
    # Clean up expired entries periodically
    if len(_cache) > 1000:
        _cleanup_expired()


def delete(key: str) -> None:
    """Delete key from cache."""
    if key in _cache:
        del _cache[key]


def invalidate_pattern(pattern: str) -> None:
    """Invalidate all keys matching pattern."""
    keys_to_delete = [k for k in _cache.keys() if pattern in k]
    for key in keys_to_delete:
        delete(key)
    logger.info(f"Invalidated {len(keys_to_delete)} cache entries matching pattern: {pattern}")


def invalidate_user_cache(user_id: str) -> None:
    """Invalidate all cache entries for a user."""
    invalidate_pattern(f"user:{user_id}")


def invalidate_resource_cache(resource_type: str, resource_id: Optional[str] = None) -> None:
    """Invalidate cache entries for a resource."""
    if resource_id:
        invalidate_pattern(f"{resource_type}:{resource_id}")
    else:
        invalidate_pattern(f"{resource_type}:")


def _cleanup_expired() -> None:
    """Remove expired entries from cache."""
    now = datetime.utcnow()
    expired_keys = [
        key for key, (_, expiry) in _cache.items()
        if now > expiry
    ]
    for key in expired_keys:
        del _cache[key]
    if expired_keys:
        logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")


def get_cache_stats() -> dict[str, Any]:
    """Get cache statistics."""
    total_requests = _cache_stats['hits'] + _cache_stats['misses']
    hit_rate = (_cache_stats['hits'] / total_requests * 100) if total_requests > 0 else 0
    
    return {
        'size': len(_cache),
        'hits': _cache_stats['hits'],
        'misses': _cache_stats['misses'],
        'sets': _cache_stats['sets'],
        'hit_rate': round(hit_rate, 2),
    }


def clear_cache() -> None:
    """Clear all cache entries."""
    _cache.clear()
    _cache_stats['hits'] = 0
    _cache_stats['misses'] = 0
    _cache_stats['sets'] = 0
    logger.info("Cache cleared")


# Decorator for caching function results
def cached(ttl_seconds: int = 300, key_prefix: Optional[str] = None):
    """Decorator to cache function results."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            prefix = key_prefix or f"{func.__module__}.{func.__name__}"
            cache_key = get_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_value = get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            set(cache_key, result, ttl_seconds)
            return result
        
        return wrapper
    return decorator


def invalidate_user_cache(user_id: str) -> int:
    """Invalidate all cache entries for a user."""
    return clear_pattern(f"user:{user_id}:*")


def invalidate_resource_cache(resource_type: str, resource_id: Optional[str] = None) -> int:
    """Invalidate cache entries for a resource."""
    if resource_id:
        return clear_pattern(f"{resource_type}:{resource_id}:*")
    else:
        return clear_pattern(f"{resource_type}:*")


def get_cache_stats() -> dict[str, Any]:
    """Get cache statistics."""
    if redis_client:
        try:
            info = redis_client.info('stats')
            return {
                'type': 'redis',
                'hits': info.get('keyspace_hits', 0),
                'misses': info.get('keyspace_misses', 0),
                'keys': redis_client.dbsize(),
            }
        except Exception:
            return {'type': 'redis', 'error': 'Failed to get stats'}
    else:
        return {
            'type': 'memory',
            'size': len(_memory_cache),
            'keys': len(_memory_cache),
        }


def init_cache() -> None:
    """Initialize cache (placeholder for Redis initialization in production)."""
    logger.info("Cache initialized (in-memory)")
    # In production, initialize Redis connection here
    # Example:
    # import redis
    # global redis_client
    # redis_client = redis.Redis(host=settings.redis_host, port=settings.redis_port)
