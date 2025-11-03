"""Rate limiting middleware for FastAPI."""

from typing import Callable
from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

# Initialize limiter
limiter = Limiter(key_func=get_remote_address)

# Rate limit configuration
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
RATE_LIMIT_PER_HOUR = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))

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
