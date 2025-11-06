"""
CSRF (Cross-Site Request Forgery) protection middleware.

Implements Double Submit Cookie pattern for CSRF protection:
- Server generates CSRF token and sets it as HttpOnly cookie
- Client includes token in request header
- Server validates token matches cookie value
"""

import secrets
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

# CSRF token cookie name
CSRF_TOKEN_COOKIE_NAME = "XSRF-TOKEN"
CSRF_TOKEN_HEADER_NAME = "X-XSRF-TOKEN"

# Exempted methods (GET, HEAD, OPTIONS typically don't need CSRF protection)
EXEMPT_METHODS = {"GET", "HEAD", "OPTIONS"}

# Paths exempted from CSRF protection (e.g., webhooks, public APIs)
EXEMPT_PATHS = {
    "/api/v1/webhooks/",  # Webhook endpoints
    "/docs",  # API documentation
    "/openapi.json",  # OpenAPI schema
    "/health",  # Health check endpoints
}


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware using Double Submit Cookie pattern.
    
    This middleware:
    1. Generates CSRF token on first request
    2. Sets token as HttpOnly cookie
    3. Validates token in header matches cookie for state-changing requests
    4. Exempts safe methods (GET, HEAD, OPTIONS) and configured paths
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request with CSRF protection.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/handler
            
        Returns:
            Response: HTTP response with CSRF protection applied
        """
        # Check if path is exempted
        if any(request.url.path.startswith(path) for path in EXEMPT_PATHS):
            return await call_next(request)
        
        # Check if method is exempted
        if request.method in EXEMPT_METHODS:
            return await call_next(request)
        
        # Get CSRF token from cookie
        csrf_token_cookie = request.cookies.get(CSRF_TOKEN_COOKIE_NAME)
        
        # Get CSRF token from header
        csrf_token_header = request.headers.get(CSRF_TOKEN_HEADER_NAME)
        
        # For state-changing requests, validate CSRF token
        if request.method not in EXEMPT_METHODS:
            if not csrf_token_cookie:
                logger.warning(
                    f"CSRF token cookie missing for {request.method} {request.url.path}",
                    extra={"ip": request.client.host if request.client else None}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token missing. Please refresh the page and try again."
                )
            
            if not csrf_token_header:
                logger.warning(
                    f"CSRF token header missing for {request.method} {request.url.path}",
                    extra={"ip": request.client.host if request.client else None}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token header missing. Please include X-XSRF-TOKEN header."
                )
            
            # Validate tokens match (Double Submit Cookie pattern)
            if csrf_token_cookie != csrf_token_header:
                logger.warning(
                    f"CSRF token mismatch for {request.method} {request.url.path}",
                    extra={"ip": request.client.host if request.client else None}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token validation failed. Tokens do not match."
                )
        
        # Process request
        response = await call_next(request)
        
        # Generate and set CSRF token if not present
        if not csrf_token_cookie:
            csrf_token = secrets.token_urlsafe(32)
            response.set_cookie(
                key=CSRF_TOKEN_COOKIE_NAME,
                value=csrf_token,
                httponly=True,  # HttpOnly prevents JavaScript access
                secure=True,  # Only send over HTTPS in production
                samesite="strict",  # Strict SameSite prevents cross-site requests
                max_age=86400,  # 24 hours
                path="/",
            )
        
        return response


def get_csrf_token(request: Request) -> Optional[str]:
    """
    Get CSRF token from request cookie.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Optional[str]: CSRF token if present, None otherwise
    """
    return request.cookies.get(CSRF_TOKEN_COOKIE_NAME)


def validate_csrf_token(request: Request) -> bool:
    """
    Validate CSRF token for current request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        bool: True if token is valid, False otherwise
    """
    # Exempt safe methods
    if request.method in EXEMPT_METHODS:
        return True
    
    # Exempt configured paths
    if any(request.url.path.startswith(path) for path in EXEMPT_PATHS):
        return True
    
    csrf_token_cookie = request.cookies.get(CSRF_TOKEN_COOKIE_NAME)
    csrf_token_header = request.headers.get(CSRF_TOKEN_HEADER_NAME)
    
    if not csrf_token_cookie or not csrf_token_header:
        return False
    
    return csrf_token_cookie == csrf_token_header
