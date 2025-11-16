# Workflow Engine Usage Guide

**Last Updated:** 2025-01-XX  
**Status:** Complete Implementation

---

## Quick Start

### 1. Enable Tracking

The tracking is automatically enabled when the app loads via `DiagnosticWorkflowTracker` component.

### 2. Build Workflow Model

```python
from backend.ml.workflow_model_builder import get_workflow_model_builder

builder = get_workflow_model_builder()

model = builder.analyze_interactions(
    interactions=interactions,      # From overlay diagnostics
    telemetry_events=telemetry,      # From telemetry system
    cookie_data=cookies              # From cookie tracker
)
```

### 3. Get Recommendations

```python
from backend.ml.recommendation_engine import get_recommendation_engine

engine = get_recommendation_engine()

recommendations = engine.generate_recommendations(
    workflow_candidates=model['workflow_candidates'],
    patterns=model['patterns'],
    user_preferences=None  # Optional
)
```

### 4. Generate Workflow

```python
from backend.ml.automation_generator import get_automation_generator

generator = get_automation_generator()

result = generator.generate_workflow(
    workflow_model=model,
    user_id='user_123',
    integration_preferences=['zapier', 'mindstudio']
)
```

---

## API Usage

### Build Model

```bash
POST /api/v1/workflows/build-model
{
  "userId": "user_123",
  "timeRange": "30d",
  "includeCookies": true,
  "includeIndirectInputs": true
}
```

### Get Recommendations

```bash
GET /api/v1/workflows/recommendations/user_123
```

### Analyze Gaps

```bash
GET /api/v1/workflows/gap-analysis/user_123
```

---

## Data Flow

1. **User interacts** → Overlay diagnostics captured
2. **Cookies change** → Cookie tracker captures
3. **Telemetry events** → System tracks
4. **Data sent to API** → Stored in database
5. **Model built** → Patterns extracted
6. **Recommendations generated** → Prioritized and scored
7. **Workflows created** → Ready for automation

---

## Pattern Types Detected

- **Repetitive:** Frequently repeated sequences
- **Temporal:** Peak hours, days, time patterns
- **Contextual:** Overlay, page, target patterns
- **Correlation:** Relationships between data sources

---

## Integration Support

- **Zapier:** Modal and dropdown automation
- **MindStudio:** Complex multi-step workflows
- **TikTok Ads:** Ad campaign automation
- **Meta Ads:** Facebook/Instagram automation

---

**For detailed API documentation, see:** `docs/API_ENDPOINTS_COMPLETE.md`
