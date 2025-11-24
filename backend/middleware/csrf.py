"""
CSRF Protection Middleware
Enhanced CSRF protection with token validation.
"""

import secrets
from typing import Callable
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from backend.logging_config import get_logger

logger = get_logger(__name__)

CSRF_TOKEN_COOKIE_NAME = "XSRF-TOKEN"
CSRF_TOKEN_HEADER_NAME = "X-XSRF-TOKEN"

# Safe HTTP methods that don't require CSRF protection
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """CSRF protection middleware using Double Submit Cookie pattern."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Skip CSRF check for safe methods
        if request.method in SAFE_METHODS:
            return await call_next(request)
        
        # Skip CSRF check for API routes that use token auth (not cookie-based)
        if request.url.path.startswith('/api/') and request.headers.get('authorization'):
            return await call_next(request)
        
        # Get CSRF token from cookie
        csrf_cookie = request.cookies.get(CSRF_TOKEN_COOKIE_NAME)
        
        # Get CSRF token from header
        csrf_header = request.headers.get(CSRF_TOKEN_HEADER_NAME)
        
        # Validate tokens match
        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            logger.warning(
                f"CSRF validation failed: path={request.url.path}, "
                f"cookie_present={bool(csrf_cookie)}, header_present={bool(csrf_header)}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "CSRF token validation failed"}
            )
        
        response = await call_next(request)
        
        # Set CSRF token cookie if not present
        if CSRF_TOKEN_COOKIE_NAME not in request.cookies:
            token = secrets.token_urlsafe(32)
            response.set_cookie(
                CSRF_TOKEN_COOKIE_NAME,
                token,
                httponly=False,  # Must be accessible to JavaScript
                secure=True,  # HTTPS only in production
                samesite='strict',
                max_age=86400  # 24 hours
            )
        
        return response
