"""
Organization Service
Multi-tenant organization management with tenant isolation.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from uuid import UUID

from backend.logging_config import get_logger
from database.models import Organization, User, UserOrganization

logger = get_logger(__name__)


class OrganizationService:
    """Service for organization operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_organization(
        self,
        name: str,
        owner_id: str,
        plan: str = 'free',
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Organization:
        """
        Create a new organization.
        
        Args:
            name: Organization name
            owner_id: Owner user ID
            plan: Subscription plan
            metadata: Additional metadata
        
        Returns:
            Created organization
        """
        organization = Organization(
            name=name,
            plan=plan,
            metadata=metadata or {},
            is_active=True,
        )
        
        self.db.add(organization)
        self.db.commit()
        self.db.refresh(organization)
        
        # Add owner as admin
        user_org = UserOrganization(
            user_id=owner_id,
            organization_id=str(organization.id),
            role='owner',
            is_active=True,
        )
        self.db.add(user_org)
        self.db.commit()
        
        logger.info(f"Organization created: id={organization.id}, name={name}, owner_id={owner_id}")
        
        return organization
    
    def get_user_organizations(
        self,
        user_id: str,
        active_only: bool = True,
    ) -> List[Organization]:
        """
        Get organizations for a user.
        
        Args:
            user_id: User ID
            active_only: Only return active organizations
        
        Returns:
            List of organizations
        """
        query = self.db.query(Organization).join(
            UserOrganization,
            Organization.id == UserOrganization.organization_id
        ).filter(
            UserOrganization.user_id == user_id
        )
        
        if active_only:
            query = query.filter(Organization.is_active == True)
        
        return query.order_by(desc(Organization.created_at)).all()
    
    def get_organization(
        self,
        organization_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[Organization]:
        """
        Get organization with access check.
        
        Args:
            organization_id: Organization ID
            user_id: User ID (for access check)
        
        Returns:
            Organization or None
        """
        query = self.db.query(Organization).filter(Organization.id == organization_id)
        
        if user_id:
            # Check user has access
            user_org = self.db.query(UserOrganization).filter(
                UserOrganization.organization_id == organization_id,
                UserOrganization.user_id == user_id,
                UserOrganization.is_active == True,
            ).first()
            
            if not user_org:
                return None
        
        return query.first()
    
    def add_member(
        self,
        organization_id: str,
        user_id: str,
        role: str = 'member',
    ) -> UserOrganization:
        """
        Add member to organization.
        
        Args:
            organization_id: Organization ID
            user_id: User ID to add
            role: Member role (owner, admin, member)
        
        Returns:
            UserOrganization relationship
        """
        user_org = UserOrganization(
            user_id=user_id,
            organization_id=organization_id,
            role=role,
            is_active=True,
        )
        
        self.db.add(user_org)
        self.db.commit()
        self.db.refresh(user_org)
        
        logger.info(f"Member added: org_id={organization_id}, user_id={user_id}, role={role}")
        
        return user_org
    
    def remove_member(
        self,
        organization_id: str,
        user_id: str,
    ) -> bool:
        """
        Remove member from organization.
        
        Args:
            organization_id: Organization ID
            user_id: User ID to remove
        
        Returns:
            True if removed, False if not found
        """
        user_org = self.db.query(UserOrganization).filter(
            UserOrganization.organization_id == organization_id,
            UserOrganization.user_id == user_id,
        ).first()
        
        if not user_org:
            return False
        
        user_org.is_active = False
        self.db.commit()
        
        logger.info(f"Member removed: org_id={organization_id}, user_id={user_id}")
        
        return True
    
    def update_organization(
        self,
        organization_id: str,
        name: Optional[str] = None,
        plan: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Organization]:
        """
        Update organization.
        
        Args:
            organization_id: Organization ID
            name: New name (optional)
            plan: New plan (optional)
            metadata: New metadata (optional)
            is_active: Active status (optional)
        
        Returns:
            Updated organization or None
        """
        organization = self.db.query(Organization).filter(
            Organization.id == organization_id
        ).first()
        
        if not organization:
            return None
        
        if name is not None:
            organization.name = name
        if plan is not None:
            organization.plan = plan
        if metadata is not None:
            organization.metadata = metadata
        if is_active is not None:
            organization.is_active = is_active
        
        self.db.commit()
        self.db.refresh(organization)
        
        logger.info(f"Organization updated: id={organization_id}")
        
        return organization
    
    def get_organization_members(
        self,
        organization_id: str,
    ) -> List[UserOrganization]:
        """
        Get organization members.
        
        Args:
            organization_id: Organization ID
        
        Returns:
            List of user-organization relationships
        """
        return self.db.query(UserOrganization).filter(
            UserOrganization.organization_id == organization_id,
            UserOrganization.is_active == True,
        ).all()
