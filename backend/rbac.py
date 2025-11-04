"""Role-Based Access Control (RBAC) utilities."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from database.models import User, OrganizationMember, Role


class Permission:
    """Permission constants."""
    # Events
    EVENT_VIEW = "event:view"
    EVENT_CREATE = "event:create"
    EVENT_UPDATE = "event:update"
    EVENT_DELETE = "event:delete"
    
    # Patterns
    PATTERN_VIEW = "pattern:view"
    PATTERN_CREATE = "pattern:create"
    PATTERN_UPDATE = "pattern:update"
    PATTERN_DELETE = "pattern:delete"
    
    # Workflows
    WORKFLOW_VIEW = "workflow:view"
    WORKFLOW_CREATE = "workflow:create"
    WORKFLOW_UPDATE = "workflow:update"
    WORKFLOW_DELETE = "workflow:delete"
    WORKFLOW_EXECUTE = "workflow:execute"
    
    # Organizations
    ORG_VIEW = "organization:view"
    ORG_UPDATE = "organization:update"
    ORG_DELETE = "organization:delete"
    ORG_MEMBER_INVITE = "organization:invite"
    ORG_MEMBER_REMOVE = "organization:remove"
    ORG_MEMBER_UPDATE_ROLE = "organization:update_role"
    
    # Integrations
    INTEGRATION_VIEW = "integration:view"
    INTEGRATION_CREATE = "integration:create"
    INTEGRATION_UPDATE = "integration:update"
    INTEGRATION_DELETE = "integration:delete"
    
    # Suggestions
    SUGGESTION_VIEW = "suggestion:view"
    SUGGESTION_APPLY = "suggestion:apply"
    
    # Admin
    ADMIN_ALL = "admin:all"


# Role permissions mapping
ROLE_PERMISSIONS = {
    "owner": [
        Permission.ADMIN_ALL,
    ],
    "admin": [
        Permission.EVENT_VIEW,
        Permission.EVENT_CREATE,
        Permission.EVENT_UPDATE,
        Permission.EVENT_DELETE,
        Permission.PATTERN_VIEW,
        Permission.PATTERN_CREATE,
        Permission.PATTERN_UPDATE,
        Permission.PATTERN_DELETE,
        Permission.WORKFLOW_VIEW,
        Permission.WORKFLOW_CREATE,
        Permission.WORKFLOW_UPDATE,
        Permission.WORKFLOW_DELETE,
        Permission.WORKFLOW_EXECUTE,
        Permission.ORG_VIEW,
        Permission.ORG_UPDATE,
        Permission.ORG_MEMBER_INVITE,
        Permission.ORG_MEMBER_REMOVE,
        Permission.ORG_MEMBER_UPDATE_ROLE,
        Permission.INTEGRATION_VIEW,
        Permission.INTEGRATION_CREATE,
        Permission.INTEGRATION_UPDATE,
        Permission.INTEGRATION_DELETE,
        Permission.SUGGESTION_VIEW,
        Permission.SUGGESTION_APPLY,
    ],
    "member": [
        Permission.EVENT_VIEW,
        Permission.EVENT_CREATE,
        Permission.EVENT_UPDATE,
        Permission.PATTERN_VIEW,
        Permission.PATTERN_CREATE,
        Permission.PATTERN_UPDATE,
        Permission.WORKFLOW_VIEW,
        Permission.WORKFLOW_CREATE,
        Permission.WORKFLOW_UPDATE,
        Permission.WORKFLOW_EXECUTE,
        Permission.ORG_VIEW,
        Permission.INTEGRATION_VIEW,
        Permission.INTEGRATION_CREATE,
        Permission.INTEGRATION_UPDATE,
        Permission.SUGGESTION_VIEW,
        Permission.SUGGESTION_APPLY,
    ],
    "viewer": [
        Permission.EVENT_VIEW,
        Permission.PATTERN_VIEW,
        Permission.WORKFLOW_VIEW,
        Permission.ORG_VIEW,
        Permission.INTEGRATION_VIEW,
        Permission.SUGGESTION_VIEW,
    ],
}


def get_user_permissions(user: User, organization_id: Optional[UUID] = None, db: Session = None) -> List[str]:
    """Get all permissions for a user, optionally scoped to an organization."""
    permissions = set()
    
    # Superusers have all permissions
    if user.is_superuser:
        permissions.add(Permission.ADMIN_ALL)
        return list(permissions)
    
    # If organization is specified, get role from organization membership
    if organization_id and db:
        membership = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user.id
        ).first()
        
        if membership:
            role_perms = ROLE_PERMISSIONS.get(membership.role, [])
            permissions.update(role_perms)
    
    # Always add basic user permissions (for personal workspace)
    permissions.update([
        Permission.EVENT_VIEW,
        Permission.EVENT_CREATE,
        Permission.EVENT_UPDATE,
        Permission.PATTERN_VIEW,
        Permission.PATTERN_CREATE,
        Permission.PATTERN_UPDATE,
        Permission.WORKFLOW_VIEW,
        Permission.WORKFLOW_CREATE,
        Permission.WORKFLOW_UPDATE,
        Permission.WORKFLOW_EXECUTE,
        Permission.SUGGESTION_VIEW,
        Permission.SUGGESTION_APPLY,
    ])
    
    return list(permissions)


def has_permission(user: User, permission: str, organization_id: Optional[UUID] = None, db: Session = None) -> bool:
    """Check if user has a specific permission."""
    permissions = get_user_permissions(user, organization_id, db)
    
    # Admin all permission grants everything
    if Permission.ADMIN_ALL in permissions:
        return True
    
    return permission in permissions


def require_permission(permission: str):
    """Decorator factory for permission checks."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be used with FastAPI dependencies
            # Implementation would extract user from context
            return func(*args, **kwargs)
        return wrapper
    return decorator
