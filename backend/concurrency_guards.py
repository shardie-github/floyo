"""
Concurrency Guards for Backend
Prevents race conditions in concurrent API calls and database operations
"""

import asyncio
from functools import wraps
from typing import Callable, Any, Optional
from contextlib import asynccontextmanager
import time
from collections import defaultdict

# Global locks for different resources
_resource_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)


def with_lock(resource_key: str):
    """
    Decorator to ensure only one coroutine executes at a time for a given resource.
    
    Usage:
        @with_lock("user:123")
        async def update_user(user_id: int):
            # Only one update_user call per user_id can run at a time
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            lock = _resource_locks[resource_key]
            async with lock:
                return await func(*args, **kwargs)
        return wrapper
    return decorator


def with_rate_limit(max_calls: int, window_seconds: int):
    """
    Rate limiting decorator to prevent too many concurrent calls.
    
    Usage:
        @with_rate_limit(max_calls=10, window_seconds=60)
        async def api_call():
            pass
    """
    calls = []
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            now = time.time()
            # Remove calls outside the window
            calls[:] = [call_time for call_time in calls if now - call_time < window_seconds]
            
            if len(calls) >= max_calls:
                raise Exception(f"Rate limit exceeded: {max_calls} calls per {window_seconds} seconds")
            
            calls.append(now)
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class RequestDeduplicator:
    """
    Prevents duplicate concurrent requests with the same key.
    """
    def __init__(self):
        self._pending: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()
    
    async def dedupe(self, key: str, coro: Callable) -> Any:
        """
        If a request with the same key is already pending, return that instead.
        """
        async with self._lock:
            if key in self._pending:
                return await self._pending[key]
            
            task = asyncio.create_task(coro())
            self._pending[key] = task
            
            try:
                result = await task
                return result
            finally:
                async with self._lock:
                    self._pending.pop(key, None)


# Global deduplicator instance
request_deduplicator = RequestDeduplicator()


def dedupe_requests(key_func: Callable = None):
    """
    Decorator to deduplicate requests based on function arguments.
    
    Usage:
        @dedupe_requests(key_func=lambda user_id: f"user:{user_id}")
        async def get_user(user_id: int):
            # Multiple calls with same user_id will share the same request
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if key_func:
                key = key_func(*args, **kwargs)
            else:
                # Default: use function name + args
                key = f"{func.__name__}:{hash((args, tuple(sorted(kwargs.items()))))}"
            
            async def call_func():
                return await func(*args, **kwargs)
            
            return await request_deduplicator.dedupe(key, call_func)
        return wrapper
    return decorator


@asynccontextmanager
async def transaction_lock(resource_id: str):
    """
    Context manager for database transaction locking.
    Ensures only one transaction per resource at a time.
    
    Usage:
        async with transaction_lock(f"user:{user_id}"):
            # Perform database operations
            pass
    """
    lock = _resource_locks[f"transaction:{resource_id}"]
    async with lock:
        yield


def prevent_concurrent_execution(func: Callable) -> Callable:
    """
    Prevents concurrent execution of the same function.
    If called while already running, waits for the first call to complete.
    
    Usage:
        @prevent_concurrent_execution
        async def expensive_operation():
            # Only one instance of this function can run at a time
            pass
    """
    lock = asyncio.Lock()
    running = False
    
    @wraps(func)
    async def wrapper(*args, **kwargs):
        nonlocal running
        
        async with lock:
            if running:
                # Wait for the current execution to complete
                while running:
                    await asyncio.sleep(0.1)
                return None  # Or raise an exception
            
            running = True
        
        try:
            return await func(*args, **kwargs)
        finally:
            running = False
    
    return wrapper
