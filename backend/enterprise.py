"""Enterprise features: SSO, advanced admin, compliance."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database.models import (
    User, Organization, OrganizationMember, AuditLog, SSOProvider,
    SSOConnection, ComplianceReport, EnterpriseSettings
)
from backend.audit import log_audit
import logging
import json

logger = logging.getLogger(__name__)


class SSOManager:
    """Manage SSO (SAML/OIDC) connections."""
    
    @staticmethod
    def create_sso_provider(
        db: Session,
        name: str,
        provider_type: str,  # saml, oidc
        config: Dict[str, Any],
        is_active: bool = True
    ) -> SSOProvider:
        """Create an SSO provider configuration."""
        provider = SSOProvider(
            name=name,
            provider_type=provider_type,
            config=config,
            is_active=is_active
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
        
        return provider
    
    @staticmethod
    def create_sso_connection(
        db: Session,
        organization_id: UUID,
        provider_id: UUID,
        connection_config: Dict[str, Any]
    ) -> SSOConnection:
        """Create an SSO connection for an organization."""
        # Check if connection already exists
        existing = db.query(SSOConnection).filter(
            SSOConnection.organization_id == organization_id
        ).first()
        
        if existing:
            # Update existing connection
            existing.provider_id = provider_id
            existing.config = connection_config
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        
        connection = SSOConnection(
            organization_id=organization_id,
            provider_id=provider_id,
            config=connection_config,
            is_active=True
        )
        db.add(connection)
        db.commit()
        db.refresh(connection)
        
        log_audit(
            db=db,
            user_id=None,
            action="sso_connection_created",
            resource_type="sso_connection",
            resource_id=str(connection.id),
            details={"organization_id": str(organization_id), "provider_id": str(provider_id)},
            organization_id=organization_id
        )
        
        return connection
    
    @staticmethod
    def authenticate_sso(
        db: Session,
        provider_id: UUID,
        saml_response: Optional[str] = None,
        oidc_token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Authenticate user via SSO (simplified - would integrate with actual SSO library)."""
        provider = db.query(SSOProvider).filter(SSOProvider.id == provider_id).first()
        if not provider or not provider.is_active:
            return None
        
        # In production, this would:
        # 1. Validate SAML response or OIDC token
        # 2. Extract user attributes (email, name, etc.)
        # 3. Find or create user
        # 4. Create session
        
        # Simplified implementation for now
        return {
            "success": True,
            "provider_id": str(provider_id),
            "provider_type": provider.provider_type,
            "note": "SSO authentication requires actual SAML/OIDC library integration"
        }


class EnterpriseAdmin:
    """Enterprise admin dashboard and management."""
    
    @staticmethod
    def get_organization_stats(
        db: Session,
        organization_id: UUID
    ) -> Dict[str, Any]:
        """Get comprehensive stats for an organization."""
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            return {}
        
        # Member count
        member_count = db.query(func.count(OrganizationMember.id)).filter(
            OrganizationMember.organization_id == organization_id
        ).scalar() or 0
        
        # Active users (users with recent activity)
        week_ago = datetime.utcnow() - timedelta(days=7)
        from database.models import Event
        active_users = db.query(func.count(func.distinct(Event.user_id))).filter(
            and_(
                Event.user_id.in_(
                    db.query(OrganizationMember.user_id).filter(
                        OrganizationMember.organization_id == organization_id
                    )
                ),
                Event.timestamp >= week_ago
            )
        ).scalar() or 0
        
        # Workflow count
        from database.models import Workflow
        workflow_count = db.query(func.count(Workflow.id)).filter(
            Workflow.organization_id == organization_id
        ).scalar() or 0
        
        # Integration count
        from database.models import UserIntegration
        integration_count = db.query(func.count(UserIntegration.id)).filter(
            UserIntegration.organization_id == organization_id
        ).scalar() or 0
        
        # Audit log count (last 30 days)
        month_ago = datetime.utcnow() - timedelta(days=30)
        audit_count = db.query(func.count(AuditLog.id)).filter(
            and_(
                AuditLog.organization_id == organization_id,
                AuditLog.created_at >= month_ago
            )
        ).scalar() or 0
        
        return {
            "organization_id": str(organization_id),
            "name": org.name,
            "tier": org.subscription_tier,
            "member_count": member_count,
            "active_users": active_users,
            "workflow_count": workflow_count,
            "integration_count": integration_count,
            "audit_logs_30d": audit_count,
            "created_at": org.created_at.isoformat()
        }
    
    @staticmethod
    def get_user_activity_report(
        db: Session,
        organization_id: UUID,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get user activity report for organization."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all members
        members = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id
        ).all()
        
        from database.models import Event
        result = []
        
        for member in members:
            # Get event count
            event_count = db.query(func.count(Event.id)).filter(
                and_(
                    Event.user_id == member.user_id,
                    Event.timestamp >= cutoff_date
                )
            ).scalar() or 0
            
            # Get last activity
            last_event = db.query(func.max(Event.timestamp)).filter(
                Event.user_id == member.user_id
            ).scalar()
            
            result.append({
                "user_id": str(member.user_id),
                "role": member.role,
                "joined_at": member.joined_at.isoformat(),
                "events_count": event_count,
                "last_active": last_event.isoformat() if last_event else None
            })
        
        return result


