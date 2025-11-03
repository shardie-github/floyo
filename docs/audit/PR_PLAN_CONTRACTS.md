# PR Plan — Contract Conformance

## Overview
This PR ensures API contracts match implementation, adds missing endpoints, and fixes schema/documentation mismatches.

## Proposed Branch Name
`fix/contract-conformance-and-missing-endpoints`

## Files to Touch

### New Files
- `tests/test_openapi_schema.py` - OpenAPI schema validation tests
- `tests/test_database_schema.py` - Database schema validation tests
- `tests/test_endpoint_responses.py` - Endpoint response validation tests

### Modified Files
1. `backend/main.py`
   - Add missing endpoints (organizations, integrations, workflows)
   - Fix response schemas
   - Add rate limit headers

2. `backend/api_v1.py`
   - Implement versioned routes (or remove stub)

3. `database/schema.sql`
   - Update to match models.py (or archive)

4. `migrations/`
   - Add missing migrations for organizations, etc.

5. `docs/API.md` (new)
   - API documentation

## Implementation Details

### 1. API Versioning

**Option A: Implement Versioning**
**File:** `backend/api_v1.py`
```python
from fastapi import APIRouter
from backend.main import register, login, get_current_user_info, ...

api_v1_router = APIRouter(prefix="/api/v1", tags=["v1"])

# Move routes from main.py
api_v1_router.post("/auth/register", response_model=UserResponse)(register)
api_v1_router.post("/auth/login", response_model=Token)(login)
# ... etc
```

**Option B: Remove Versioning Stub**
**File:** `backend/main.py`
```python
# Remove api_v1_router import and mount
# Remove api_v1.py import
```

**Decision:** Choose Option A (implement) or Option B (remove)

### 2. Add Missing Endpoints

#### Organization Endpoints

**File:** `backend/main.py`
```python
@app.put("/api/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an organization."""
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

@app.delete("/api/organizations/{org_id}")
async def delete_organization(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an organization."""
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
```

#### Integration Endpoints

**File:** `backend/main.py`
```python
@app.get("/api/integrations")
async def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user integrations."""
    integrations = db.query(UserIntegration).filter(
        UserIntegration.user_id == current_user.id
    ).all()
    return integrations

@app.get("/api/integrations/{integration_id}")
async def get_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration details."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id,
        UserIntegration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return integration

@app.put("/api/integrations/{integration_id}")
async def update_integration(
    integration_id: UUID,
    integration_data: IntegrationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an integration."""
    # Implementation
    pass

@app.delete("/api/integrations/{integration_id}")
async def delete_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an integration."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id,
        UserIntegration.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db.delete(integration)
    db.commit()
    return {"message": "Integration deleted successfully"}

@app.post("/api/integrations/{integration_id}/test")
async def test_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test an integration connection."""
    # Implementation
    pass
```

#### Workflow Endpoints

**File:** `backend/main.py`
```python
@app.get("/api/workflows")
async def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user workflows."""
    workflows = db.query(Workflow).filter(
        Workflow.user_id == current_user.id
    ).all()
    return workflows

@app.get("/api/workflows/{workflow_id}")
async def get_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workflow details."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow

@app.put("/api/workflows/{workflow_id}")
async def update_workflow(
    workflow_id: UUID,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a workflow."""
    # Implementation
    pass

@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a workflow."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted successfully"}

@app.get("/api/workflows/{workflow_id}/versions")
async def list_workflow_versions(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List workflow versions."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    versions = db.query(WorkflowVersion).filter(
        WorkflowVersion.workflow_id == workflow_id
    ).order_by(WorkflowVersion.version_number.desc()).all()
    
    return versions
```

### 3. Add Rate Limit Headers

**File:** `backend/main.py`
**Add middleware or update rate limit handler:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

@app.middleware("http")
async def add_rate_limit_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Get rate limit info from limiter
    limiter_key = get_remote_address(request)
    rate_limit_info = limiter.get_window_stats(limiter_key)
    
    if rate_limit_info:
        response.headers["X-RateLimit-Limit"] = str(rate_limit_info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(rate_limit_info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(rate_limit_info["reset"])
    
    return response
```

### 4. Fix Schema.sql

**Option A: Generate from Models**
**File:** `scripts/generate_schema.py` (new)
```python
from database.models import Base
from sqlalchemy.schema import CreateTable

def generate_schema():
    """Generate schema.sql from models."""
    # Implementation
    pass
```

**Option B: Archive schema.sql**
**File:** `database/schema.sql.archive`
- Move `schema.sql` to archive
- Document that schema is generated from models

**Decision:** Choose Option A or Option B

### 5. Add Missing Migrations

**File:** `migrations/add_organizations.py` (new)
```python
"""Add organizations, audit logs, workflow versions, etc."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        # ... etc
    )
    # Add other missing tables
```

## Test Additions

### OpenAPI Schema Tests

**File:** `tests/test_openapi_schema.py` (new)
```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_openapi_schema_exists():
    """Test that OpenAPI schema is generated."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "paths" in schema
    assert "components" in schema

def test_all_endpoints_in_schema():
    """Test that all endpoints are in OpenAPI schema."""
    response = client.get("/openapi.json")
    schema = response.json()
    paths = schema["paths"]
    
    # Check key endpoints
    assert "/api/auth/register" in paths
    assert "/api/auth/login" in paths
    assert "/api/events" in paths
    # ... etc
```

### Database Schema Tests

**File:** `tests/test_database_schema.py` (new)
```python
import pytest
from database.models import Base
from sqlalchemy import inspect

def test_all_models_have_tables():
    """Test that all models have corresponding tables."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    # Check key tables
    assert "users" in tables
    assert "events" in tables
    assert "organizations" in tables
    # ... etc
```

### Endpoint Response Tests

**File:** `tests/test_endpoint_responses.py` (new)
```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_register_response_schema():
    """Test that register endpoint returns correct schema."""
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "email" in data
    assert "created_at" in data
```

## Rollout Plan

### Phase 1: Add Missing Endpoints (Week 1)
1. Add organization endpoints
2. Add integration endpoints
3. Add workflow endpoints
4. Add tests

### Phase 2: Fix Schema Issues (Week 1)
1. Update schema.sql or archive
2. Add missing migrations
3. Test migrations

### Phase 3: Add Contract Tests (Week 2)
1. Add OpenAPI schema tests
2. Add database schema tests
3. Add endpoint response tests

### Phase 4: Documentation (Week 2)
1. Update API documentation
2. Document new endpoints
3. Update OpenAPI schema

## Success Criteria

- [ ] All missing endpoints implemented
- [ ] OpenAPI schema matches implementation
- [ ] Database schema matches models
- [ ] All contract tests pass
- [ ] API documentation updated

## Estimated Effort

- **Implementation:** 3-5 days
- **Testing:** 2 days
- **Documentation:** 1 day
- **Total:** 6-8 days (1.5-2 weeks)
