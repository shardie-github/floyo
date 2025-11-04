"""
Feature flags system for Floyo.

Supports:
- Boolean feature flags
- Gradual rollouts (percentage-based)
- User-specific overrides
- Organization-specific overrides
- A/B testing variants
- Kill-switch support (emergency disable mechanism)
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Boolean, Integer, JSON, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import hashlib
import json

Base = declarative_base()


class FeatureFlag(Base):
    """Feature flag definition."""
    __tablename__ = "feature_flags"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=UUID)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    enabled = Column(Boolean, default=False)
    kill_switch = Column(Boolean, default=False, nullable=False)  # Emergency disable - overrides all other settings
    rollout_percentage = Column(Integer, default=0)  # 0-100
    variant_config = Column(JSONB, nullable=True)  # For A/B tests
    target_users = Column(JSONB, nullable=True)  # List of user IDs to always enable
    target_organizations = Column(JSONB, nullable=True)  # List of org IDs
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class FeatureFlagOverride(Base):
    """User or organization-specific feature flag overrides."""
    __tablename__ = "feature_flag_overrides"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=UUID)
    feature_flag_id = Column(PGUUID(as_uuid=True), ForeignKey("feature_flags.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    organization_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    enabled = Column(Boolean, nullable=False)
    variant = Column(String(50), nullable=True)  # For A/B test variants
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    feature_flag = relationship("FeatureFlag")


# Import UUID properly
from uuid import uuid4 as UUID


class FeatureFlagService:
    """Service for managing and checking feature flags."""
    
    @staticmethod
    def is_enabled(
        db: Session,
        flag_name: str,
        user_id: Optional[UUID] = None,
        organization_id: Optional[UUID] = None
    ) -> bool:
        """
        Check if a feature flag is enabled for a user/organization.
        
        Priority:
        1. Kill-switch (if enabled, always returns False)
        2. User-specific override
        3. Organization-specific override
        4. User in target list
        5. Organization in target list
        6. Percentage-based rollout
        7. Global enabled state
        """
        flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()
        
        if not flag:
            return False
        
        # Kill-switch takes highest priority - if enabled, feature is disabled regardless of other settings
        if flag.kill_switch:
            return False
        
        # Check user override
        if user_id:
            override = db.query(FeatureFlagOverride).filter(
                FeatureFlagOverride.feature_flag_id == flag.id,
                FeatureFlagOverride.user_id == user_id
            ).first()
            if override:
                return override.enabled
        
        # Check organization override
        if organization_id:
            override = db.query(FeatureFlagOverride).filter(
                FeatureFlagOverride.feature_flag_id == flag.id,
                FeatureFlagOverride.organization_id == organization_id
            ).first()
            if override:
                return override.enabled
        
        # Check if user is in target list
        if user_id and flag.target_users:
            if str(user_id) in flag.target_users:
                return True
        
        # Check if organization is in target list
        if organization_id and flag.target_organizations:
            if str(organization_id) in flag.target_organizations:
                return True
        
        # Check percentage-based rollout
        if flag.rollout_percentage > 0 and user_id:
            # Deterministic hash-based rollout
            hash_input = f"{flag_name}:{user_id}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            percentage = (hash_value % 100) + 1
            if percentage <= flag.rollout_percentage:
                return True
        
        # Fall back to global enabled state
        return flag.enabled
    
    @staticmethod
    def get_variant(
        db: Session,
        flag_name: str,
        user_id: Optional[UUID] = None
    ) -> Optional[str]:
        """Get A/B test variant for a feature flag."""
        flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()
        
        if not flag or not flag.variant_config:
            return None
        
        # Check user override
        if user_id:
            override = db.query(FeatureFlagOverride).filter(
                FeatureFlagOverride.feature_flag_id == flag.id,
                FeatureFlagOverride.user_id == user_id
            ).first()
            if override and override.variant:
                return override.variant
        
        # Assign variant based on user ID hash
        if user_id:
            hash_input = f"{flag_name}:variant:{user_id}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            variants = flag.variant_config.get("variants", [])
            if variants:
                variant_index = hash_value % len(variants)
                return variants[variant_index].get("name")
        
        return flag.variant_config.get("default", "control")
    
    @staticmethod
    def create_flag(
        db: Session,
        name: str,
        description: Optional[str] = None,
        enabled: bool = False,
        kill_switch: bool = False,
        rollout_percentage: int = 0
    ) -> FeatureFlag:
        """Create a new feature flag."""
        flag = FeatureFlag(
            name=name,
            description=description,
            enabled=enabled,
            kill_switch=kill_switch,
            rollout_percentage=rollout_percentage
        )
        db.add(flag)
        db.commit()
        db.refresh(flag)
        return flag
    
    @staticmethod
    def update_flag(
        db: Session,
        flag_name: str,
        enabled: Optional[bool] = None,
        kill_switch: Optional[bool] = None,
        rollout_percentage: Optional[int] = None,
        variant_config: Optional[Dict[str, Any]] = None
    ) -> FeatureFlag:
        """Update a feature flag."""
        flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()
        if not flag:
            raise ValueError(f"Feature flag '{flag_name}' not found")
        
        if enabled is not None:
            flag.enabled = enabled
        if kill_switch is not None:
            flag.kill_switch = kill_switch
        if rollout_percentage is not None:
            flag.rollout_percentage = rollout_percentage
        if variant_config is not None:
            flag.variant_config = variant_config
        
        db.commit()
        db.refresh(flag)
        return flag
    
    @staticmethod
    def set_override(
        db: Session,
        flag_name: str,
        enabled: bool,
        user_id: Optional[UUID] = None,
        organization_id: Optional[UUID] = None,
        variant: Optional[str] = None
    ) -> FeatureFlagOverride:
        """Set a user or organization override."""
        flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()
        if not flag:
            raise ValueError(f"Feature flag '{flag_name}' not found")
        
        if not user_id and not organization_id:
            raise ValueError("Must provide either user_id or organization_id")
        
        # Check for existing override
        override = db.query(FeatureFlagOverride).filter(
            FeatureFlagOverride.feature_flag_id == flag.id,
            FeatureFlagOverride.user_id == user_id,
            FeatureFlagOverride.organization_id == organization_id
        ).first()
        
        if override:
            override.enabled = enabled
            if variant:
                override.variant = variant
        else:
            override = FeatureFlagOverride(
                feature_flag_id=flag.id,
                user_id=user_id,
                organization_id=organization_id,
                enabled=enabled,
                variant=variant
            )
            db.add(override)
        
        db.commit()
        db.refresh(override)
        return override


# Convenience decorator for feature flags
def require_feature(flag_name: str):
    """Decorator to require a feature flag for an endpoint."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Would need access to db and current_user
            # This is a placeholder - actual implementation would check flag
            return func(*args, **kwargs)
        return wrapper
    return decorator
