"""
Migration: Add performance indexes for frequently queried columns
Run with: alembic upgrade head (if using Alembic) or execute directly
"""

# This would typically be an Alembic migration, but for now it's a standalone script

ADD_INDEXES_SQL = """
-- Index for events.event_type (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type) WHERE event_type IS NOT NULL;

-- Index for events.tool (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_events_tool ON events(tool) WHERE tool IS NOT NULL;

-- Composite index for workflows by user and active status
CREATE INDEX IF NOT EXISTS idx_workflows_user_active ON workflows(user_id, is_active) WHERE is_active = true;

-- Index for user sessions by user and expiry
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON user_sessions(user_id, expires_at);

-- Composite index for user integrations by user and active status
CREATE INDEX IF NOT EXISTS idx_integrations_user_active ON user_integrations(user_id, is_active) WHERE is_active = true;

-- Index for audit logs by resource type and created_at (for filtering)
CREATE INDEX IF NOT EXISTS idx_audit_resource_created ON audit_logs(resource_type, created_at);

-- Index for organization members by organization and role (for permission checks)
CREATE INDEX IF NOT EXISTS idx_org_member_role ON organization_members(organization_id, role);
"""

if __name__ == "__main__":
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    
    from backend.database import engine
    from sqlalchemy import text
    
    with engine.connect() as conn:
        conn.execute(text(ADD_INDEXES_SQL))
        conn.commit()
        print("Indexes created successfully")
