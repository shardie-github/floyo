# Testing Guide

**Last Updated:** 2025-01-XX  
**Status:** ✅ Complete  
**Purpose:** Comprehensive testing guide for Floyo

---

## Testing Philosophy

We follow a **test pyramid** approach:
- **Unit Tests** (70%) - Fast, isolated, test individual functions
- **Integration Tests** (20%) - Test component interactions
- **E2E Tests** (10%) - Test full user flows

---

## Running Tests

### Backend Tests (Python)

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=backend --cov-report=html

# Run specific test file
pytest tests/backend/test_event_service.py -v

# Run specific test
pytest tests/backend/test_event_service.py::test_create_event -v

# Run with verbose output
pytest tests/ -v -s
```

### Frontend Tests (TypeScript/React)

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- test-file.test.tsx
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- tests/e2e/login.spec.ts
```

---

## Writing Tests

### Backend Unit Test Example

```python
import pytest
from backend.services.event_service import EventService
from database.models import Event

def test_create_event(db_session):
    """Test creating an event."""
    service = EventService(db_session)
    
    event_data = {
        "user_id": "123",
        "event_type": "file_opened",
        "file_path": "/path/to/file.py",
    }
    
    event = service.create_event(event_data)
    
    assert event.id is not None
    assert event.event_type == "file_opened"
    assert event.file_path == "/path/to/file.py"
```

### Frontend Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { EventList } from '@/components/EventList';

describe('EventList', () => {
  it('renders events correctly', () => {
    const events = [
      { id: '1', event_type: 'file_opened', file_path: '/test.py' },
    ];
    
    render(<EventList events={events} />);
    
    expect(screen.getByText('file_opened')).toBeInTheDocument();
    expect(screen.getByText('/test.py')).toBeInTheDocument();
  });
});
```

### API Integration Test Example

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

---

## Test Coverage Goals

- **Overall Coverage:** > 70%
- **Critical Paths:** > 90%
- **Business Logic:** > 80%
- **API Endpoints:** > 85%

### Check Coverage

```bash
# Backend
pytest tests/ --cov=backend --cov-report=term-missing

# Frontend
cd frontend && npm test -- --coverage
```

---

## Test Data Management

### Fixtures

```python
# conftest.py
import pytest
from database.models import User

@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    return user
```

### Factories

```python
# tests/factories.py
def create_event(user_id: str, **kwargs):
    """Create a test event."""
    return Event(
        user_id=user_id,
        event_type=kwargs.get("event_type", "file_opened"),
        file_path=kwargs.get("file_path", "/test.py"),
        **kwargs
    )
```

---

## Mocking External Services

### Mock HTTP Requests

```python
from unittest.mock import patch
import requests

@patch('requests.get')
def test_external_api_call(mock_get):
    """Test external API call with mock."""
    mock_get.return_value.json.return_value = {"status": "ok"}
    
    response = call_external_api()
    
    assert response["status"] == "ok"
    mock_get.assert_called_once()
```

### Mock Database

```python
from unittest.mock import Mock

def test_service_with_mock_db():
    """Test service with mocked database."""
    mock_db = Mock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    service = EventService(mock_db)
    result = service.get_event("123")
    
    assert result is None
```

---

## Performance Testing

### Load Testing

```bash
# Run benchmark script
python scripts/benchmark.py \
  --base-url http://localhost:8000 \
  --endpoints /health /api/v1/events \
  --requests 1000 \
  --concurrency 50
```

### Stress Testing

```bash
# Use k6 for stress testing
k6 run k6/stress-test.js
```

---

## Test Best Practices

1. **Test Behavior, Not Implementation**
   - Test what the code does, not how it does it
   - Focus on outcomes, not internals

2. **Keep Tests Fast**
   - Unit tests should run in milliseconds
   - Use mocks for slow operations
   - Avoid database in unit tests

3. **Make Tests Independent**
   - Each test should be able to run alone
   - Don't rely on test execution order
   - Clean up after each test

4. **Use Descriptive Names**
   ```python
   # ❌ Bad
   def test_1():
   
   # ✅ Good
   def test_create_event_with_valid_data():
   ```

5. **Follow AAA Pattern**
   - **Arrange:** Set up test data
   - **Act:** Execute the code under test
   - **Assert:** Verify the results

6. **Test Edge Cases**
   - Empty inputs
   - Null values
   - Boundary conditions
   - Error conditions

---

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every commit to main
- Nightly builds

### CI Configuration

See `.github/workflows/ci.yml` for CI configuration.

---

## Debugging Tests

### Backend

```bash
# Run with debugger
pytest tests/ --pdb

# Print output
pytest tests/ -s

# Show local variables on failure
pytest tests/ -l
```

### Frontend

```bash
# Run with debugger
npm test -- --no-coverage --verbose

# Use React Testing Library debug
screen.debug()
```

---

## Test Maintenance

- **Review tests regularly** - Remove obsolete tests
- **Update tests with code changes** - Keep tests in sync
- **Refactor tests** - Keep them maintainable
- **Document complex tests** - Add comments for clarity

---

**Generated by:** Post-Sprint Elevation Agent  
**Status:** ✅ Testing Guide Complete
