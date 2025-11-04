# Privacy API Reference

## Guardian Events

### Creating Events

Guardian automatically tracks events through middleware, but you can also create events manually:

```python
from backend.guardian.service import get_guardian_service
from backend.guardian.events import DataScope, DataClass

guardian = get_guardian_service()

event = guardian.emit_event(
    event_type="custom_event",
    scope=DataScope.APP,
    data_class=DataClass.FILES,
    description="File access",
    data_touched={"file": "example.txt"},
    purpose="Normal operation",
    user_id=user_id,
)
```

### Event Types

- `api_call` - API requests
- `api_response` - API responses
- `telemetry_send` - Telemetry transmission
- `data_access` - Data access operations
- `external_api` - External API calls

### Data Scopes

- `DataScope.USER` - User's own data
- `DataScope.APP` - App internal operations
- `DataScope.API` - External API calls
- `DataScope.EXTERNAL` - Third-party services

### Data Classes

- `DataClass.TELEMETRY` - Usage analytics
- `DataClass.LOCATION` - Geographic data
- `DataClass.AUDIO` - Audio recordings
- `DataClass.VIDEO` - Video recordings
- `DataClass.BIOMETRICS` - Biometric data
- `DataClass.CREDENTIALS` - Authentication data
- `DataClass.PAYMENT` - Financial data
- `DataClass.HEALTH` - Health data

## Risk Assessment

### Risk Levels

- `RiskLevel.LOW` - Low risk (0.0-0.4)
- `RiskLevel.MEDIUM` - Medium risk (0.4-0.6)
- `RiskLevel.HIGH` - High risk (0.6-0.8)
- `RiskLevel.CRITICAL` - Critical risk (0.8-1.0)

### Response Actions

- `ResponseAction.ALLOW` - Allow access
- `ResponseAction.MASK` - Mask sensitive data
- `ResponseAction.REDACT` - Redact fields
- `ResponseAction.BLOCK` - Block access
- `ResponseAction.ALERT` - Alert user

## Trust Ledger

### Appending Events

Events are automatically appended to the ledger, but you can access it directly:

```python
from backend.guardian.ledger import TrustLedger

ledger = TrustLedger()
hash_value = ledger.append(event)
```

### Verification

```python
verification = ledger.verify(user_id)
if verification["valid"]:
    print("Ledger integrity verified")
```

### Daily Hash Roots

```python
daily_hash = ledger.get_daily_hash_root(user_id, date)
```

## Trust Fabric

### Learning from Decisions

```python
from backend.guardian.trust_fabric import TrustFabricAI

trust_fabric = TrustFabricAI(db, user_id)
trust_fabric.learn_from_event(event, user_decision="allow")
```

### Getting Recommendations

```python
recommendations = trust_fabric.get_recommendations()
```

### Export/Import

```python
# Export
model_data = trust_fabric.export_model()

# Import
trust_fabric.import_model(model_data)
```

## Guardian GPT

### Explaining Events

```python
from backend.guardian.explainer import GuardianGPT

explainer = GuardianGPT()
explanation = explainer.explain_event(event_id, user_id)
```

### Answering Questions

```python
answer = explainer.answer_question(
    "What data was used this week?",
    user_id
)
```

## Middleware Integration

Guardian middleware is automatically added to FastAPI:

```python
from backend.guardian.middleware import GuardianMiddleware

app.add_middleware(GuardianMiddleware)
```

Middleware automatically:
- Monitors API requests/responses
- Emits guardian events
- Applies risk assessment
- Blocks high-risk requests

## Best Practices

1. **Always provide purpose** - Explain why data is accessed
2. **Use appropriate scopes** - Choose correct DataScope
3. **Classify data correctly** - Select accurate DataClass
4. **Respect user decisions** - Honor allow/deny choices
5. **Monitor recommendations** - Check Trust Fabric suggestions
