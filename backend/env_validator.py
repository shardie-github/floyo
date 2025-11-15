"""
Environment Variable Validator for Backend

Validates all environment variables using Pydantic to ensure type safety
and prevent runtime errors from missing or incorrect configuration.
"""

from pydantic import BaseSettings, Field, validator
from typing import Optional, List
import os
import logging

logger = logging.getLogger(__name__)


class EnvironmentSettings(BaseSettings):
    """Validated environment settings for backend."""
    
    # Environment
    environment: str = Field(default="development", description="Environment: development, staging, production")
    
    # Database - Required
    database_url: str = Field(..., description="PostgreSQL database URL")
    
    # Security - Required
    secret_key: str = Field(..., description="JWT secret key (must be strong in production)")
    
    # Supabase - Optional but recommended
    supabase_url: Optional[str] = Field(default=None, description="Supabase URL")
    supabase_anon_key: Optional[str] = Field(default=None, description="Supabase anonymous key")
    supabase_service_role_key: Optional[str] = Field(default=None, description="Supabase service role key")
    supabase_jwt_secret: Optional[str] = Field(default=None, description="Supabase JWT secret")
    
    # API Configuration
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")
    cors_origins: str = Field(default="http://localhost:3000", description="Comma-separated CORS origins")
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")
    rate_limit_per_hour: int = Field(default=1000, description="Rate limit per hour")
    
    # Cache & Background Jobs
    redis_url: Optional[str] = Field(default=None, description="Redis URL")
    celery_broker_url: Optional[str] = Field(default=None, description="Celery broker URL")
    celery_result_backend: Optional[str] = Field(default=None, description="Celery result backend")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, description="Sentry DSN")
    
    # Payment Processing
    stripe_api_key: Optional[str] = Field(default=None, description="Stripe API key")
    stripe_webhook_secret: Optional[str] = Field(default=None, description="Stripe webhook secret")
    
    # AWS (for exports)
    aws_access_key_id: Optional[str] = Field(default=None, description="AWS access key ID")
    aws_secret_access_key: Optional[str] = Field(default=None, description="AWS secret access key")
    aws_region: Optional[str] = Field(default=None, description="AWS region")
    aws_s3_bucket: Optional[str] = Field(default=None, description="AWS S3 bucket")
    
    # External Integrations
    zapier_secret: Optional[str] = Field(default=None, description="Zapier webhook secret")
    tiktok_ads_api_key: Optional[str] = Field(default=None, description="TikTok Ads API key")
    tiktok_ads_api_secret: Optional[str] = Field(default=None, description="TikTok Ads API secret")
    meta_ads_access_token: Optional[str] = Field(default=None, description="Meta Ads access token")
    meta_ads_app_id: Optional[str] = Field(default=None, description="Meta Ads app ID")
    meta_ads_app_secret: Optional[str] = Field(default=None, description="Meta Ads app secret")
    elevenlabs_api_key: Optional[str] = Field(default=None, description="ElevenLabs API key")
    autods_api_key: Optional[str] = Field(default=None, description="AutoDS API key")
    capcut_api_key: Optional[str] = Field(default=None, description="CapCut API key")
    minstudio_api_key: Optional[str] = Field(default=None, description="MindStudio API key")
    
    # Security & Admin
    cron_secret: Optional[str] = Field(default=None, description="Cron job secret")
    vercel_cron_secret: Optional[str] = Field(default=None, description="Vercel cron secret")
    admin_basic_auth: Optional[str] = Field(default=None, description="Admin basic auth")
    snapshot_encryption_key: Optional[str] = Field(default=None, description="Snapshot encryption key")
    
    # Frontend URL
    frontend_url: str = Field(default="http://localhost:3000", description="Frontend URL")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @validator("cors_origins")
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in v.split(",")]
    
    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment value."""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v
    
    @validator("secret_key")
    def validate_secret_key(cls, v, values):
        """Validate secret key strength."""
        environment = values.get("environment", "development")
        
        if environment == "production":
            if len(v) < 32:
                raise ValueError(
                    "SECRET_KEY must be at least 32 characters in production. "
                    "Generate a strong random key using: openssl rand -hex 32"
                )
            
            # Check for common weak patterns
            weak_patterns = [
                "your-secret-key-change-in-production",
                "CHANGE_ME_USE_STRONG_RANDOM_SECRET_KEY",
                "change_me",
                "secret",
                "default",
                "floyo",  # Prevent using project name
            ]
            if any(pattern.lower() in v.lower() for pattern in weak_patterns):
                raise ValueError(
                    "SECRET_KEY appears to be a default or weak value. "
                    "Use a strong, random secret key in production."
                )
        
        return v
    
    def validate_production(self):
        """Validate production-specific settings."""
        if self.environment != "production":
            return
        
        errors = []
        
        # SECRET_KEY validation
        if len(self.secret_key) < 32:
            errors.append(
                "SECRET_KEY must be at least 32 characters in production. "
                "Generate using: openssl rand -hex 32"
            )
        
        # CORS validation
        if "*" in self.cors_origins:
            errors.append(
                "CORS origins cannot be '*' in production. "
                "Set CORS_ORIGINS to specific allowed origins."
            )
        
        # Database URL validation
        if not self.database_url or "localhost" in self.database_url:
            errors.append(
                "DATABASE_URL should not point to localhost in production. "
                "Use a production database URL."
            )
        
        # Redis recommendation
        if not self.redis_url:
            logger.warning(
                "REDIS_URL is not set in production. "
                "Cache and rate limiting will use in-memory storage (not recommended)."
            )
        
        if errors:
            raise ValueError("Production configuration validation failed:\n" + "\n".join(f"  - {e}" for e in errors))


# Create global settings instance
_settings: Optional[EnvironmentSettings] = None


def get_settings() -> EnvironmentSettings:
    """Get validated environment settings."""
    global _settings
    if _settings is None:
        _settings = EnvironmentSettings()
        
        # Validate production settings
        try:
            _settings.validate_production()
        except ValueError as e:
            if _settings.environment == "production":
                logger.error(f"CRITICAL: Production configuration validation failed: {e}")
                raise
            logger.warning(f"Configuration validation warning: {e}")
    
    return _settings


def validate_env() -> EnvironmentSettings:
    """Validate environment variables and return settings."""
    return get_settings()
