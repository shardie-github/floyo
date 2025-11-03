"""Centralized configuration management."""
from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import Field, validator
import os
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Environment
    environment: str = Field(default="development", description="Environment: development, staging, production")
    
    # Database
    database_url: str = Field(..., description="PostgreSQL database URL")
    database_pool_size: int = Field(default=10, description="Database connection pool size")
    database_max_overflow: int = Field(default=20, description="Database connection pool max overflow")
    database_pool_recycle: int = Field(default=3600, description="Database connection pool recycle time (seconds)")
    
    # Security
    secret_key: str = Field(..., description="JWT secret key (must be strong in production)")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiration (minutes)")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token expiration (days)")
    
    # API
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")
    
    # CORS
    cors_origins: str = Field(default="http://localhost:3000", description="Comma-separated list of allowed CORS origins")
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")
    rate_limit_per_hour: int = Field(default=1000, description="Rate limit per hour")
    
    # Cache
    redis_url: Optional[str] = Field(default=None, description="Redis URL (optional, falls back to in-memory)")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, description="Sentry DSN for error tracking")
    
    # Frontend
    next_public_api_url: str = Field(default="http://localhost:8000", description="Frontend API URL")
    
    # Supabase (optional)
    supabase_url: Optional[str] = Field(default=None, description="Supabase URL")
    supabase_anon_key: Optional[str] = Field(default=None, description="Supabase anonymous key")
    supabase_service_role_key: Optional[str] = Field(default=None, description="Supabase service role key")
    
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
    
    def validate_production(self):
        """Validate production-specific settings."""
        if self.environment != "production":
            return
        
        # SECRET_KEY validation
        if self.secret_key == "your-secret-key-change-in-production":
            raise ValueError(
                "SECRET_KEY must be set in production. "
                "Set the SECRET_KEY environment variable to a strong, random value."
            )
        
        # CORS validation
        if "*" in self.cors_origins:
            raise ValueError(
                "CORS origins cannot be '*' in production. "
                "Set CORS_ORIGINS environment variable to a comma-separated list of allowed origins."
            )
        
        # Redis validation (optional but recommended)
        if not self.redis_url:
            logger.warning(
                "REDIS_URL is not set in production. "
                "Cache and rate limiting will use in-memory storage (not recommended for production)."
            )

# Create global settings instance
settings = Settings()

# Validate production settings
try:
    settings.validate_production()
except ValueError as e:
    if settings.environment == "production":
        raise
    # In non-production, just log warning
    logger.warning(f"Configuration validation warning: {e}")
