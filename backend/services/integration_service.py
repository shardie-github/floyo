"""
Integration Service

Business logic for integration operations.
Handles integration management, configuration, and status.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.logging_config import get_logger
from database.models import UserIntegration

logger = get_logger(__name__)


class IntegrationService:
    """Service for integration operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_integration(
        self,
        user_id: Optional[str],
        organization_id: Optional[str],
        provider: str,
        name: str,
        config: Dict[str, Any],
    ) -> UserIntegration:
        """
        Create a new integration.
        
        Args:
            user_id: User ID (optional if organization_id provided)
            organization_id: Organization ID (optional if user_id provided)
            provider: Integration provider (zapier, tiktok, meta, etc.)
            name: Integration name
            config: Integration configuration (encrypted)
        
        Returns:
            Created integration
        """
        integration = UserIntegration(
            user_id=user_id,
            organization_id=organization_id,
            provider=provider,
            name=name,
            config=config,
            is_active=True
        )
        
        self.db.add(integration)
        self.db.commit()
        self.db.refresh(integration)
        
        logger.info(f"Integration created: id={integration.id}, provider={provider}, user_id={user_id}")
        
        return integration
    
    def get_user_integrations(
        self,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        provider: Optional[str] = None,
        active_only: bool = False,
    ) -> List[UserIntegration]:
        """
        Get integrations for a user or organization.
        
        Args:
            user_id: User ID (optional)
            organization_id: Organization ID (optional)
            provider: Filter by provider (optional)
            active_only: Only return active integrations
        
        Returns:
            List of integrations
        """
        query = self.db.query(UserIntegration)
        
        if user_id:
            query = query.filter(UserIntegration.user_id == user_id)
        if organization_id:
            query = query.filter(UserIntegration.organization_id == organization_id)
        if provider:
            query = query.filter(UserIntegration.provider == provider)
        if active_only:
            query = query.filter(UserIntegration.is_active == True)
        
        return query.order_by(desc(UserIntegration.created_at)).all()
    
    def get_integration(
        self,
        integration_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[UserIntegration]:
        """
        Get a specific integration.
        
        Args:
            integration_id: Integration ID
            user_id: User ID (for authorization check)
        
        Returns:
            Integration or None
        """
        query = self.db.query(UserIntegration).filter(UserIntegration.id == integration_id)
        
        if user_id:
            query = query.filter(UserIntegration.user_id == user_id)
        
        return query.first()
    
    def update_integration(
        self,
        integration_id: str,
        config: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None,
        last_sync_at: Optional[Any] = None,
    ) -> Optional[UserIntegration]:
        """
        Update an integration.
        
        Args:
            integration_id: Integration ID
            config: New configuration (optional)
            is_active: Active status (optional)
            last_sync_at: Last sync timestamp (optional)
        
        Returns:
            Updated integration or None
        """
        integration = self.db.query(UserIntegration).filter(
            UserIntegration.id == integration_id
        ).first()
        
        if not integration:
            return None
        
        if config is not None:
            integration.config = config
        if is_active is not None:
            integration.is_active = is_active
        if last_sync_at is not None:
            integration.last_sync_at = last_sync_at
        
        self.db.commit()
        self.db.refresh(integration)
        
        logger.info(f"Integration updated: id={integration_id}")
        
        return integration
    
    def delete_integration(
        self,
        integration_id: str,
    ) -> bool:
        """
        Delete an integration.
        
        Args:
            integration_id: Integration ID
        
        Returns:
            True if deleted, False if not found
        """
        integration = self.db.query(UserIntegration).filter(
            UserIntegration.id == integration_id
        ).first()
        
        if not integration:
            return False
        
        self.db.delete(integration)
        self.db.commit()
        
        logger.info(f"Integration deleted: id={integration_id}")
        
        return True
    
    def sync_integration(
        self,
        integration_id: str,
    ) -> bool:
        """
        Sync an integration (trigger sync with external service).
        
        Args:
            integration_id: Integration ID
        
        Returns:
            True if sync successful, False otherwise
        """
        integration = self.get_integration(integration_id)
        
        if not integration:
            return False
        
        # TODO: Implement actual sync logic based on provider
        # This would call the appropriate external API
        
        from datetime import datetime
        integration.last_sync_at = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Integration synced: id={integration_id}, provider={integration.provider}")
        
        return True
