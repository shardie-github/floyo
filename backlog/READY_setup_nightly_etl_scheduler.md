# Setup Nightly ETL Scheduler
**Owner:** DevOps Engineer  
**Objective:** Automate daily data pipeline execution via GitHub Actions or cron.

## Steps:
1. **Option A: GitHub Actions**
   - Copy `/infra/gh-actions/nightly-etl.yml` to `.github/workflows/`
   - Configure GitHub Secrets:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `META_ACCESS_TOKEN`
     - `META_AD_ACCOUNT_ID`
     - `TIKTOK_ACCESS_TOKEN`
     - `TIKTOK_ADVERTISER_ID`
     - `SHOPIFY_API_KEY`
     - `SHOPIFY_PASSWORD`
     - `SHOPIFY_STORE`
   - Test workflow manually via `workflow_dispatch`
   - Verify scheduled run at 01:10 AM America/Toronto

2. **Option B: Cron (if not using GitHub Actions)**
   - Copy `/infra/cron/etl.cron` to server
   - Update paths and environment variables
   - Install cron job: `crontab -e`
   - Test execution manually
   - Set up log rotation for ETL logs

3. **Option C: Vercel Cron (if using Vercel)**
   - Create `/api/cron/etl.ts` endpoint
   - Configure in `vercel.json`:
     ```json
     {
       "crons": [{
         "path": "/api/cron/etl",
         "schedule": "10 6 * * *"
       }]
     }
     ```

4. Set up monitoring and alerts:
   - Email/Slack notifications on failure
   - Dashboard to view ETL execution status
   - Log aggregation (if using external service)

## Dependencies:
- ETL scripts configured (`READY_configure_etl_scripts.md`)
- GitHub repository (for GitHub Actions) OR server access (for cron)

## KPI:
- ETL runs daily without manual intervention | **30-day signal:** 30 consecutive successful runs

## Done when:
- Scheduler configured and tested
- First automated run completes successfully
- Alerts configured for failures
- Documentation includes troubleshooting guide

---

**Impact:** High | **Confidence:** High | **Effort:** Low-Medium (4-8 hours)
