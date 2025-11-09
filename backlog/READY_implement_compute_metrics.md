# Implement Daily Metrics Computation
**Owner:** Backend/Data Engineer  
**Objective:** Aggregate raw data into daily metrics for finance and growth reporting.

## Steps:
1. Review `/scripts/etl/compute_metrics.ts` logic
2. Test computation with sample data:
   ```bash
   tsx scripts/etl/compute_metrics.ts --dry-run --date 2025-01-15
   ```
3. Verify calculations match financial model assumptions:
   - CAC = Spend / New Customers
   - LTV = ARPU × Gross Margin × (1 / Churn Rate)
   - EBITDA = Revenue - COGS - Operating Expenses
   - Runway = Cash Balance / Monthly Burn Rate
4. Handle edge cases:
   - Zero new customers (CAC calculation)
   - Missing historical data (cash balance)
   - Data quality issues (nulls, outliers)
5. Add data quality scoring (see `data_quality_score` column)
6. Integrate with nightly ETL scheduler
7. Create validation queries to verify metrics accuracy

## Dependencies:
- ETL scripts pulling data (`READY_configure_etl_scripts.md`)
- Supabase metrics schema (`READY_setup_supabase_metrics.md`)

## KPI:
- Daily metrics computed accurately | **30-day signal:** Metrics align with financial model forecasts (±10%)

## Done when:
- `compute_metrics.ts` runs successfully
- Metrics match expected calculations
- Data quality checks implemented
- Metrics available in `metrics_daily` table for dashboard

---

**Impact:** High | **Confidence:** Medium | **Effort:** Medium (2-3 days)
