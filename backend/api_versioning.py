"""
API Versioning utilities and deprecation warnings.

Provides version management, deprecation warnings, and version-specific routing.
"""

from typing import Optional, Dict, Any
from fastapi import Request, Header
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# API versions configuration
API_VERSIONS = {
    "v1": {
        "status": "current",
        "release_date": "2024-01-01",
        "deprecation_date": None,
        "sunset_date": None,
        "changelog_url": "https://docs.floyo.com/api/v1/changelog",
    },
    "v0": {
        "status": "deprecated",
        "release_date": "2023-01-01",
        "deprecation_date": "2024-01-01",
        "sunset_date": "2024-07-01",
        "changelog_url": "https://docs.floyo.com/api/v0/changelog",
    }
}

# Current API version
CURRENT_API_VERSION = "v1"
DEFAULT_API_VERSION = "v1"


def get_api_version(request: Request) -> str:
    """
    Extract API version from request path or header.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: API version (e.g., "v1")
    """
    # Check path for version (e.g., /api/v1/...)
    path_parts = request.url.path.split("/")
    if len(path_parts) >= 3 and path_parts[1] == "api":
        version = path_parts[2]
        if version.startswith("v") and version[1:].isdigit():
            return version
    
    # Check Accept header for version
    accept_header = request.headers.get("Accept", "")
    if "version=" in accept_header:
        # Extract version from Accept header
        for part in accept_header.split(";"):
            if "version=" in part:
                version = part.split("=")[1].strip()
                return version
    
    # Check custom header
    api_version_header = request.headers.get("X-API-Version")
    if api_version_header:
        return api_version_header
    
    return DEFAULT_API_VERSION


def check_version_deprecation(version: str) -> Optional[Dict[str, Any]]:
    """
    Check if API version is deprecated.
    
    Args:
        version: API version to check
        
    Returns:
        Optional[Dict[str, Any]]: Deprecation warning if version is deprecated, None otherwise
    """
    version_info = API_VERSIONS.get(version)
    if not version_info:
        return None
    
    status = version_info.get("status")
    deprecation_date = version_info.get("deprecation_date")
    sunset_date = version_info.get("sunset_date")
    
    if status == "deprecated":
        warning = {
            "deprecated": True,
            "version": version,
            "deprecation_date": deprecation_date,
            "sunset_date": sunset_date,
            "current_version": CURRENT_API_VERSION,
            "migration_guide": f"https://docs.floyo.com/api/migration/{version}-to-{CURRENT_API_VERSION}",
        }
        
        # Check if sunset date is approaching
        if sunset_date:
            try:
                sunset = datetime.fromisoformat(sunset_date.replace("Z", "+00:00"))
                days_until_sunset = (sunset - datetime.utcnow()).days
                if days_until_sunset <= 90:
                    warning["sunset_warning"] = f"API version {version} will be sunset in {days_until_sunset} days"
            except Exception:
                pass
        
        return warning
    
    return None


def add_version_headers(response, version: str):
    """
    Add version-related headers to response.
    
    Args:
        response: FastAPI response object
        version: API version
    """
    version_info = API_VERSIONS.get(version, {})
    
    response.headers["X-API-Version"] = version
    response.headers["X-API-Current-Version"] = CURRENT_API_VERSION
    
    if version_info.get("status") == "deprecated":
        deprecation_date = version_info.get("deprecation_date")
        sunset_date = version_info.get("sunset_date")
        
        if deprecation_date:
            response.headers["X-API-Deprecated"] = "true"
            response.headers["X-API-Deprecation-Date"] = deprecation_date
        
        if sunset_date:
            response.headers["X-API-Sunset-Date"] = sunset_date
    
    # Add deprecation warning in header
    deprecation_warning = check_version_deprecation(version)
    if deprecation_warning:
        warning_msg = f"API version {version} is deprecated. Use {CURRENT_API_VERSION} instead."
        response.headers["Warning"] = f'299 - "{warning_msg}"'


def get_version_info(version: Optional[str] = None) -> Dict[str, Any]:
    """
    Get information about API version(s).
    
    Args:
        version: Specific version to get info for, or None for all versions
        
    Returns:
        Dict[str, Any]: Version information
    """
    if version:
        return API_VERSIONS.get(version, {})
    
    return {
        "current_version": CURRENT_API_VERSION,
        "default_version": DEFAULT_API_VERSION,
        "versions": API_VERSIONS,
    }


class VersionDeprecationMiddleware:
    """
    Middleware to add deprecation warnings for deprecated API versions.
    """
    
    async def __call__(self, request: Request, call_next):
        """
        Process request and add deprecation warnings if needed.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/handler
            
        Returns:
            Response: HTTP response with deprecation headers if applicable
        """
        # Only check API endpoints
        if not request.url.path.startswith("/api"):
            return await call_next(request)
        
        version = get_api_version(request)
        deprecation_warning = check_version_deprecation(version)
        
        # Process request
        response = await call_next(request)
        
        # Add version headers
        add_version_headers(response, version)
        
        # Log deprecation usage
        if deprecation_warning:
            logger.warning(
                f"Deprecated API version {version} used",
                extra={
                    "version": version,
                    "path": request.url.path,
                    "method": request.method,
                    "client_ip": request.client.host if request.client else None,
                }
            )
        
        return response
