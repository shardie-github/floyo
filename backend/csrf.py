"""CSRF protection middleware for FastAPI."""

import secrets
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time

# In-memory CSRF token storage (use Redis in production)
_csrf_tokens: dict[str, tuple[str, float]] = {}
CSRF_TOKEN_EXPIRY = 3600  # 1 hour


def generate_csrf_token() -> str:
    """Generate a secure CSRF token."""
    return secrets.token_urlsafe(32)


def validate_csrf_token(token: str, session_id: str) -> bool:
    """Validate CSRF token for a session."""
    if session_id not in _csrf_tokens:
        return False
    
    stored_token, expiry = _csrf_tokens[session_id]
    if time.time() > expiry:
        del _csrf_tokens[session_id]
        return False
    
    return secrets.compare_digest(stored_token, token)


def store_csrf_token(session_id: str, token: str):
    """Store CSRF token for a session."""
    _csrf_tokens[session_id] = (token, time.time() + CSRF_TOKEN_EXPIRY)


class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection middleware."""
    
    # Methods that require CSRF protection
    PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
    
    # Endpoints excluded from CSRF protection (API endpoints use JWT)
    EXCLUDED_PATHS = {"/api/auth/login", "/api/auth/register", "/api/auth/refresh"}
    
    async def dispatch(self, request: Request, call_next):
        """Check CSRF token for state-changing requests."""
        # Skip CSRF for excluded paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)
        
        # Skip CSRF for non-protected methods
        if request.method not in self.PROTECTED_METHODS:
            return await call_next(request)
        
        # Skip CSRF for API endpoints using JWT (they have Authorization header)
        # In a real app, you might want more granular control
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # JWT-protected endpoint, skip CSRF
            return await call_next(request)
        
        # For form submissions, check CSRF token
        csrf_token = None
        content_type = request.headers.get("content-type", "")
        
        if "application/json" in content_type:
            # Try to get from header first
            csrf_token = request.headers.get("X-CSRF-Token")
            
            # Fallback: try to get from request body (not ideal, but some clients send it)
            # In production, always use header
            if not csrf_token:
                try:
                    body = await request.body()
                    # Note: This consumes the body, so we'd need to restore it
                    # For now, we'll just check the header
                except Exception:
                    pass
        
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            csrf_token = request.headers.get("X-CSRF-Token")
        
        # Get session ID from cookie or header
        session_id = request.cookies.get("session_id") or request.headers.get("X-Session-Id")
        
        if not session_id or not csrf_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing"
            )
        
        if not validate_csrf_token(csrf_token, session_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token"
            )
        
        response = await call_next(request)
        return response
