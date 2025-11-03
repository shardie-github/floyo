"""Tests for security guardrails and validation."""

import pytest
import os
from backend.config import Settings


def test_secret_key_validation_in_production():
    """Test that SECRET_KEY validation fails with default value in production."""
    # Save original environment
    original_env = os.environ.get("ENVIRONMENT")
    original_secret = os.environ.get("SECRET_KEY")
    
    try:
        os.environ["ENVIRONMENT"] = "production"
        os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
        
        with pytest.raises(ValueError, match="SECRET_KEY must be set"):
            Settings()
    finally:
        # Restore original environment
        if original_env:
            os.environ["ENVIRONMENT"] = original_env
        elif "ENVIRONMENT" in os.environ:
            del os.environ["ENVIRONMENT"]
        if original_secret:
            os.environ["SECRET_KEY"] = original_secret
        elif "SECRET_KEY" in os.environ:
            del os.environ["SECRET_KEY"]


def test_secret_key_validation_short_key():
    """Test that SECRET_KEY validation fails with short key in production."""
    original_env = os.environ.get("ENVIRONMENT")
    original_secret = os.environ.get("SECRET_KEY")
    
    try:
        os.environ["ENVIRONMENT"] = "production"
        os.environ["SECRET_KEY"] = "short"  # Less than 32 characters
        
        with pytest.raises(ValueError, match="SECRET_KEY must be set"):
            Settings()
    finally:
        if original_env:
            os.environ["ENVIRONMENT"] = original_env
        elif "ENVIRONMENT" in os.environ:
            del os.environ["ENVIRONMENT"]
        if original_secret:
            os.environ["SECRET_KEY"] = original_secret
        elif "SECRET_KEY" in os.environ:
            del os.environ["SECRET_KEY"]


def test_cors_validation_in_production():
    """Test that CORS validation fails with '*' in production."""
    original_env = os.environ.get("ENVIRONMENT")
    original_cors = os.environ.get("CORS_ORIGINS")
    original_secret = os.environ.get("SECRET_KEY")
    
    try:
        os.environ["ENVIRONMENT"] = "production"
        os.environ["CORS_ORIGINS"] = "*"
        os.environ["SECRET_KEY"] = "a" * 32  # Valid secret key
        
        with pytest.raises(ValueError, match="CORS origins cannot be"):
            Settings()
    finally:
        if original_env:
            os.environ["ENVIRONMENT"] = original_env
        elif "ENVIRONMENT" in os.environ:
            del os.environ["ENVIRONMENT"]
        if original_cors:
            os.environ["CORS_ORIGINS"] = original_cors
        elif "CORS_ORIGINS" in os.environ:
            del os.environ["CORS_ORIGINS"]
        if original_secret:
            os.environ["SECRET_KEY"] = original_secret
        elif "SECRET_KEY" in os.environ:
            del os.environ["SECRET_KEY"]


def test_config_allows_defaults_in_development():
    """Test that default values are allowed in development."""
    original_env = os.environ.get("ENVIRONMENT")
    original_secret = os.environ.get("SECRET_KEY")
    original_cors = os.environ.get("CORS_ORIGINS")
    
    try:
        os.environ["ENVIRONMENT"] = "development"
        os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
        os.environ["CORS_ORIGINS"] = "*"
        
        # Should not raise in development
        settings = Settings()
        assert settings.environment == "development"
    finally:
        if original_env:
            os.environ["ENVIRONMENT"] = original_env
        elif "ENVIRONMENT" in os.environ:
            del os.environ["ENVIRONMENT"]
        if original_secret:
            os.environ["SECRET_KEY"] = original_secret
        elif "SECRET_KEY" in os.environ:
            del os.environ["SECRET_KEY"]
        if original_cors:
            os.environ["CORS_ORIGINS"] = original_cors
        elif "CORS_ORIGINS" in os.environ:
            del os.environ["CORS_ORIGINS"]
