# Remaining Development Tasks

This document outlines what still needs to be done to fully integrate and productionize the features we've implemented.

## ?? Critical - Integration & Wiring

### 1. Database Model Integration
**Status**: Models exist but aren't imported into main models.py
- [ ] Import FeatureFlag, FeatureFlagOverride from backend.feature_flags into database/models.py
- [ ] Import Experiment, ExperimentParticipation, ExperimentEvent from backend.experiments
- [ ] Import FraudScore from backend.fraud_scoring
- [ ] Run database migration: `alembic upgrade head`
- [ ] Verify tables are created in database

### 2. API Endpoints - Feature Flags
**Status**: Service exists, no API endpoints
- [ ] `GET /api/v1/feature-flags` - List all feature flags
- [ ] `GET /api/v1/feature-flags/{name}` - Get specific flag status
- [ ] `POST /api/v1/feature-flags` - Create new flag (admin only)
- [ ] `PUT /api/v1/feature-flags/{name}` - Update flag (admin only)
- [ ] `POST /api/v1/feature-flags/{name}/override` - Set user/org override
- [ ] Wire into `backend/main.py` or `backend/api_v1.py`

### 3. API Endpoints - Experiments
**Status**: Service exists, no API endpoints
- [ ] `GET /api/v1/experiments` - List experiments
- [ ] `GET /api/v1/experiments/{name}/variant` - Get user's variant
- [ ] `POST /api/v1/experiments/{name}/track` - Track experiment event
- [ ] `GET /api/v1/experiments/{name}/results` - Get experiment analytics (admin)
- [ ] `POST /api/v1/experiments` - Create experiment (admin only)

### 4. API Endpoints - Fraud Scoring
**Status**: Service exists, no API endpoints
- [ ] Integrate fraud scoring into event creation endpoint
- [ ] `GET /api/v1/fraud/risk-profile` - Get user's risk profile (admin)
- [ ] `POST /api/v1/fraud/scores/{id}/review` - Mark score as reviewed (admin)
- [ ] Add fraud scoring middleware to suspicious endpoints

### 5. Frontend i18n Integration
**Status**: Components exist but not wired
- [ ] Update `frontend/app/layout.tsx` to wrap with I18nProvider
- [ ] Configure next-intl routing in `next.config.js`
- [ ] Create language switcher component
- [ ] Update all components to use `useTranslations()` hook
- [ ] Add locale detection from browser/URL

### 6. Feature Flag Integration in App Logic
**Status**: Service exists, not used anywhere
- [ ] Check feature flags in event creation endpoint
- [ ] Check feature flags in dashboard rendering
- [ ] Add feature flag checks for new features
- [ ] Implement gradual rollout logic

## ?? Important - Enhancements

### 7. Fraud Scoring Integration
- [ ] Call `FraudDetectionService.calculate_risk_score()` in event creation
- [ ] Block or flag high-risk events automatically
- [ ] Send alerts for critical fraud scores
- [ ] Add fraud score to user profile/admin view

### 8. Experiment Integration
- [ ] Track experiment events automatically
- [ ] Show experiment variants in UI based on assignment
- [ ] Track conversions (clicks, signups, etc.)
- [ ] Create experiment dashboard/analytics page

### 9. Admin UI Components
- [ ] Feature flags management page
- [ ] Experiments management page
- [ ] Fraud scores review dashboard
- [ ] Add RBAC checks for admin endpoints

### 10. Error Handling & Edge Cases
- [ ] Add error handling for feature flag service failures
- [ ] Handle missing experiments gracefully
- [ ] Add validation for fraud scoring inputs
- [ ] Add retry logic for external fraud checks (if any)

## ?? Nice to Have - Polish

### 11. Documentation
- [ ] API documentation for new endpoints (OpenAPI/Swagger)
- [ ] Developer guide for using feature flags
- [ ] Experiment setup guide
- [ ] Fraud scoring configuration guide
- [ ] i18n translation guide

### 12. Testing
- [ ] Integration tests for feature flag endpoints
- [ ] Integration tests for experiment endpoints
- [ ] Integration tests for fraud scoring integration
- [ ] E2E tests for admin UI components
- [ ] Load tests for fraud scoring under load

### 13. Monitoring & Observability
- [ ] Add metrics for feature flag usage
- [ ] Track experiment participation rates
- [ ] Monitor fraud detection rates
- [ ] Alert on high fraud scores
- [ ] Dashboard for experiment results

### 14. Performance Optimizations
- [ ] Cache feature flag lookups
- [ ] Batch fraud score calculations
- [ ] Optimize experiment queries
- [ ] Add database indexes if needed

### 15. Security Hardening
- [ ] Encrypt sensitive fraud detection data
- [ ] Rate limit admin endpoints
- [ ] Add audit logging for flag changes
- [ ] Secure experiment data access
- [ ] Validate all inputs strictly

## ?? Priority Order

**Week 1 (Critical):**
1. Database model integration & migration
2. API endpoints for feature flags
3. Frontend i18n integration
4. Fraud scoring in event creation

**Week 2 (Important):**
5. Experiment API endpoints
6. Feature flag checks in app logic
7. Admin UI basics
8. Error handling

**Week 3 (Polish):**
9. Documentation
10. Testing
11. Monitoring
12. Performance tuning

## Quick Start Commands

```bash
# Run database migration
alembic upgrade head

# Test feature flags
python -c "from backend.feature_flags import FeatureFlagService; print('OK')"

# Test fraud scoring
python -c "from backend.fraud_scoring import FraudDetectionService; print('OK')"

# Run tests
pytest tests/test_rls.py -v
pytest tests/test_chaos.py -v

# Check if tables exist
psql -d floyo -c "\dt" | grep -E "(feature_flags|experiments|fraud_scores)"
```
