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

# Cache statistics
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
    if redis_client:
        try:
            value = redis_client.get(key)
            if value is None:
                _cache_stats['misses'] += 1
                return default
            _cache_stats['hits'] += 1
            return json.loads(value)
        except Exception as e:
            logger.warning(f"Redis get failed: {e}, falling back to memory")
    
    # Fallback to in-memory cache
    if key not in _memory_cache:
        _cache_stats['misses'] += 1
        return default
    
    value, expiry = _memory_cache[key]
    
    # Check if expired
    if datetime.utcnow() > expiry:
        del _memory_cache[key]
        _cache_stats['misses'] += 1
        return default
    
    _cache_stats['hits'] += 1
    return value


def set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Set value in cache with TTL."""
    if redis_client:
        try:
            redis_client.setex(key, ttl_seconds, json.dumps(value))
            _cache_stats['sets'] += 1
            return
        except Exception as e:
            logger.warning(f"Redis set failed: {e}, falling back to memory")
    
    # Fallback to in-memory cache
    expiry = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    _memory_cache[key] = (value, expiry)
    _cache_stats['sets'] += 1
    
    # Clean up expired entries periodically
    if len(_memory_cache) > 1000:
        _cleanup_expired()


def delete(key: str) -> None:
    """Delete key from cache."""
    if redis_client:
        try:
            redis_client.delete(key)
            return
        except Exception as e:
            logger.warning(f"Redis delete failed: {e}, falling back to memory")
    
    if key in _memory_cache:
        del _memory_cache[key]


def invalidate_pattern(pattern: str) -> None:
    """Invalidate all keys matching pattern."""
    if redis_client:
        try:
            # Use SCAN to find matching keys (safer than KEYS for production)
            keys_to_delete = []
            cursor = 0
            while True:
                cursor, keys = redis_client.scan(cursor, match=pattern, count=100)
                keys_to_delete.extend(keys)
                if cursor == 0:
                    break
            if keys_to_delete:
                redis_client.delete(*keys_to_delete)
            logger.info(f"Invalidated {len(keys_to_delete)} cache entries matching pattern: {pattern}")
            return
        except Exception as e:
            logger.warning(f"Redis pattern invalidation failed: {e}, falling back to memory")
    
    # Fallback to in-memory cache
    keys_to_delete = [k for k in _memory_cache.keys() if pattern in k]
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
    if redis_client:
        # Redis handles TTL automatically, no cleanup needed
        return
    
    # Cleanup in-memory cache
    now = datetime.utcnow()
    expired_keys = [
        key for key, (_, expiry) in _memory_cache.items()
        if now > expiry
    ]
    for key in expired_keys:
        del _memory_cache[key]
    if expired_keys:
        logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")




def clear_cache() -> None:
    """Clear all cache entries."""
    if redis_client:
        try:
            redis_client.flushdb()
            logger.info("Redis cache cleared")
        except Exception as e:
            logger.warning(f"Redis flush failed: {e}")
    
    _memory_cache.clear()
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


def get_cache_stats() -> dict[str, Any]:
    """Get cache statistics."""
    total_requests = _cache_stats['hits'] + _cache_stats['misses']
    hit_rate = (_cache_stats['hits'] / total_requests * 100) if total_requests > 0 else 0
    
    if redis_client:
        try:
            info = redis_client.info('stats')
            return {
                'type': 'redis',
                'hits': _cache_stats['hits'],
                'misses': _cache_stats['misses'],
                'sets': _cache_stats['sets'],
                'hit_rate': round(hit_rate, 2),
                'redis_keys': redis_client.dbsize(),
                'redis_hits': info.get('keyspace_hits', 0),
                'redis_misses': info.get('keyspace_misses', 0),
            }
        except Exception as e:
            logger.warning(f"Failed to get Redis stats: {e}")
            return {
                'type': 'redis',
                'error': 'Failed to get stats',
                'hits': _cache_stats['hits'],
                'misses': _cache_stats['misses'],
                'sets': _cache_stats['sets'],
                'hit_rate': round(hit_rate, 2),
            }
    else:
        return {
            'type': 'memory',
            'size': len(_memory_cache),
            'hits': _cache_stats['hits'],
            'misses': _cache_stats['misses'],
            'sets': _cache_stats['sets'],
            'hit_rate': round(hit_rate, 2),
        }


# Redis client (initialized in init_cache)
redis_client = None
_memory_cache: dict[str, tuple[Any, datetime]] = {}


def init_cache() -> None:
    """Initialize cache with Redis if available, fallback to in-memory."""
    global redis_client
    
    try:
        from backend.config import settings
        
        # Try to initialize Redis if URL is provided
        if hasattr(settings, 'redis_url') and settings.redis_url:
            import redis
            redis_client = redis.from_url(settings.redis_url, decode_responses=True)
            # Test connection
            redis_client.ping()
            logger.info("Cache initialized (Redis)")
            return
        elif hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
            import redis
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            redis_client.ping()
            logger.info("Cache initialized (Redis)")
            return
    except Exception as e:
        logger.warning(f"Redis initialization failed, using in-memory cache: {e}")
    
    # Fallback to in-memory cache
    redis_client = None
    logger.info("Cache initialized (in-memory)")
