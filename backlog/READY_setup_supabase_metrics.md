# Setup Supabase Metrics Schema
**Owner:** DevOps/Backend Engineer  
**Objective:** Establish the data foundation for finance automation and growth tracking by creating the metrics schema in Supabase.

## Steps:
1. Review `/infra/supabase/migrations/001_metrics.sql` schema
2. Apply migration to Supabase project:
   ```bash
   supabase db push
   ```
3. Verify tables created: `events`, `orders`, `spend`, `experiments`, `metrics_daily`
4. Apply RLS policies from `/infra/supabase/rls.sql`
5. Test service role access (for ETL scripts)
6. Create test data and verify queries work
7. Document connection details for ETL scripts

## Dependencies:
- Supabase project created
- Service role key available
- Database access configured

## KPI:
- Schema deployed successfully | **30-day signal:** ETL scripts can write to tables

## Done when:
- All 5 tables exist in Supabase
- RLS policies applied and tested
- ETL scripts can connect and write test data
- Documentation updated with connection details

---

**Impact:** High | **Confidence:** High | **Effort:** Low (2-4 hours)
