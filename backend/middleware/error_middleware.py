"""
Error handling middleware for FastAPI.

Provides centralized error handling and standardized error responses.
"""

from typing import Callable
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.error_handling import format_error_response, APIError
from backend.logging_config import get_logger

logger = get_logger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling errors and standardizing error responses.
    
    Catches exceptions, formats them consistently, and logs them appropriately.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        """
        Process request and handle any errors.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/route handler
            
        Returns:
            JSONResponse: Standardized error response or normal response
        """
        try:
            response = await call_next(request)
            return response
        except APIError as e:
            # Handle API errors (already formatted)
            logger.warning(
                f"API error: {e.error_code} - {e.message}",
                extra={"error_code": e.error_code, "status_code": e.status_code}
            )
            response, status_code = format_error_response(e, include_traceback=False)
            return JSONResponse(status_code=status_code, content=response)
        except Exception as e:
            # Handle unexpected errors
            logger.error(
                f"Unexpected error in {request.url.path}: {e}",
                exc_info=True,
                extra={"path": request.url.path, "method": request.method}
            )
            response, status_code = format_error_response(e, include_traceback=False)
            return JSONResponse(status_code=status_code, content=response)
