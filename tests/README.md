# Test Suite Documentation

## Backend Tests

### Setup

```bash
cd backend
pip install -r ../requirements.txt
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test file
pytest tests/backend/test_event_service.py

# Run with verbose output
pytest -v
```

### Test Structure

- `tests/backend/` - Backend unit and integration tests
  - `test_event_service.py` - Event service tests
  - `test_pattern_service.py` - Pattern service tests
  - `test_telemetry_api.py` - Telemetry API tests
  - `test_pattern_detection_job.py` - Pattern detection job tests
- `tests/integration/` - Integration tests
  - `test_telemetry_flow.py` - End-to-end telemetry flow

## Frontend Tests

### Setup

```bash
cd frontend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Test Structure

- `tests/frontend/` - Frontend unit tests
  - `store.test.ts` - Zustand store tests
  - `components/Dashboard.test.tsx` - Dashboard component tests

## Test Coverage Goals

- **Backend:** 60%+ coverage for service layer
- **Frontend:** 60%+ coverage for components and hooks
- **Integration:** All critical flows covered

## Writing Tests

### Backend Test Example

```python
def test_create_event(event_service, user_id, db_session):
    event = event_service.create_event(
        user_id=user_id,
        event_type="file_created",
        file_path="/test/file.ts",
    )
    assert event.id is not None
    assert event.user_id == user_id
```

### Frontend Test Example

```typescript
it('should update user', () => {
  const { result } = renderHook(() => useAppStore());
  
  act(() => {
    result.current.setUser({
      id: 'user-1',
      email: 'test@example.com',
    });
  });
  
  expect(result.current.user?.id).toBe('user-1');
});
```
