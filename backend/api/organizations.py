"""Organization API endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.organizations import (
    create_organization, get_user_organizations, get_organization_members
)
from backend.auth.utils import get_current_user
from backend.api.models import OrganizationCreate, OrganizationResponse, OrganizationUpdate
from database.models import User, Organization, OrganizationMember

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")  # Restrictive for organization creation
async def create_org(
    request: Request,
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new organization.
    
    Organize your workflows and integrations into teams for better collaboration.
    """
    org = create_organization(
        db=db,
        name=org_data.name,
        owner=current_user,
        description=org_data.description,
        request=request
    )
    return org


@router.get("", response_model=List[OrganizationResponse])
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def list_organizations(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all organizations the user belongs to."""
    orgs = get_user_organizations(db, current_user.id)
    return orgs


@router.get("/{org_id}/members")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def list_org_members(
    request: Request,
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get members of an organization."""
    # Check if user is member
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    
    members = get_organization_members(db, org_id)
    return members


@router.put("/{org_id}", response_model=OrganizationResponse)
@limiter.limit("30/minute")
async def update_organization(
    request: Request,
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an organization (admin/owner only)."""
    # Check if user is owner/admin
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["owner", "admin"])
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Update organization
    if org_data.name:
        org.name = org_data.name
    if org_data.description is not None:
        org.description = org_data.description
    
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}")
@limiter.limit("5/hour")  # Restrictive for destructive operation
async def delete_organization(
    request: Request,
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an organization (owner only)."""
    # Check if user is owner
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role == "owner"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owner can delete organization")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db.delete(org)
    db.commit()
    return {"message": "Organization deleted successfully"}
