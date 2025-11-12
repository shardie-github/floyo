> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Integration Checklist - Quick Reference

## ? Quick Wins (Can do now)

1. **Add API endpoints to `backend/api_v1.py`**
   - Feature flags endpoints (5 endpoints)
   - Experiments endpoints (4 endpoints)
   - Fraud scoring endpoints (2 endpoints)

2. **Wire fraud scoring into event creation**
   - Add 3 lines to `backend/main.py` in `create_event()` function

3. **Integrate i18n into frontend**
   - Update `frontend/app/layout.tsx` to add I18nProvider
   - Create `frontend/middleware.ts` for locale detection

4. **Import models into main models.py**
   - Add imports from new modules to `database/models.py`

5. **Run database migration**
   - `alembic revision --autogenerate -m "add_feature_flags_experiments_fraud"`
   - `alembic upgrade head`

## ?? Estimated Time

- API endpoints: 2-3 hours
- Fraud integration: 30 minutes
- i18n integration: 1 hour
- Model imports: 15 minutes
- Migration: 30 minutes
- Testing: 2 hours

**Total: ~6-7 hours of focused work**

## ?? Files to Modify

1. `backend/api_v1.py` - Add endpoints
2. `backend/main.py` - Add fraud scoring to event creation
3. `database/models.py` - Import new models
4. `frontend/app/layout.tsx` - Add I18nProvider
5. `frontend/middleware.ts` - Create for locale routing

## ? Validation

After integration, verify:
- [ ] Feature flags can be created via API
- [ ] Experiments can be assigned to users
- [ ] Fraud scores are calculated on event creation
- [ ] Frontend shows translated text
- [ ] RTL languages display correctly
