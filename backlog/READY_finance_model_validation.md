# Finance Model Validation & Baseline Metrics
**Owner:** Finance Team  
**Objective:** Establish baseline financial metrics and validate finance model assumptions against actual data

**Steps:**
1. Set up automated data pipeline (ETL scripts) to pull Meta, TikTok, and Shopify data
2. Run ETL scripts in dry-run mode to validate data structure
3. Compute baseline metrics for current period (revenue, CAC, LTV, refund rate, COGS%)
4. Compare baseline metrics to finance model assumptions
5. Document any discrepancies and update assumptions.json if needed
6. Set up daily metrics computation via GitHub Actions scheduler

**Dependencies:** 
- Supabase schema (`infra/supabase/migrations/001_metrics.sql`)
- ETL scripts (`scripts/etl/*.ts`)
- Environment variables configured (`infra/env/.env.example`)

**KPI:** 
- Baseline metrics documented within 7 days
- Finance model accuracy validated (actual vs. forecast variance <10%)

**30-day signal:** 
- Daily metrics computation running successfully
- Baseline CAC, LTV, refund rate documented

**Done when:**
- [ ] ETL scripts successfully pull data from all sources (Meta, TikTok, Shopify)
- [ ] Daily metrics computed and stored in `metrics_daily` table
- [ ] Baseline metrics documented in finance forecast report
- [ ] Finance model assumptions validated or updated
- [ ] GitHub Actions nightly ETL workflow running successfully

**Impact:** High | **Confidence:** High | **Effort:** Medium  
**Score:** 9.0
