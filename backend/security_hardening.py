"""
Security Hardening Utilities

Additional security measures beyond basic authentication and authorization.
"""

from fastapi import Request, HTTPException, status
from typing import Optional
import re
import hashlib
import hmac
import time
from functools import wraps

# Rate limiting storage (in production, use Redis)
_rate_limit_store: dict = {}


def validate_input_sanitization(input_str: str, max_length: int = 1000) -> str:
    """
    Sanitize and validate user input.
    """
    if len(input_str) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Input exceeds maximum length of {max_length}"
        )
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', input_str)
    
    # Check for SQL injection patterns
    sql_patterns = [
        r'(\bOR\b|\bAND\b).*=\s*\d+',
        r'(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b)',
        r'(\bDROP\b|\bCREATE\b|\bALTER\b)',
        r'--',
        r'/\*',
        r'\*/',
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, input_str, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid input detected"
            )
    
    return sanitized


def validate_email(email: str) -> bool:
    """
    Validate email format.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_url(url: str) -> bool:
    """
    Validate URL format.
    """
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    return bool(re.match(pattern, url))


def rate_limit_by_ip(
    max_requests: int = 100,
    window_seconds: int = 60,
    identifier: Optional[str] = None
):
    """
    Rate limit decorator based on IP address or custom identifier.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Get identifier (IP address or custom)
            if identifier:
                key = identifier
            else:
                # Get client IP
                client_ip = request.client.host if request.client else "unknown"
                # Check for proxy headers
                forwarded_for = request.headers.get("X-Forwarded-For")
                if forwarded_for:
                    client_ip = forwarded_for.split(",")[0].strip()
                
                key = f"rate_limit:{client_ip}"
            
            # Check rate limit
            now = time.time()
            if key in _rate_limit_store:
                requests, window_start = _rate_limit_store[key]
                
                # Reset window if expired
                if now - window_start > window_seconds:
                    _rate_limit_store[key] = ([], now)
                    requests = []
                else:
                    # Remove old requests outside window
                    requests = [r for r in requests if now - r < window_seconds]
            else:
                requests = []
                window_start = now
                _rate_limit_store[key] = (requests, window_start)
            
            # Check if limit exceeded
            if len(requests) >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds."
                )
            
            # Add current request
            requests.append(now)
            _rate_limit_store[key] = (requests, window_start)
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def validate_hmac_signature(
    payload: bytes,
    signature: str,
    secret: str,
    algorithm: str = "sha256"
) -> bool:
    """
    Validate HMAC signature for webhook security.
    """
    if algorithm == "sha256":
        expected_signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
    elif algorithm == "sha1":
        expected_signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha1
        ).hexdigest()
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    return hmac.compare_digest(expected_signature, signature)


def validate_csrf_token(request: Request, token: str) -> bool:
    """
    Validate CSRF token.
    """
    # Get token from header or form data
    header_token = request.headers.get("X-CSRF-Token")
    if header_token:
        return hmac.compare_digest(header_token, token)
    
    return False


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.
    """
    # Remove path components
    filename = filename.replace("..", "").replace("/", "").replace("\\", "")
    
    # Remove dangerous characters
    filename = re.sub(r'[<>:"|?*]', '', filename)
    
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    
    return filename


def validate_file_upload(
    filename: str,
    content_type: str,
    max_size: int = 10 * 1024 * 1024,  # 10MB default
    allowed_extensions: Optional[list] = None,
    allowed_types: Optional[list] = None
) -> bool:
    """
    Validate file upload.
    """
    if allowed_extensions:
        ext = filename.split(".")[-1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension .{ext} not allowed"
            )
    
    if allowed_types and content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content type {content_type} not allowed"
        )
    
    return True


def generate_secure_token(length: int = 32) -> str:
    """
    Generate cryptographically secure random token.
    """
    import secrets
    return secrets.token_urlsafe(length)


def hash_sensitive_data(data: str, salt: Optional[str] = None) -> str:
    """
    Hash sensitive data with optional salt.
    """
    if salt:
        data = f"{data}{salt}"
    
    return hashlib.sha256(data.encode()).hexdigest()
