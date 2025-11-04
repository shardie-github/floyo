"""Guardian middleware for FastAPI."""

import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from .service import get_guardian_service
from .events import GuardianEvent, DataScope, DataClass
import logging

logger = logging.getLogger(__name__)


class GuardianMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor API requests and responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through Guardian monitoring."""
        guardian = get_guardian_service()
        
        # Skip guardian for certain paths
        skip_paths = [
            "/health",
            "/metrics",
            "/api/guardian",  # Avoid recursion
        ]
        
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Extract user ID from request
        user_id = None
        if hasattr(request.state, "user"):
            user_id = str(request.state.user.id) if hasattr(request.state.user, "id") else None
        
        # Determine data scope
        scope = DataScope.API
        if request.url.path.startswith("/api/external"):
            scope = DataScope.EXTERNAL
        elif request.url.path.startswith("/api/"):
            scope = DataScope.API
        else:
            scope = DataScope.APP
        
        # Monitor request
        start_time = time.time()
        
        try:
            # Emit event for API call
            event = guardian.emit_event(
                event_type="api_call",
                scope=scope,
                data_class=DataClass.TELEMETRY,
                description=f"{request.method} {request.url.path}",
                data_touched={
                    "method": request.method,
                    "path": request.url.path,
                    "headers": dict(request.headers),
                },
                purpose="API request monitoring",
                user_id=user_id,
                source="guardian_middleware",
            )
            
            # Check if blocked
            if event.guardian_action.value == "block":
                logger.warning(f"Guardian blocked request: {request.url.path}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "Request blocked by Privacy Guardian",
                        "reason": event.action_reason,
                    }
                )
            
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Monitor response (if not blocked)
            guardian.emit_event(
                event_type="api_response",
                scope=scope,
                data_class=DataClass.TELEMETRY,
                description=f"Response for {request.method} {request.url.path}",
                data_touched={
                    "status_code": response.status_code,
                    "duration_ms": duration * 1000,
                },
                purpose="API response monitoring",
                user_id=user_id,
                source="guardian_middleware",
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Guardian middleware error: {e}")
            # Still allow request to proceed
            return await call_next(request)
