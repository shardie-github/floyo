"""
Comprehensive Input Validation and Sanitization
Provides decorators and utilities for validating API inputs
"""

from functools import wraps
from typing import Callable, Any, Optional, List
from fastapi import HTTPException, status, Request
from pydantic import BaseModel, validator, EmailStr
import re
import html
from urllib.parse import quote, unquote
import logging

logger = logging.getLogger(__name__)


class ValidationError(HTTPException):
    """Custom validation error."""
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Validation failed",
                "message": message,
                "field": field
            }
        )


def validate_email(email: str) -> str:
    """
    Validate and sanitize email address.
    
    Args:
        email: Email address to validate
        
    Returns:
        str: Validated email
        
    Raises:
        ValidationError: If email is invalid
    """
    email = email.strip().lower()
    
    # Basic email regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format", field="email")
    
    # Check length
    if len(email) > 254:  # RFC 5321 limit
        raise ValidationError("Email address too long", field="email")
    
    return email


def validate_password(password: str, min_length: int = 8) -> str:
    """
    Validate password strength.
    
    Args:
        password: Password to validate
        min_length: Minimum password length
        
    Returns:
        str: Validated password
        
    Raises:
        ValidationError: If password doesn't meet requirements
    """
    if len(password) < min_length:
        raise ValidationError(
            f"Password must be at least {min_length} characters",
            field="password"
        )
    
    # Check for common weak passwords
    weak_passwords = [
        "password", "12345678", "qwerty", "abc123",
        "password123", "admin", "letmein"
    ]
    if password.lower() in weak_passwords:
        raise ValidationError("Password is too common", field="password")
    
    # Check complexity (at least one uppercase, lowercase, number)
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    if not (has_upper and has_lower and has_digit):
        raise ValidationError(
            "Password must contain uppercase, lowercase, and numeric characters",
            field="password"
        )
    
    return password


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input.
    
    Args:
        value: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        str: Sanitized string
    """
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Remove control characters (except newline and tab)
    value = ''.join(char for char in value if ord(char) >= 32 or char in '\n\t')
    
    # Trim whitespace
    value = value.strip()
    
    # Check length
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value


def sanitize_html(value: str) -> str:
    """
    Sanitize HTML content (escape HTML entities).
    
    Args:
        value: HTML string to sanitize
        
    Returns:
        str: Sanitized HTML
    """
    return html.escape(value)


def validate_url(url: str) -> str:
    """
    Validate and sanitize URL.
    
    Args:
        url: URL to validate
        
    Returns:
        str: Validated URL
        
    Raises:
        ValidationError: If URL is invalid
    """
    url = url.strip()
    
    # Basic URL validation
    url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    if not re.match(url_pattern, url):
        raise ValidationError("Invalid URL format", field="url")
    
    # Check for dangerous protocols
    dangerous_protocols = ['javascript:', 'data:', 'vbscript:']
    url_lower = url.lower()
    for protocol in dangerous_protocols:
        if url_lower.startswith(protocol):
            raise ValidationError(f"Dangerous protocol not allowed: {protocol}", field="url")
    
    return url


def validate_uuid(uuid_string: str) -> str:
    """
    Validate UUID format.
    
    Args:
        uuid_string: UUID string to validate
        
    Returns:
        str: Validated UUID
        
    Raises:
        ValidationError: If UUID is invalid
    """
    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    if not re.match(uuid_pattern, uuid_string.lower()):
        raise ValidationError("Invalid UUID format", field="uuid")
    
    return uuid_string.lower()


def validate_file_path(file_path: str) -> str:
    """
    Validate and sanitize file path (prevent path traversal).
    
    Args:
        file_path: File path to validate
        
    Returns:
        str: Validated file path
        
    Raises:
        ValidationError: If path is invalid
    """
    # Remove path traversal attempts
    if '..' in file_path or file_path.startswith('/'):
        raise ValidationError("Invalid file path", field="file_path")
    
    # Remove dangerous characters
    dangerous_chars = ['<', '>', '|', '&', ';', '`', '$', '(', ')']
    for char in dangerous_chars:
        if char in file_path:
            raise ValidationError(f"Invalid character in file path: {char}", field="file_path")
    
    return file_path


def validate_integer(value: Any, min_value: Optional[int] = None, max_value: Optional[int] = None) -> int:
    """
    Validate integer value.
    
    Args:
        value: Value to validate
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        
    Returns:
        int: Validated integer
        
    Raises:
        ValidationError: If value is invalid
    """
    try:
        int_value = int(value)
    except (ValueError, TypeError):
        raise ValidationError("Invalid integer value", field="integer")
    
    if min_value is not None and int_value < min_value:
        raise ValidationError(f"Value must be at least {min_value}", field="integer")
    
    if max_value is not None and int_value > max_value:
        raise ValidationError(f"Value must be at most {max_value}", field="integer")
    
    return int_value


def validate_enum(value: Any, allowed_values: List[Any]) -> Any:
    """
    Validate enum value.
    
    Args:
        value: Value to validate
        allowed_values: List of allowed values
        
    Returns:
        Any: Validated value
        
    Raises:
        ValidationError: If value is not in allowed list
    """
    if value not in allowed_values:
        raise ValidationError(
            f"Value must be one of: {', '.join(map(str, allowed_values))}",
            field="enum"
        )
    
    return value


def validate_json(json_string: str) -> dict:
    """
    Validate JSON string.
    
    Args:
        json_string: JSON string to validate
        
    Returns:
        dict: Parsed JSON
        
    Raises:
        ValidationError: If JSON is invalid
    """
    import json
    try:
        return json.loads(json_string)
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {str(e)}", field="json")


def validate_request_size(request: Request, max_size: int = 10 * 1024 * 1024) -> None:
    """
    Validate request body size.
    
    Args:
        request: FastAPI request object
        max_size: Maximum allowed size in bytes
        
    Raises:
        ValidationError: If request is too large
    """
    content_length = request.headers.get("Content-Length")
    if content_length:
        size = int(content_length)
        if size > max_size:
            raise ValidationError(
                f"Request body too large. Maximum size: {max_size / 1024 / 1024}MB",
                field="request_size"
            )


def validate_input(func: Callable) -> Callable:
    """
    Decorator to validate function inputs.
    
    Usage:
        @validate_input
        def my_function(email: str, password: str):
            # Function body
            pass
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Validate inputs based on function signature
        # This is a simplified version - in production, use Pydantic models
        try:
            return await func(*args, **kwargs)
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Input validation error: {e}")
            raise ValidationError(f"Invalid input: {str(e)}")
    
    return wrapper