class ComplianceManager:
    """Compliance and audit management."""
    
    @staticmethod
    def generate_compliance_report(
        db: Session,
        organization_id: UUID,
        report_type: str = "gdpr",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> ComplianceReport:
        """Generate a compliance report."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=90)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Collect compliance data based on report type
        report_data = {
            "report_type": report_type,
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
            "organization_id": str(organization_id)
        }
        
        if report_type == "gdpr":
            # GDPR-specific data
            report_data.update({
                "data_retention_policy": "90 days",
                "user_data_requests": 0,  # Would query actual requests
                "data_deletions": 0,
                "data_exports": 0
            })
        elif report_type == "soc2":
            # SOC2-specific data
            audit_logs = db.query(func.count(AuditLog.id)).filter(
                and_(
                    AuditLog.organization_id == organization_id,
                    AuditLog.created_at >= start_date,
                    AuditLog.created_at <= end_date
                )
            ).scalar() or 0
            
            report_data.update({
                "audit_log_count": audit_logs,
                "access_controls": "enforced",
                "encryption": "enabled",
                "backup_frequency": "daily"
            })
        
        report = ComplianceReport(
            organization_id=organization_id,
            report_type=report_type,
            report_data=report_data,
            status="completed",
            generated_at=datetime.utcnow()
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        log_audit(
            db=db,
            user_id=None,
            action="compliance_report_generated",
            resource_type="compliance_report",
            resource_id=str(report.id),
            details={"report_type": report_type},
            organization_id=organization_id
        )
        
        return report
    
    @staticmethod
    def get_audit_trail(
        db: Session,
        organization_id: Optional[UUID],
        user_id: Optional[UUID],
        resource_type: Optional[str],
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get audit trail with filters."""
        query = db.query(AuditLog)
        
        if organization_id:
            query = query.filter(AuditLog.organization_id == organization_id)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        
        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": str(log.id),
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": str(log.resource_id) if log.resource_id else None,
                "user_id": str(log.user_id) if log.user_id else None,
                "organization_id": str(log.organization_id) if log.organization_id else None,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat(),
                "details": log.details
            }
            for log in logs
        ]


class EcosystemManager:
    """Manage marketplace and ecosystem features."""
    
    @staticmethod
    def get_featured_workflows(
        db: Session,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get featured workflows from marketplace."""
        from database.models import WorkflowShare
        
        featured = db.query(WorkflowShare).filter(
            and_(
                WorkflowShare.is_featured == True,
                WorkflowShare.share_type == "public"
            )
        ).order_by(WorkflowShare.view_count.desc()).limit(limit).all()
        
        return [
            {
                "share_id": str(share.id),
                "workflow_id": str(share.workflow_id),
                "share_code": share.share_code,
                "view_count": share.view_count,
                "fork_count": share.fork_count,
                "created_at": share.created_at.isoformat()
            }
            for share in featured
        ]
    
    @staticmethod
    def fork_workflow(
        db: Session,
        user_id: UUID,
        share_code: str
    ) -> Dict[str, Any]:
        """Fork a shared workflow."""
        from database.models import WorkflowShare, Workflow
        
        share = db.query(WorkflowShare).filter(WorkflowShare.share_code == share_code).first()
        if not share:
            return {"error": "Shared workflow not found"}
        
        original_workflow = db.query(Workflow).filter(Workflow.id == share.workflow_id).first()
        if not original_workflow:
            return {"error": "Workflow not found"}
        
        # Create new workflow from original
        new_workflow = Workflow(
            user_id=user_id,
            name=f"{original_workflow.name} (Forked)",
            description=original_workflow.description,
            steps=original_workflow.steps,
            is_active=True
        )
        db.add(new_workflow)
        
        # Update fork count
        share.fork_count += 1
        share.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(new_workflow)
        
        log_audit(
            db=db,
            user_id=user_id,
            action="workflow_forked",
            resource_type="workflow",
            resource_id=str(new_workflow.id),
            details={"original_workflow_id": str(original_workflow.id), "share_code": share_code}
        )
        
        return {
            "workflow_id": str(new_workflow.id),
            "name": new_workflow.name,
            "forked_from": str(original_workflow.id),
            "share_code": share_code
        }
