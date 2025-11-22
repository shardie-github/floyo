"""Enterprise features API endpoints."""

from typing import Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.enterprise import SSOManager, EnterpriseAdmin, ComplianceManager, EcosystemManager
from backend.auth.utils import get_current_user
from database.models import User, OrganizationMember

router = APIRouter(prefix="/api/enterprise", tags=["enterprise"])


@router.get("/organizations/{org_id}/stats")
async def get_organization_stats(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get organization statistics (admin/owner only)."""
    # Check permissions
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    stats = EnterpriseAdmin.get_organization_stats(db, org_id)
    return stats


@router.get("/organizations/{org_id}/activity")
async def get_user_activity_report(
    org_id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user activity report (admin/owner only)."""
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    activity = EnterpriseAdmin.get_user_activity_report(db, org_id, days)
    return {"activity_report": activity, "period_days": days}


@router.post("/sso/providers")
async def create_sso_provider(
    name: str,
    provider_type: str,
    config: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create SSO provider (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    provider = SSOManager.create_sso_provider(db, name, provider_type, config)
    return {
        "id": str(provider.id),
        "name": provider.name,
        "provider_type": provider.provider_type
    }


@router.post("/organizations/{org_id}/sso")
async def create_sso_connection(
    org_id: UUID,
    provider_id: UUID,
    connection_config: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create SSO connection for organization (admin/owner only)."""
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    connection = SSOManager.create_sso_connection(db, org_id, provider_id, connection_config)
    return {
        "id": str(connection.id),
        "organization_id": str(org_id),
        "is_active": connection.is_active
    }


@router.post("/compliance/reports")
async def generate_compliance_report(
    organization_id: UUID,
    report_type: str = "gdpr",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate compliance report (admin/owner only).
    
    Generate GDPR, SOC2, or other compliance reports for your organization.
    """
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == organization_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    report = ComplianceManager.generate_compliance_report(db, organization_id, report_type)
    return {
        "id": str(report.id),
        "report_type": report.report_type,
        "status": report.status,
        "generated_at": report.generated_at.isoformat()
    }


@router.get("/compliance/audit-trail")
async def get_audit_trail(
    organization_id: Optional[UUID] = None,
    resource_type: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit trail with filters.
    
    View comprehensive audit logs for compliance and security monitoring.
    """
    trail = ComplianceManager.get_audit_trail(
        db, organization_id, current_user.id, resource_type, limit
    )
    return {"audit_trail": trail, "count": len(trail)}


@router.get("/ecosystem/workflows/featured")
async def get_featured_workflows(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get featured workflows from marketplace.
    
    Discover popular workflows created by the community.
    """
    workflows = EcosystemManager.get_featured_workflows(db, limit)
    return {"featured_workflows": workflows}


@router.post("/ecosystem/workflows/fork/{share_code}")
async def fork_workflow(
    share_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fork a shared workflow.
    
    Use workflows created by others as a starting point for your own automation.
    """
    result = EcosystemManager.fork_workflow(db, current_user.id, share_code)
    return result
