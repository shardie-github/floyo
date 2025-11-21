"""
Enhanced error handling helpers with user-friendly messages and error tracking.

Provides utilities for consistent error handling across the application.
"""

from typing import Dict, Any, Optional
from backend.error_handling import APIError, ValidationError, NotFoundError
from backend.logging_helpers import log_event
import logging

logger = logging.getLogger(__name__)

# User-friendly error messages
USER_FRIENDLY_MESSAGES = {
    "VALIDATION_ERROR": "Please check your input and try again.",
    "AUTHENTICATION_ERROR": "Please log in to continue.",
    "AUTHORIZATION_ERROR": "You don't have permission to perform this action.",
    "NOT_FOUND": "The requested resource was not found.",
    "RATE_LIMIT_EXCEEDED": "Too many requests. Please try again later.",
    "INTERNAL_ERROR": "Something went wrong. We've been notified and are working on it.",
    "DATABASE_ERROR": "Database error. Please try again later.",
    "EXTERNAL_API_ERROR": "External service error. Please try again later.",
}


def get_user_friendly_message(error_code: str, technical_message: str = None) -> str:
    """
    Get user-friendly error message for an error code.
    
    Args:
        error_code: Machine-readable error code
        technical_message: Technical error message (for logging)
        
    Returns:
        str: User-friendly error message
    """
    friendly = USER_FRIENDLY_MESSAGES.get(error_code, "An error occurred. Please try again.")
    
    # In development, include technical message
    import os
    if os.getenv("ENVIRONMENT") == "development" and technical_message:
        return f"{friendly} (Technical: {technical_message})"
    
    return friendly


def handle_error_with_logging(
    error: Exception,
    context: str = "",
    user_id: Optional[str] = None,
    include_traceback: bool = False
) -> Dict[str, Any]:
    """
    Handle error with logging and return user-friendly response.
    
    Args:
        error: Exception to handle
        context: Additional context about where error occurred
        user_id: User ID (if applicable)
        include_traceback: Whether to include traceback (dev only)
        
    Returns:
        Dict[str, Any]: Formatted error response
    """
    from backend.error_handling import format_error_response
    from backend.config import settings
    
    # Log error
    log_event(
        event_type="error.occurred",
        level="ERROR",
        user_id=user_id,
        details={
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context
        }
    )
    
    # Format error response
    response, status_code = format_error_response(
        error,
        include_traceback=include_traceback or settings.environment != "production"
    )
    
    # Add user-friendly message
    if "error" in response and "code" in response["error"]:
        error_code = response["error"]["code"]
        technical_message = response["error"].get("message", "")
        response["error"]["user_message"] = get_user_friendly_message(
            error_code,
            technical_message
        )
    
    return response


def safe_execute_with_error_handling(
    func,
    *args,
    context: str = "",
    user_id: Optional[str] = None,
    default_return: Any = None,
    **kwargs
) -> Any:
    """
    Safely execute a function with comprehensive error handling.
    
    Args:
        func: Function to execute
        *args: Positional arguments
        context: Context for error logging
        user_id: User ID (if applicable)
        default_return: Value to return on error
        **kwargs: Keyword arguments
        
    Returns:
        Any: Function result or default_return on error
    """
    try:
        return func(*args, **kwargs)
    except APIError:
        # Re-raise API errors as-is (they're already formatted)
        raise
    except Exception as e:
        # Log and handle unexpected errors
        handle_error_with_logging(e, context=context, user_id=user_id)
        if default_return is not None:
            return default_return
        raise


def validate_and_handle_errors(
    validator_func,
    value: Any,
    error_message: str = "Validation failed"
) -> Any:
    """
    Validate a value and handle validation errors gracefully.
    
    Args:
        validator_func: Validation function that raises ValidationError on failure
        value: Value to validate
        error_message: Error message if validation fails
        
    Returns:
        Any: Validated value
        
    Raises:
        ValidationError: If validation fails
    """
    try:
        return validator_func(value)
    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Validation error: {e}", exc_info=True)
        raise ValidationError(error_message) from e
