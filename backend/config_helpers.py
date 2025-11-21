"""
Configuration helpers for environment validation and feature flags.

Provides utilities for validating configuration and checking feature flags.
"""

import os
from typing import Dict, Any, Optional, List
from backend.config import settings
from backend.feature_flags import FeatureFlagService
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


def validate_required_env_vars(required_vars: List[str]) -> Dict[str, bool]:
    """
    Validate that required environment variables are set.
    
    Args:
        required_vars: List of required environment variable names
        
    Returns:
        Dict[str, bool]: Validation results for each variable
    """
    results = {}
    missing = []
    
    for var in required_vars:
        value = os.getenv(var)
        results[var] = value is not None and value != ""
        if not results[var]:
            missing.append(var)
    
    if missing:
        logger.warning(f"Missing required environment variables: {', '.join(missing)}")
    
    return results


def get_feature_flag_status(
    db: Session,
    flag_name: str,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get detailed feature flag status.
    
    Args:
        db: Database session
        flag_name: Feature flag name
        user_id: User ID (optional)
        organization_id: Organization ID (optional)
        
    Returns:
        Dict[str, Any]: Feature flag status including enabled state and variant
    """
    enabled = FeatureFlagService.is_enabled(
        db,
        flag_name,
        user_id=user_id,
        organization_id=organization_id
    )
    
    variant = FeatureFlagService.get_variant(
        db,
        flag_name,
        user_id=user_id
    )
    
    return {
        "name": flag_name,
        "enabled": enabled,
        "variant": variant
    }


def get_config_summary() -> Dict[str, Any]:
    """
    Get configuration summary (safe for logging/monitoring).
    
    Returns:
        Dict[str, Any]: Configuration summary with sensitive data masked
    """
    return {
        "environment": settings.environment,
        "database_pool_size": settings.database_pool_size,
        "database_max_overflow": settings.database_max_overflow,
        "rate_limit_per_minute": settings.rate_limit_per_minute,
        "rate_limit_per_hour": settings.rate_limit_per_hour,
        "cors_origins_count": len(settings.cors_origins),
        "redis_configured": settings.redis_url is not None,
        "sentry_configured": settings.sentry_dsn is not None,
    }


def validate_production_config() -> List[str]:
    """
    Validate production configuration and return list of issues.
    
    Returns:
        List[str]: List of configuration issues (empty if all valid)
    """
    issues = []
    
    # Check secret key strength
    if settings.environment == "production":
        if len(settings.secret_key) < 32:
            issues.append("SECRET_KEY must be at least 32 characters")
        
        # Check for weak patterns
        weak_patterns = ["secret", "default", "change", "floyo"]
        if any(pattern in settings.secret_key.lower() for pattern in weak_patterns):
            issues.append("SECRET_KEY appears to be weak or default")
        
        # Check CORS
        if "*" in settings.cors_origins:
            issues.append("CORS origins cannot be '*' in production")
        
        # Check Redis (recommended for production)
        if not settings.redis_url:
            issues.append("REDIS_URL not set (recommended for production)")
    
    return issues
