# Configure ETL Scripts with API Credentials
**Owner:** DevOps/Backend Engineer  
**Objective:** Set up ETL scripts to pull data from Meta, TikTok, and Shopify APIs into Supabase.

## Steps:
1. Copy `/infra/env/.env.example` to `.env.local`
2. Obtain API credentials:
   - Meta: Access token and ad account ID from Facebook Business Manager
   - TikTok: Access token and advertiser ID from TikTok Ads Manager
   - Shopify: API key, password, and store name from Shopify admin
3. Configure Supabase credentials (URL and service role key)
4. Test each ETL script in dry-run mode:
   ```bash
   tsx scripts/etl/pull_ads_meta.ts --dry-run
   tsx scripts/etl/pull_ads_tiktok.ts --dry-run
   tsx scripts/etl/pull_shopify_orders.ts --dry-run
   ```
5. Verify data structure matches schema expectations
6. Set up error handling and logging
7. Document API rate limits and quotas

## Dependencies:
- Supabase metrics schema deployed (`READY_setup_supabase_metrics.md`)
- API accounts created (Meta, TikTok, Shopify)
- Environment variables configured

## KPI:
- All 3 ETL scripts run successfully | **30-day signal:** Data appears in Supabase tables daily

## Done when:
- All 3 ETL scripts execute without errors
- Test data successfully loaded to Supabase
- API credentials stored securely (not in git)
- Documentation includes API setup instructions

---

**Impact:** High | **Confidence:** Medium | **Effort:** Medium (1-2 days)
