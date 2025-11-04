"""Rate limiting middleware for FastAPI."""

from typing import Callable
from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from backend.config import settings

logger = logging.getLogger(__name__)

# Try to use Redis for rate limiting if available, fallback to memory
_storage_uri = None
if settings.redis_url:
    try:
        # Test Redis connection
        import redis
        redis_test = redis.from_url(settings.redis_url)
        redis_test.ping()
        _storage_uri = settings.redis_url
        logger.info(f"Using Redis-backed rate limiting: {settings.redis_url}")
    except Exception as e:
        logger.warning(f"Redis unavailable for rate limiting, using in-memory storage: {e}")
        _storage_uri = None
else:
    logger.info("Redis URL not configured, using in-memory rate limiting (not recommended for production)")

# Initialize limiter with Redis storage if available, otherwise in-memory
if _storage_uri:
    limiter = Limiter(key_func=get_remote_address, storage_uri=_storage_uri)
else:
    limiter = Limiter(key_func=get_remote_address)

# Rate limit configuration
RATE_LIMIT_PER_MINUTE = settings.rate_limit_per_minute
RATE_LIMIT_PER_HOUR = settings.rate_limit_per_hour

# Endpoint-specific rate limits (more restrictive for sensitive operations)
RATE_LIMITS = {
    "auth": {
        "login": "5/minute",
        "register": "3/hour",
        "password_reset": "3/hour",
        "forgot_password": "5/hour",
        "change_password": "5/hour",
        "refresh_token": "30/minute",
    },
    "security": {
        "2fa_setup": "5/hour",
        "2fa_verify": "10/hour",
        "2fa_disable": "3/hour",
    },
    "admin": {
        "data_retention": "1/hour",
        "user_management": "10/hour",
    },
    "default": {
        "per_minute": f"{RATE_LIMIT_PER_MINUTE}/minute",
        "per_hour": f"{RATE_LIMIT_PER_HOUR}/hour",
    }
}

def get_rate_limit_exceeded_handler():
    """Get rate limit exceeded exception handler."""
    @_rate_limit_exceeded_handler
    def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        """Handle rate limit exceeded exceptions."""
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {exc.detail}",
            headers={"Retry-After": str(exc.retry_after) if exc.retry_after else "60"}
        )
    return rate_limit_handler
