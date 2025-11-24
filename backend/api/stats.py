"""Stats, config, and data management API endpoints."""

import json
import zipfile
from io import BytesIO
from datetime import datetime
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.audit import log_audit, get_audit_logs as query_audit_logs
from backend.auth.utils import get_current_user
from backend.auth.analytics_helpers import check_user_activation, get_user_retention_metrics
from backend.sample_data import SampleDataGenerator
from database.models import (
    User, Event, Pattern, FileRelationship, Suggestion, UserConfig,
    Workflow, UserSession, OrganizationMember
)

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get tracking statistics.
    
    View your usage statistics: events tracked, patterns discovered,
    suggestions generated, and more.
    """
    total_events = db.query(Event).filter(Event.user_id == current_user.id).count()
    total_patterns = db.query(Pattern).filter(Pattern.user_id == current_user.id).count()
    total_relationships = db.query(FileRelationship).filter(
        FileRelationship.user_id == current_user.id
    ).count()
    total_suggestions = db.query(Suggestion).filter(
        Suggestion.user_id == current_user.id
    ).count()
    
    return {
        "total_events": total_events,
        "total_patterns": total_patterns,
        "total_relationships": total_relationships,
        "total_suggestions": total_suggestions
    }


@router.get("/analytics/activation")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_activation_status(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user activation status."""
    is_activated = check_user_activation(db, str(current_user.id))
    retention_metrics = get_user_retention_metrics(db, str(current_user.id))
    
    return {
        "is_activated": is_activated,
        "retention": retention_metrics
    }


