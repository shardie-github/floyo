"""
Audit Logging Service
Comprehensive audit logging for security and compliance.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import Request
from database.models import AuditLog
from backend.logging_config import get_logger

logger = get_logger(__name__)


def log_audit(
    db: Session,
    action: str,
    resource_type: str,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    request: Optional[Request] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    Log an audit event.
    
    Args:
        db: Database session
        action: Action performed (create, update, delete, read, etc.)
        resource_type: Type of resource (user, workflow, integration, etc.)
        user_id: User ID performing the action
        organization_id: Organization ID (if applicable)
        resource_id: Resource ID being acted upon
        request: FastAPI request object (for extracting IP, user agent)
        metadata: Additional metadata
        ip_address: IP address (extracted from request if not provided)
        user_agent: User agent (extracted from request if not provided)
    
    Returns:
        Created audit log entry
    """
    # Extract IP and user agent from request if available
    if request:
        if not ip_address:
            ip_address = request.client.host if request.client else None
        if not user_agent:
            user_agent = request.headers.get('user-agent')
    
    audit_log = AuditLog(
        user_id=user_id,
        organization_id=organization_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata or {},
        timestamp=datetime.utcnow(),
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    logger.info(
        f"Audit log: action={action}, resource_type={resource_type}, "
        f"user_id={user_id}, resource_id={resource_id}"
    )
    
    return audit_log


def get_audit_logs(
    db: Session,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[AuditLog]:
    """
    Query audit logs.
    
    Args:
        db: Database session
        user_id: Filter by user ID
        organization_id: Filter by organization ID
        resource_type: Filter by resource type
        action: Filter by action
        limit: Maximum number of results
        offset: Offset for pagination
    
    Returns:
        List of audit log entries
    """
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if organization_id:
        query = query.filter(AuditLog.organization_id == organization_id)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(AuditLog.action == action)
    
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset).all()
