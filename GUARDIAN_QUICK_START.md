# Guardian Privacy System - Quick Start

## Overview

The Privacy Guardian is now fully integrated into your application. It continuously monitors data access, assesses risk, explains actions, and builds trust through transparency.

## Key Features

1. **Automatic Monitoring** - Middleware tracks all API calls
2. **Risk Assessment** - Each event is scored and classified
3. **Action Enforcement** - High-risk events are blocked/masked
4. **Transparency Dashboard** - Users see what data was accessed
5. **Trust Fabric AI** - Learns user preferences and adapts
6. **Guardian GPT** - Explains events in plain language
7. **Emergency Controls** - Private mode and lockdown

## Quick Access

- **Dashboard**: `/dashboard/trust`
- **API Base**: `/api/guardian`
- **Documentation**: `docs/guardian-overview.md`

## Usage Examples

### View Trust Summary
```bash
curl http://localhost:8000/api/guardian/trust-summary?days=7 \
  -H "Authorization: Bearer <token>"
```

### Toggle Private Mode
```bash
curl -X POST http://localhost:8000/api/guardian/settings/private-mode \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### Ask Guardian GPT
```bash
curl -X POST http://localhost:8000/api/guardian/explain \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What data was used this week?"}'
```

### Verify Ledger
```bash
curl http://localhost:8000/api/guardian/verify \
  -H "Authorization: Bearer <token>"
```

## Database Setup

Run migrations to create Guardian tables:
```bash
alembic revision --autogenerate -m "Add Guardian tables"
alembic upgrade head
```

## Testing

Run audit checks:
```bash
python ops/guardian/audit.py
```

## Configuration

Policy files are in `guardian/policies/`. Edit `default.yaml` to customize:
- Risk weights
- Data class classifications
- Response actions
- Thresholds

## Privacy Features

- **Private Mode**: Freezes telemetry instantly
- **Lockdown**: Emergency data lockdown
- **MFA Bubble**: Elevated sessions expire faster on risk
- **Sensitive Context**: Auto-mutes when camera/mic active

## User Experience

Users can:
1. View their privacy dashboard
2. See what data was accessed
3. Understand why actions were taken
4. Adjust trust levels
5. Export their Trust Fabric model
6. Ask questions about privacy

## Developer Notes

- Guardian events are automatically logged
- Policies are loaded from YAML files
- Ledger is append-only with hash chains
- All events are user-scoped (RLS)
- Trust Fabric adapts to user behavior

## Support

For questions or issues:
- Check `docs/guardian-overview.md`
- Review `docs/privacy-api-reference.md`
- Run `ops guardian:audit` for diagnostics