@router.get("/analytics/funnel")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_funnel_metrics_endpoint(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get funnel metrics (admin only or for own data)."""
    # For now, return user-specific metrics
    # In production, this would be admin-only for full funnel
    retention_metrics = get_user_retention_metrics(db, str(current_user.id))
    
    return {
        "user_retention": retention_metrics,
        "period_days": days
    }


@router.get("/config")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_config(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user configuration."""
    config = db.query(UserConfig).filter(UserConfig.user_id == current_user.id).first()
    if not config:
        # Create default config
        config = UserConfig(
            user_id=current_user.id,
            monitored_directories=[],
            exclude_patterns=[],
            tracking_config={},
            suggestions_config={},
            privacy_config={}
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/config")
@limiter.limit("30/minute")
async def update_config(
    request: Request,
    config_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user configuration."""
    config = db.query(UserConfig).filter(UserConfig.user_id == current_user.id).first()
    if not config:
        config = UserConfig(user_id=current_user.id)
        db.add(config)
    
    for key, value in config_data.items():
        if hasattr(config, key):
            setattr(config, key, value)
    
    db.commit()
    db.refresh(config)
    return config


@router.get("/data/export")
@limiter.limit("5/hour")  # More restrictive for data export
async def export_all_data(
    request: Request,
    format: str = "zip",  # zip or json
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export all user data for GDPR compliance (right to data portability).
    
    Download all your data in a portable format for backup or migration.
    """
    # Collect all user data
    user_data = {
        "export_date": datetime.utcnow().isoformat(),
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "email_verified": current_user.email_verified,
        },
        "events": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "file_path": e.file_path,
                "tool": e.tool,
                "operation": e.operation,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "details": e.details
            }
            for e in db.query(Event).filter(Event.user_id == current_user.id).order_by(Event.timestamp.desc()).all()
        ],
        "patterns": [
            {
                "id": str(p.id),
                "file_extension": p.file_extension,
                "count": p.count,
                "last_used": p.last_used.isoformat() if p.last_used else None,
                "tools": p.tools,
                "metadata": p.metadata
            }
            for p in db.query(Pattern).filter(Pattern.user_id == current_user.id).all()
        ],
        "suggestions": [
            {
                "id": str(s.id),
                "trigger": s.trigger,
                "tools_involved": s.tools_involved,
                "suggested_integration": s.suggested_integration,
                "confidence": s.confidence,
                "is_dismissed": s.is_dismissed,
                "is_applied": s.is_applied,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in db.query(Suggestion).filter(Suggestion.user_id == current_user.id).all()
        ],
        "workflows": [
            {
                "id": str(w.id),
                "name": w.name,
                "description": w.description,
                "trigger_config": w.trigger_config,
                "steps": w.steps,
                "is_active": w.is_active,
                "created_at": w.created_at.isoformat() if w.created_at else None
            }
            for w in db.query(Workflow).filter(Workflow.user_id == current_user.id).all()
        ],
        "sessions": [
            {
                "id": str(s.id),
                "device_info": s.device_info,
                "ip_address": s.ip_address,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "last_used_at": s.last_used_at.isoformat() if s.last_used_at else None,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None
            }
            for s in db.query(UserSession).filter(UserSession.user_id == current_user.id).all()
        ]
    }
    
    # Log export
    log_audit(
        db=db,
        action="data_export",
        resource_type="data",
        user_id=current_user.id,
        details={"format": format, "event_count": len(user_data["events"])}
    )
    
    if format == "json":
        # Return JSON directly
        return Response(
            content=json.dumps(user_data, indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=floyo_data_export_{datetime.utcnow().strftime('%Y%m%d')}.json"}
        )
    else:
        # Create ZIP file
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr("user_data.json", json.dumps(user_data, indent=2, default=str))
            # Add separate files for easier reading
            zip_file.writestr("events.json", json.dumps(user_data["events"], indent=2, default=str))
            zip_file.writestr("patterns.json", json.dumps(user_data["patterns"], indent=2, default=str))
            zip_file.writestr("suggestions.json", json.dumps(user_data["suggestions"], indent=2, default=str))
            zip_file.writestr("workflows.json", json.dumps(user_data["workflows"], indent=2, default=str))
        
        zip_buffer.seek(0)
        
        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=floyo_data_export_{datetime.utcnow().strftime('%Y%m%d')}.zip"}
        )


@router.post("/data/sample")
@limiter.limit("10/hour")  # Restrictive for sample data generation
async def generate_sample_data(
    request: Request,
    events_count: int = 20,
    suggestions_count: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate sample data for testing.
    
    Create sample events and suggestions to explore Floyo's features.
    """
    generator = SampleDataGenerator(db)
    result = generator.generate_sample_data(
        user_id=current_user.id,
        events_count=events_count,
        suggestions_count=suggestions_count
    )
    return result


@router.delete("/data/delete")
@limiter.limit("1/hour")  # Very restrictive - destructive operation
async def delete_all_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete all user data (GDPR right to be forgotten).
    
    Permanently delete all your data from Floyo. This action cannot be undone.
    """
    # Delete all user data
    db.query(Event).filter(Event.user_id == current_user.id).delete()
    db.query(Pattern).filter(Pattern.user_id == current_user.id).delete()
    db.query(Suggestion).filter(Suggestion.user_id == current_user.id).delete()
    db.query(Workflow).filter(Workflow.user_id == current_user.id).delete()
    db.query(UserSession).filter(UserSession.user_id == current_user.id).delete()
    db.query(UserConfig).filter(UserConfig.user_id == current_user.id).delete()
    
    db.commit()
    
    log_audit(
        db=db,
        action="data_deletion",
        resource_type="data",
        user_id=current_user.id,
        details={"deleted_all": True}
    )
    
    return {"message": "All data deleted successfully"}


@router.post("/data/retention/cleanup")
@limiter.limit("5/hour")
async def cleanup_user_data(
    request: Request,
    dry_run: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clean up user data according to retention policy."""
    from backend.data_retention import get_retention_policy
    policy = get_retention_policy()
    results = policy.cleanup_user_data(db, current_user.id, dry_run=dry_run)
    
    log_audit(
        db=db,
        action="data_retention_cleanup",
        resource_type="data",
        user_id=current_user.id,
        details={"dry_run": dry_run, "results": results}
    )
    
    return results


@router.get("/audit-logs")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_audit_logs(
    request: Request,
    organization_id: Optional[UUID] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit logs.
    
    View audit trail of actions performed in your account or organization.
    """
    # Only allow access if user is admin/owner
    if organization_id:
        membership = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == current_user.id
        ).first()
        
        if not membership or membership.role not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    logs = query_audit_logs(
        db=db,
        organization_id=organization_id,
        user_id=current_user.id if not organization_id else None,
        limit=limit,
        offset=offset
    )
    
    return logs
