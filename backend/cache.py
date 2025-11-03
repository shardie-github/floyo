"""Caching layer for FastAPI using Redis (with fallback to in-memory cache)."""

import json
import os
from typing import Optional, Any, Callable
from functools import wraps
import hashlib
import time

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# In-memory cache fallback
_memory_cache: dict = {}
_memory_cache_ttl: dict = {}

# Redis connection
redis_client: Optional[redis.Redis] = None

def init_cache():
    """Initialize Redis cache if available, otherwise use in-memory cache."""
    global redis_client
    from backend.config import settings
    
    if REDIS_AVAILABLE:
        redis_url = settings.redis_url or "redis://localhost:6379/0"
        try:
            redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            redis_client.ping()
            print("Redis cache initialized successfully")
        except Exception as e:
            print(f"Redis connection failed, using in-memory cache: {e}")
            redis_client = None
            if settings.environment == "production":
                print("WARNING: Redis unavailable in production - using in-memory cache (not recommended)")
    else:
        print("Redis not available, using in-memory cache")
        if settings.environment == "production":
            print("WARNING: Redis not installed - using in-memory cache (not recommended)")


def _get_cache_key(key: str) -> str:
    """Generate cache key."""
    return f"floyo:{key}"


def get(key: str, default: Any = None) -> Optional[Any]:
    """Get value from cache."""
    cache_key = _get_cache_key(key)
    
    if redis_client:
        try:
            value = redis_client.get(cache_key)
            if value:
                return json.loads(value)
        except Exception:
            pass
    else:
        # In-memory cache
        if key in _memory_cache:
            ttl = _memory_cache_ttl.get(key, 0)
            if ttl == 0 or time.time() < ttl:
                return _memory_cache[key]
            else:
                # Expired
                del _memory_cache[key]
                del _memory_cache_ttl[key]
    
    return default


def set(key: str, value: Any, ttl: int = 300) -> bool:
    """Set value in cache with TTL in seconds."""
    cache_key = _get_cache_key(key)
    
    if redis_client:
        try:
            serialized = json.dumps(value)
            return redis_client.setex(cache_key, ttl, serialized)
        except Exception:
            return False
    else:
        # In-memory cache
        _memory_cache[key] = value
        if ttl > 0:
            _memory_cache_ttl[key] = time.time() + ttl
        return True


def delete(key: str) -> bool:
    """Delete value from cache."""
    cache_key = _get_cache_key(key)
    
    if redis_client:
        try:
            return bool(redis_client.delete(cache_key))
        except Exception:
            return False
    else:
        if key in _memory_cache:
            del _memory_cache[key]
            if key in _memory_cache_ttl:
                del _memory_cache_ttl[key]
            return True
        return False


def clear_pattern(pattern: str) -> int:
    """Clear all keys matching a pattern."""
    if redis_client:
        try:
            # Replace * with Redis pattern
            redis_pattern = pattern.replace('*', '*')
            keys = redis_client.keys(_get_cache_key(redis_pattern))
            if keys:
                return redis_client.delete(*keys)
            return 0
        except Exception:
            return 0
    else:
        # In-memory cache - simple pattern matching
        prefix_pattern = pattern.replace('*', '')
        deleted = 0
        keys_to_delete = []
        for k in list(_memory_cache.keys()):
            if prefix_pattern.replace('floyo:', '') in str(k):
                keys_to_delete.append(k)
        for key in keys_to_delete:
            if key in _memory_cache:
                del _memory_cache[key]
                if key in _memory_cache_ttl:
                    del _memory_cache_ttl[key]
                deleted += 1
        return deleted


def cached(ttl: int = 300, key_prefix: str = ""):
    """Decorator for caching function results."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix, func.__name__]
            if args:
                key_parts.append(str(hash(str(args))))
            if kwargs:
                key_parts.append(str(hash(str(sorted(kwargs.items())))))
            cache_key = ":".join(filter(None, key_parts))
            
            # Check cache
            cached_value = get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            set(cache_key, result, ttl)
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix, func.__name__]
            if args:
                key_parts.append(str(hash(str(args))))
            if kwargs:
                key_parts.append(str(hash(str(sorted(kwargs.items())))))
            cache_key = ":".join(filter(None, key_parts))
            
            # Check cache
            cached_value = get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            set(cache_key, result, ttl)
            return result
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator
