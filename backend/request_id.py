"""
Request ID middleware for request tracing and correlation.

Adds a unique request ID to each request for tracing across services.
"""

import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

# Request ID header name
REQUEST_ID_HEADER = "X-Request-ID"


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds a unique request ID to each request.
    
    The request ID is:
    - Added to response headers
    - Included in log messages
    - Available in request.state for use in endpoints
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request and add request ID.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/handler
            
        Returns:
            Response: HTTP response with request ID header
        """
        # Get request ID from header or generate new one
        request_id = request.headers.get(REQUEST_ID_HEADER)
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Store in request state for use in endpoints
        request.state.request_id = request_id
        
        # Add to logger context
        old_factory = logging.getLogRecordFactory()
        
        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = request_id
            return record
        
        logging.setLogRecordFactory(record_factory)
        
        try:
            # Process request
            response = await call_next(request)
            
            # Add request ID to response headers
            response.headers[REQUEST_ID_HEADER] = request_id
            
            return response
        finally:
            # Restore original logger factory
            logging.setLogRecordFactory(old_factory)


def get_request_id(request: Request) -> str:
    """
    Get request ID from request state.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Request ID if available, empty string otherwise
    """
    return getattr(request.state, "request_id", "")
