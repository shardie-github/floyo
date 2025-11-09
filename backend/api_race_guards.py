"""
API Race Condition Guards
Apply concurrency guards to API endpoints
"""

from functools import wraps
from fastapi import HTTPException, status
from backend.concurrency_guards import (
    with_lock,
    dedupe_requests,
    prevent_concurrent_execution,
    request_deduplicator,
)


def protect_user_resource(user_id: str):
    """
    Decorator to protect user-specific resources from race conditions.
    
    Usage:
        @protect_user_resource(user_id="user_id")
        async def update_user_profile(user_id: str, ...):
            pass
    """
    return with_lock(f"user:{user_id}")


def protect_global_resource(resource_name: str):
    """
    Decorator to protect global resources (like configuration) from race conditions.
    """
    return with_lock(f"global:{resource_name}")


def dedupe_by_user_id(func):
    """
    Deduplicate requests based on user_id parameter.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract user_id from args or kwargs
        user_id = kwargs.get('user_id') or (args[0] if args else None)
        if not user_id:
            return await func(*args, **kwargs)
        
        key = f"{func.__name__}:user:{user_id}"
        
        async def call_func():
            return await func(*args, **kwargs)
        
        return await request_deduplicator.dedupe(key, call_func)
    return wrapper


def prevent_concurrent_mutations(func):
    """
    Prevent concurrent mutations to the same resource.
    Useful for create/update/delete operations.
    """
    return prevent_concurrent_execution(func)


# Example usage in route handlers:
# 
# @router.post("/users/{user_id}/profile")
# @protect_user_resource(user_id="user_id")
# @dedupe_by_user_id
# async def update_profile(user_id: str, profile_data: ProfileUpdate):
#     # Only one update per user can run at a time
#     # Duplicate requests are deduplicated
#     pass
