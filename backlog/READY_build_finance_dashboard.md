# Build Finance Dashboard
**Owner:** Data Analyst / Frontend Engineer  
**Objective:** Create dashboard for finance team to monitor KPIs and track performance vs. forecast.

## Steps:
1. Review `/dashboards/metrics_spec.md` requirements
2. Choose dashboard tool:
   - Supabase Dashboard (built-in SQL queries)
   - Metabase (self-hosted)
   - Looker Studio (Google)
   - Retool (custom)
3. Connect to Supabase `metrics_daily` table
4. Create Executive Dashboard:
   - Revenue (MTD, YTD, YoY)
   - EBITDA Margin
   - Cash Balance & Runway
   - LTV:CAC Ratio
5. Create Finance Dashboard:
   - Revenue trends
   - Expense breakdown
   - Cash flow projection
   - Refund rate
6. Set up scheduled reports (weekly email)
7. Configure access control (finance team only)
8. Add alerts for threshold breaches (runway < 6 months, etc.)

## Dependencies:
- Daily metrics computed (`READY_implement_compute_metrics.md`)
- Dashboard tool selected and configured

## KPI:
- Dashboard accessible and updated daily | **30-day signal:** Finance team uses dashboard weekly

## Done when:
- Executive and Finance dashboards created
- Data refreshes daily automatically
- Alerts configured for key thresholds
- Team trained on dashboard usage

---

**Impact:** High | **Confidence:** High | **Effort:** Medium (3-5 days)
