"""
API Response Standardization Middleware.

Standardizes all API responses with consistent structure including:
- Request ID
- Timestamp
- API version
- Metadata
- Consistent error format
"""

from typing import Any, Dict, Optional
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
import json
import time
from backend.config import settings
from backend.request_id import get_request_id


class APIResponseMiddleware(BaseHTTPMiddleware):
    """
    Middleware that standardizes all API responses.
    
    Adds consistent structure to all responses:
    - request_id: Unique request identifier
    - timestamp: Response timestamp
    - api_version: API version
    - data: Response data (for success responses)
    - error: Error information (for error responses)
    - metadata: Additional metadata
    """
    
    # Paths that should not be standardized (e.g., health checks, docs)
    EXEMPT_PATHS = {
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        "/health/liveness",
        "/health/readiness",
        "/health/detailed",
        "/health/migrations",
    }
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request and standardize response.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/handler
            
        Returns:
            Response: Standardized HTTP response
        """
        # Skip standardization for exempt paths
        if any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS):
            return await call_next(request)
        
        # Only standardize API endpoints
        if not request.url.path.startswith("/api"):
            return await call_next(request)
        
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Get request ID
        request_id = get_request_id(request)
        
        # Standardize JSON responses
        if isinstance(response, JSONResponse):
            try:
                # Parse existing response body
                body = json.loads(response.body.decode())
                
                # Check if already standardized (has request_id)
                if isinstance(body, dict) and "request_id" in body:
                    # Already standardized, just add response time
                    body["metadata"] = body.get("metadata", {})
                    body["metadata"]["response_time_ms"] = round(response_time_ms, 2)
                    return JSONResponse(
                        content=body,
                        status_code=response.status_code,
                        headers=dict(response.headers)
                    )
                
                # Standardize response
                standardized = self._standardize_response(
                    body,
                    request_id=request_id,
                    status_code=response.status_code,
                    response_time_ms=response_time_ms
                )
                
                return JSONResponse(
                    content=standardized,
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            except (json.JSONDecodeError, AttributeError):
                # Not JSON or can't parse, return as-is
                return response
        
        # For non-JSON responses, add headers
        if not isinstance(response, StreamingResponse):
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{response_time_ms:.2f}ms"
            response.headers["X-API-Version"] = "v1"
        
        return response
    
    def _standardize_response(
        self,
        body: Any,
        request_id: str,
        status_code: int,
        response_time_ms: float
    ) -> Dict[str, Any]:
        """
        Standardize response body.
        
        Args:
            body: Original response body
            request_id: Request ID
            status_code: HTTP status code
            response_time_ms: Response time in milliseconds
            
        Returns:
            Dict[str, Any]: Standardized response
        """
        from datetime import datetime
        
        # Check if it's an error response
        is_error = status_code >= 400
        
        standardized = {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "api_version": "v1",
            "metadata": {
                "response_time_ms": round(response_time_ms, 2),
                "environment": settings.environment,
            }
        }
        
        if is_error:
            # Error response structure
            if isinstance(body, dict) and "error" in body:
                standardized["error"] = body["error"]
            else:
                standardized["error"] = {
                    "code": "UNKNOWN_ERROR",
                    "message": str(body) if not isinstance(body, dict) else body.get("detail", "An error occurred"),
                    "details": body if isinstance(body, dict) else {}
                }
        else:
            # Success response structure
            if isinstance(body, dict):
                # If body has pagination info, preserve it
                if "items" in body and "total" in body:
                    standardized["data"] = body.get("items", [])
                    standardized["pagination"] = {
                        "total": body.get("total", 0),
                        "skip": body.get("skip", 0),
                        "limit": body.get("limit", 20),
                        "has_more": body.get("has_more", False),
                    }
                else:
                    standardized["data"] = body
            else:
                standardized["data"] = body
        
        return standardized


def create_standard_response(
    data: Any,
    request: Request,
    status_code: int = 200,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized response dictionary.
    
    Args:
        data: Response data
        request: FastAPI request object
        status_code: HTTP status code
        metadata: Additional metadata
        
    Returns:
        Dict[str, Any]: Standardized response dictionary
    """
    from datetime import datetime
    
    request_id = get_request_id(request)
    
    response = {
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat(),
        "api_version": "v1",
        "data": data,
        "metadata": metadata or {}
    }
    
    return response


def create_paginated_response(
    items: list,
    total: int,
    skip: int,
    limit: int,
    request: Request,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized paginated response.
    
    Args:
        items: List of items
        total: Total number of items
        skip: Number of items skipped
        limit: Number of items per page
        request: FastAPI request object
        metadata: Additional metadata
        
    Returns:
        Dict[str, Any]: Standardized paginated response
    """
    response = create_standard_response(
        data=items,
        request=request,
        metadata=metadata
    )
    
    response["pagination"] = {
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total,
    }
    
    return response
