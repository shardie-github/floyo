"""Organization/Workspace management."""

from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_
import re

from database.models import Organization, OrganizationMember, User
from backend.audit import log_audit


def create_organization(
    db: Session,
    name: str,
    owner: User,
    description: Optional[str] = None,
    request: Optional = None
) -> Organization:
    """Create a new organization and add the owner as admin."""
    # Generate slug from name
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower())
    slug = re.sub(r'^-|-$', '', slug)
    
    # Ensure unique slug
    base_slug = slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    org = Organization(
        name=name,
        slug=slug,
        description=description,
        subscription_tier="free"
    )
    db.add(org)
    db.flush()
    
    # Add owner as organization owner
    member = OrganizationMember(
        organization_id=org.id,
        user_id=owner.id,
        role="owner"
    )
    db.add(member)
    db.commit()
    db.refresh(org)
    
    log_audit(
        db=db,
        action="create",
        resource_type="organization",
        user_id=owner.id,
        organization_id=org.id,
        resource_id=org.id,
        details={"name": name},
        request=request
    )
    
    return org


def get_user_organizations(db: Session, user_id: UUID) -> List[Organization]:
    """Get all organizations a user belongs to."""
    memberships = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id
    ).all()
    
    org_ids = [m.organization_id for m in memberships]
    if not org_ids:
        return []
    
    return db.query(Organization).filter(Organization.id.in_(org_ids)).all()


def get_organization_members(
    db: Session,
    organization_id: UUID,
    user_id: Optional[UUID] = None
) -> List[OrganizationMember]:
    """Get members of an organization, optionally filtered by user."""
    query = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == organization_id
    )
    
    if user_id:
        query = query.filter(OrganizationMember.user_id == user_id)
    
    return query.all()


def add_member(
    db: Session,
    organization_id: UUID,
    user_id: UUID,
    role: str = "member",
    inviter_id: UUID = None,
    request: Optional = None
) -> OrganizationMember:
    """Add a member to an organization."""
    # Check if already a member
    existing = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == organization_id,
        OrganizationMember.user_id == user_id
    ).first()
    
    if existing:
        raise ValueError("User is already a member of this organization")
    
    member = OrganizationMember(
        organization_id=organization_id,
        user_id=user_id,
        role=role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    log_audit(
        db=db,
        action="invite",
        resource_type="organization_member",
        user_id=inviter_id,
        organization_id=organization_id,
        resource_id=member.id,
        details={"user_id": str(user_id), "role": role},
        request=request
    )
    
    return member


def update_member_role(
    db: Session,
    organization_id: UUID,
    user_id: UUID,
    new_role: str,
    updater_id: UUID,
    request: Optional = None
) -> OrganizationMember:
    """Update a member's role."""
    member = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == organization_id,
        OrganizationMember.user_id == user_id
    ).first()
    
    if not member:
        raise ValueError("User is not a member of this organization")
    
    old_role = member.role
    member.role = new_role
    db.commit()
    db.refresh(member)
    
    log_audit(
        db=db,
        action="update_role",
        resource_type="organization_member",
        user_id=updater_id,
        organization_id=organization_id,
        resource_id=member.id,
        details={"old_role": old_role, "new_role": new_role},
        request=request
    )
    
    return member
