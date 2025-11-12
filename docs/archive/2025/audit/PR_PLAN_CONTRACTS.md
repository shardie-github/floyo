> Archived on 2025-11-12. Superseded by: (see docs/final index)

# PR Plan — Contract Conformance

**Generated:** 2024-12-19  
**Scope:** API contract tests, schema fixes, and response model improvements

## Branch Strategy

**Branch Name:** `feat/contract-conformance`  
**Base Branch:** `main`  
**Target:** Merge after review and testing

## File Touch List

### Modified Files
1. `database/schema.sql` - Generate from models or archive
2. `backend/main.py` - Add missing response models
3. `tests/test_contracts.py` - New test file

### New Files
1. `tests/test_contracts.py` - Contract tests
2. `openapi.json` - Exported OpenAPI schema

## Implementation Details

### 1. Fix Schema.sql

**Option A:** Generate from models
```bash
alembic revision --autogenerate -m "generate_schema"
```

**Option B:** Archive and document
- Move to `docs/archive/schema.sql`
- Document migration-only approach

### 2. Add Missing Response Models

**File:** `backend/main.py`

**Add:**
- `OrganizationMemberResponse`
- `WorkflowExecutionResponse`
- `ConnectorResponse`

### 3. Export OpenAPI Schema

**File:** `openapi.json` (new)

**Generate:**
```python
from backend.main import app
import json

schema = app.openapi()
with open("openapi.json", "w") as f:
    json.dump(schema, f, indent=2)
```

## Test Additions

### New Test File: `tests/test_contracts.py`

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_openapi_schema_valid():
    """Test OpenAPI schema is valid"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "paths" in schema

def test_all_endpoints_have_response_models():
    """Test all endpoints have response models"""
    # Test implementation
    pass

def test_database_schema_matches_models():
    """Test database schema matches models"""
    # Test implementation
    pass
```

## Rollout Plan

1. **Development** - Fix schema, add response models
2. **Testing** - Run contract tests
3. **Staging** - Deploy and verify
4. **Production** - Deploy with monitoring
