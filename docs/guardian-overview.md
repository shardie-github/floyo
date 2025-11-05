# Guardian Privacy System Documentation

## Overview

The Privacy Guardian is a self-governing privacy monitoring system that continuously watches data access, assesses risk, explains actions to users, and builds trust through transparency.

## Architecture

### Core Components

1. **Guardian Service** (`backend/guardian/service.py`)
   - Emits and processes privacy events
   - Applies risk assessment and actions
   - Manages private mode and lockdown

2. **Policy Engine** (`backend/guardian/policies.py`)
   - Loads YAML policies
   - Assesses risk scores
   - Determines response actions

3. **Trust Ledger** (`backend/guardian/ledger.py`)
   - Append-only JSONL log
   - Hash-chained for integrity
   - Cryptographic verification

4. **Inspector** (`backend/guardian/inspector.py`)
   - Background analysis agent
   - Generates trust reports
   - Detects anomalies

5. **Trust Fabric AI** (`backend/guardian/trust_fabric.py`)
   - Learns user preferences
   - Adapts risk weights
   - Provides recommendations

6. **Guardian GPT** (`backend/guardian/explainer.py`)
   - Explains events in plain language
   - Answers user questions
   - Generates summaries

## Data Flow

```
User Action → Guardian Middleware → Guardian Service
                                    ↓
                            Policy Engine (Risk Assessment)
                                    ↓
                            Action Application (Allow/Mask/Block)
                                    ↓
                            Trust Ledger (Append)
                                    ↓
                            Database (Store Summary)
                                    ↓
                            Inspector (Analyze)
                                    ↓
                            Trust Dashboard (Display)
```

## API Endpoints

### Trust Summary
- `GET /api/guardian/trust-summary?days=7`
- Returns summary of data access events

### Events
- `GET /api/guardian/events` - List events
- `GET /api/guardian/event/{event_id}` - Event details
- `POST /api/guardian/event/{event_id}/decision` - Record user decision

### Settings
- `GET /api/guardian/settings` - Get settings
- `POST /api/guardian/settings/private-mode` - Toggle private mode
- `POST /api/guardian/settings/lockdown` - Toggle lockdown
- `POST /api/guardian/settings/trust-level` - Update trust level

### Verification
- `GET /api/guardian/verify` - Verify ledger integrity

### Trust Fabric
- `GET /api/guardian/recommendations` - Get recommendations
- `GET /api/guardian/trust-fabric/export` - Export model
- `POST /api/guardian/trust-fabric/import` - Import model

### Guardian GPT
- `POST /api/guardian/explain` - Answer question
- `GET /api/guardian/explain/event/{event_id}` - Explain event

## Policy Configuration

Policies are defined in YAML files under `guardian/policies/`:

```yaml
allowed_scopes:
  - user
  - app
  - api
  - external

data_classes:
  telemetry:
    risk: 0.2
  credentials:
    risk: 1.0
    requires_mfa: true
    block_external: true

risk_weights:
  scope: 0.3
  data_class: 0.4
  external: 0.3

response_actions:
  allow:
    threshold: 0.4
  block:
    threshold: 0.8
```

## Usage

### In Code

```python
from backend.guardian.service import get_guardian_service
from backend.guardian.events import DataScope, DataClass

guardian = get_guardian_service()

event = guardian.emit_event(
    event_type="api_call",
    scope=DataScope.EXTERNAL,
    data_class=DataClass.CREDENTIALS,
    description="External API call",
    data_touched={"endpoint": "/api/users"},
    purpose="User authentication",
    user_id=user_id,
)
```

### CLI Commands

```bash
# Verify ledger integrity
ops guardian:verify --user-id <user_id>

# Generate trust report
ops guardian:report --user-id <user_id>

# Run audit checks
ops guardian:audit
```

## Database Models

- `GuardianEvent` - Privacy monitoring events
- `TrustLedgerRoot` - Daily hash roots
- `TrustFabricModel` - User's AI model
- `GuardianSettings` - User settings

## Frontend Integration

The Trust Dashboard is available at `/dashboard/trust` and shows:
- Summary of data access
- Risk distribution
- Recent events
- Trust level controls
- Private mode toggle
- Emergency lockdown

## Security Features

1. **Private Mode Pulse** - Instant telemetry freeze
2. **Sensitive Context Detection** - Auto-mute when camera/mic active
3. **MFA Bubble** - Elevated sessions expire sooner on risk
4. **Emergency Lockdown** - 1-click killswitch

## Compliance

- All events logged immutably
- Hash-chained for tamper detection
- User-only access (RLS)
- Daily hash roots stored
- Export/import capabilities

## Testing

Run audit checks:
```bash
python ops/guardian/audit.py
```

Verify ledger:
```bash
python -m ops.guardian.cli verify --user-id <user_id>
```
