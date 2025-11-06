"""
Error handling utilities for consistent API error responses.

Provides standardized error handling, logging, and response formatting
across all API endpoints.
"""

from typing import Optional, Dict, Any, Union
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
import logging
import traceback
from uuid import UUID

logger = logging.getLogger(__name__)


class APIError(Exception):
    """
    Base exception class for API errors.
    
    Provides consistent error structure with status code, error code, and message.
    """
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize API error.
        
        Args:
            message: Human-readable error message
            status_code: HTTP status code
            error_code: Machine-readable error code
            details: Additional error details
        """
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(APIError):
    """Validation error (400 Bad Request)."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            details=details
        )


class AuthenticationError(APIError):
    """Authentication error (401 Unauthorized)."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(APIError):
    """Authorization error (403 Forbidden)."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR"
        )


class NotFoundError(APIError):
    """Resource not found error (404 Not Found)."""
    
    def __init__(self, resource_type: str, resource_id: Optional[Union[str, UUID]] = None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f": {resource_id}"
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details={"resource_type": resource_type, "resource_id": str(resource_id) if resource_id else None}
        )


class ConflictError(APIError):
    """Resource conflict error (409 Conflict)."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT",
            details=details
        )


class RateLimitError(APIError):
    """Rate limit exceeded error (429 Too Many Requests)."""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after_seconds"] = retry_after
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details
        )


class InternalServerError(APIError):
    """Internal server error (500 Internal Server Error)."""
    
    def __init__(self, message: str = "An internal error occurred", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_ERROR",
            details=details
        )


def format_error_response(
    error: Union[APIError, Exception],
    include_traceback: bool = False
) -> Dict[str, Any]:
    """
    Format error as standardized API response.
    
    Args:
        error: Exception to format
        include_traceback: If True, include traceback in response (dev only)
        
    Returns:
        Dict[str, Any]: Formatted error response
    """
    from backend.config import settings
    
    if isinstance(error, APIError):
        response = {
            "error": {
                "code": error.error_code,
                "message": error.message,
                "details": error.details,
            }
        }
        status_code = error.status_code
    elif isinstance(error, HTTPException):
        response = {
            "error": {
                "code": "HTTP_ERROR",
                "message": error.detail if isinstance(error.detail, str) else str(error.detail),
                "details": error.detail if isinstance(error.detail, dict) else {},
            }
        }
        status_code = error.status_code
    else:
        # Unexpected error - log it
        logger.error(f"Unexpected error: {error}", exc_info=True)
        response = {
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
            }
        }
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Include traceback in development
        if include_traceback or settings.environment != "production":
            response["error"]["details"]["traceback"] = traceback.format_exc()
    
    return response, status_code


async def error_handler(request, exc):
    """
    Global error handler for FastAPI.
    
    Args:
        request: FastAPI request object
        exc: Exception that was raised
        
    Returns:
        JSONResponse: Formatted error response
    """
    from backend.config import settings
    
    include_traceback = settings.environment != "production"
    response, status_code = format_error_response(exc, include_traceback)
    
    return JSONResponse(
        status_code=status_code,
        content=response
    )


def handle_database_error(error: Exception, context: str = "") -> APIError:
    """
    Handle database errors and convert to appropriate API error.
    
    Args:
        error: Database exception
        context: Additional context about the operation
        
    Returns:
        APIError: Appropriate API error
    """
    error_str = str(error).lower()
    
    # Check for common database error patterns
    if "not found" in error_str or "does not exist" in error_str:
        return NotFoundError("Resource", details={"context": context})
    elif "duplicate" in error_str or "unique constraint" in error_str:
        return ConflictError("Resource already exists", details={"context": context})
    elif "foreign key" in error_str or "constraint" in error_str:
        return ValidationError("Invalid reference", details={"context": context})
    elif "timeout" in error_str or "connection" in error_str:
        logger.error(f"Database connection error: {error}", exc_info=True)
        return InternalServerError("Database connection error", details={"context": context})
    else:
        logger.error(f"Database error: {error}", exc_info=True)
        return InternalServerError("Database error", details={"context": context})


def handle_validation_error(error: Exception, field: Optional[str] = None) -> ValidationError:
    """
    Handle validation errors and convert to ValidationError.
    
    Args:
        error: Validation exception
        field: Field name that failed validation
        
    Returns:
        ValidationError: Formatted validation error
    """
    details = {}
    if field:
        details["field"] = field
    
    return ValidationError(
        message=str(error),
        details=details
    )


def safe_execute(
    func,
    *args,
    error_message: Optional[str] = None,
    default_return: Any = None,
    **kwargs
) -> Any:
    """
    Safely execute a function with error handling.
    
    Args:
        func: Function to execute
        *args: Positional arguments
        error_message: Custom error message
        default_return: Value to return on error
        **kwargs: Keyword arguments
        
    Returns:
        Any: Function result or default_return on error
    """
    try:
        return func(*args, **kwargs)
    except APIError:
        # Re-raise API errors as-is
        raise
    except Exception as e:
        logger.error(f"Error in safe_execute: {e}", exc_info=True)
        if error_message:
            raise InternalServerError(error_message) from e
        raise InternalServerError(f"Error executing {func.__name__}") from e
