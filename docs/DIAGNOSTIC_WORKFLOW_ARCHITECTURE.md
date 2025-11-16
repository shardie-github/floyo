# Diagnostic Workflow Automation Architecture

**Last Updated:** 2025-01-XX  
**Status:** Complete Implementation

---

## Overview

This document describes the complete architecture for the diagnostic workflow automation tool that captures overlay diagnostics, user behaviors, app telemetry, and cookies to build workflow models and generate automation recommendations.

---

## Architecture Flow

```
User Interactions
    ↓
Overlay Diagnostics Tracker (Frontend)
    ↓
Cookie/Indirect Input Tracker (Frontend)
    ↓
Telemetry API Endpoints
    ↓
Database (telemetry_events table)
    ↓
Workflow Model Builder (Backend ML)
    ↓
Automation Generator (Backend ML)
    ↓
Workflow Recommendations API
    ↓
Frontend Display
```

---

## Components

### 1. Frontend Tracking

#### Overlay Diagnostics Tracker
**File:** `frontend/lib/telemetry/overlay-diagnostics.ts`

**Purpose:** Captures detailed interaction diagnostics from overlays, modals, tooltips, dropdowns, and all UI interactions.

**Tracks:**
- Click events
- Hover events
- Focus/blur events
- Keyboard events
- Scroll events
- Resize events
- Overlay context (modal, tooltip, dropdown, etc.)
- Target information (tag, id, class, role, aria-label)
- Position and viewport information
- Session and user context

**Features:**
- Automatic overlay detection
- Pattern analysis
- Statistics generation
- Batch sending to server

#### Cookie Tracker
**File:** `frontend/lib/telemetry/cookie-tracker.ts`

**Purpose:** Tracks cookies, referrers, UTM parameters, and other indirect inputs.

**Tracks:**
- Cookies (name, value, domain, path, security attributes)
- Referrers (URL, domain)
- UTM parameters
- Query parameters
- localStorage keys (privacy-safe)
- sessionStorage keys (privacy-safe)

**Features:**
- Periodic capture (every 30 seconds)
- Privacy-safe (doesn't capture sensitive values)
- Batch sending to server

### 2. API Endpoints

#### Overlay Diagnostics API
**File:** `frontend/app/api/telemetry/overlay-diagnostics/route.ts`

**Endpoint:** `POST /api/telemetry/overlay-diagnostics`

**Purpose:** Receives overlay interaction diagnostics and stores them.

**Payload:**
```json
{
  "interactions": [...],
  "sessionId": "session_123",
  "userId": "user_456"
}
```

#### Indirect Inputs API
**File:** `frontend/app/api/telemetry/indirect-inputs/route.ts`

**Endpoint:** `POST /api/telemetry/indirect-inputs`

**Purpose:** Receives cookie and indirect input data.

**Payload:**
```json
{
  "data": [...],
  "timestamp": 1234567890
}
```

### 3. Backend ML Components

#### Workflow Model Builder
**File:** `backend/ml/workflow_model_builder.py`

**Purpose:** Analyzes telemetry, overlay diagnostics, user behaviors, and cookies to build workflow models.

**Features:**
- Pattern extraction from interactions
- Pattern extraction from telemetry
- Pattern extraction from cookies
- Sequence building
- Workflow candidate identification
- Automation recommendation generation

**Methods:**
- `analyze_interactions()` - Main analysis method
- `_extract_interaction_patterns()` - Extract patterns from interactions
- `_extract_telemetry_patterns()` - Extract patterns from telemetry
- `_extract_cookie_patterns()` - Extract patterns from cookies
- `_build_sequences()` - Build workflow sequences
- `_identify_workflow_candidates()` - Identify automation candidates
- `_generate_automation_recommendations()` - Generate recommendations

#### Automation Generator
**File:** `backend/ml/automation_generator.py`

**Purpose:** Generates automation workflows from workflow models.

**Features:**
- Workflow definition generation
- Integration selection
- Trigger generation
- Step generation
- Condition generation
- Error handling configuration

**Methods:**
- `generate_workflow()` - Generate workflow from model
- `_create_workflow_definition()` - Create workflow definition
- `_determine_integration()` - Select best integration
- `_generate_triggers()` - Generate workflow triggers
- `_generate_steps()` - Generate workflow steps

### 4. Workflow Automation API

**File:** `backend/api_v1_workflow_automation.py`

**Endpoints:**
- `POST /api/v1/workflows/build-model` - Build workflow model
- `POST /api/v1/workflows/generate` - Generate automation workflow
- `GET /api/v1/workflows/recommendations/{userId}` - Get recommendations

---

## Data Flow

### 1. Data Collection

1. **User interacts with UI**
   - Clicks, hovers, focuses, types, etc.
   - Overlay diagnostics tracker captures interaction

2. **Cookies/Indirect inputs change**
   - Cookie tracker captures state
   - Referrers, UTM params tracked

3. **Batch sending**
   - Interactions batched (every 10 interactions or 5 seconds)
   - Cookies batched (every 30 seconds)
   - Sent to API endpoints

### 2. Data Storage

1. **API receives data**
   - Validates payload
   - Stores in `telemetry_events` table
   - Metadata stored as JSON

2. **Database structure**
   - `telemetry_events` table stores all diagnostics
   - `appId` field distinguishes data types:
     - `overlay-diagnostics` for interactions
     - `indirect-inputs` for cookies/referrers
     - Other app IDs for telemetry

### 3. Model Building

1. **Fetch data from database**
   - Query `telemetry_events` by user and time range
   - Separate interactions, telemetry, cookies

2. **Analyze patterns**
   - Extract interaction patterns
   - Extract telemetry patterns
   - Extract cookie patterns
   - Combine patterns

3. **Build sequences**
   - Group events by time windows
   - Identify repeated sequences
   - Calculate frequencies

4. **Identify candidates**
   - Find frequently repeated sequences
   - Assess automation potential
   - Calculate confidence scores

### 4. Automation Generation

1. **Select best candidate**
   - Highest automation potential × confidence

2. **Generate workflow**
   - Create workflow definition
   - Determine integration
   - Generate triggers
   - Generate steps
   - Generate conditions
   - Configure error handling

3. **Return recommendations**
   - Workflow definition
   - Integration suggestions
   - Estimated time saved
   - Confidence score

---

## Privacy & Security

### Privacy Considerations

1. **No Content Tracking**
   - Only tracks patterns, not content
   - File paths tracked, not file contents
   - Cookie names tracked, not sensitive values

2. **User Control**
   - Users can disable tracking
   - Privacy preferences respected
   - Data retention policies applied

3. **Data Minimization**
   - Only necessary data collected
   - Redacted metadata stored
   - Automatic cleanup

### Security Considerations

1. **Authentication**
   - All API endpoints require authentication
   - User data isolated by user ID
   - RLS policies enforce access control

2. **Data Encryption**
   - Data encrypted in transit (TLS)
   - Data encrypted at rest (database)
   - Sensitive fields encrypted

3. **Input Validation**
   - All inputs validated
   - SQL injection prevention
   - XSS prevention

---

## Integration Support

### Supported Integrations

1. **Zapier**
   - General workflow automation
   - Modal interactions
   - Form submissions

2. **MindStudio**
   - AI-powered workflows
   - Dropdown selections
   - Complex automations

3. **TikTok Ads**
   - Ad campaign automation
   - Performance tracking

4. **Meta Ads**
   - Facebook/Instagram ad automation
   - Campaign management

### Integration Selection Logic

1. **Check recommendation suggestions**
   - Use AI-suggested integrations
   - Prefer user preferences

2. **Analyze workflow patterns**
   - Overlay types used
   - App usage patterns
   - Event types

3. **Default fallback**
   - Zapier for general automation
   - MindStudio for AI workflows

---

## Usage Examples

### Frontend: Start Tracking

```typescript
import { DiagnosticWorkflowTracker } from '@/components/DiagnosticWorkflowTracker';

// Component automatically starts tracking when mounted
<DiagnosticWorkflowTracker />
```

### Backend: Build Workflow Model

```python
from backend.ml.workflow_model_builder import get_workflow_model_builder

builder = get_workflow_model_builder()
model = builder.analyze_interactions(
    interactions=interactions,
    telemetry_events=telemetry_events,
    cookie_data=cookie_data
)
```

### Backend: Generate Workflow

```python
from backend.ml.automation_generator import get_automation_generator

generator = get_automation_generator()
result = generator.generate_workflow(
    workflow_model=model,
    user_id="user_123",
    integration_preferences=["zapier", "mindstudio"]
)
```

### API: Get Recommendations

```bash
curl -X GET \
  https://your-app.vercel.app/api/v1/workflows/recommendations/user_123 \
  -H "Authorization: Bearer <token>"
```

---

## Performance Considerations

### Frontend Optimization

1. **Batch Sending**
   - Interactions batched (10 at a time)
   - Reduces API calls
   - Improves performance

2. **Memory Management**
   - Only last 1000 interactions in memory
   - Automatic cleanup
   - Periodic flushing

3. **Event Delegation**
   - Efficient event listeners
   - Minimal performance impact
   - Non-blocking operations

### Backend Optimization

1. **Lazy Loading**
   - Data fetched on demand
   - Caching where appropriate
   - Efficient queries

2. **Pattern Analysis**
   - Incremental analysis
   - Cached patterns
   - Optimized algorithms

3. **Workflow Generation**
   - Cached models
   - Incremental generation
   - Efficient processing

---

## Testing

### Unit Tests

- Overlay diagnostics tracker
- Cookie tracker
- Workflow model builder
- Automation generator

### Integration Tests

- API endpoints
- Database operations
- End-to-end workflow

### E2E Tests

- Tracking initialization
- Data collection
- Model building
- Workflow generation

---

## Monitoring & Observability

### Metrics

- Interactions tracked per user
- Patterns identified
- Workflows generated
- Recommendations provided
- Time saved estimates

### Logging

- Tracking events
- Model building
- Workflow generation
- Errors and exceptions

### Alerts

- High error rates
- Performance degradation
- Data quality issues

---

## Future Enhancements

1. **Real-time Analysis**
   - Stream processing
   - Real-time pattern detection
   - Instant recommendations

2. **Advanced ML**
   - Deep learning models
   - Predictive analytics
   - Personalized recommendations

3. **More Integrations**
   - Additional automation platforms
   - Custom integrations
   - API integrations

4. **Visual Workflow Builder**
   - Drag-and-drop interface
   - Visual workflow editing
   - Preview and testing

---

## Conclusion

The diagnostic workflow automation architecture provides a complete end-to-end solution for:

1. ✅ **Capturing overlay diagnostics** from user interactions
2. ✅ **Tracking cookies and indirect inputs** for context
3. ✅ **Building workflow models** from patterns
4. ✅ **Generating automation recommendations** based on usage
5. ✅ **Supporting multiple integrations** (Zapier, MindStudio, etc.)
6. ✅ **Privacy-first design** with user control
7. ✅ **Scalable architecture** for production use

The system is **feasible and works in practice** for all sorts of cookies, telemetry, and indirect/direct user inputs and behaviors.

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Complete and Production-Ready
