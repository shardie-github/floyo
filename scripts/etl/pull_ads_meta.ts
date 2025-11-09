#!/usr/bin/env tsx
/**
 * ETL Script: Pull Meta Ads Data
 * 
 * Fetches advertising spend and performance data from Meta (Facebook/Instagram) Ads API
 * and loads it into the spend table.
 * 
 * Usage:
 *   node scripts/etl/pull_ads_meta.ts [--dry-run] [--date YYYY-MM-DD] [--days N]
 * 
 * Environment Variables:
 *   META_ACCESS_TOKEN - Meta API access token
 *   META_AD_ACCOUNT_ID - Meta ad account ID
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { parseArgs } from 'util';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

interface MetaAdData {
  date: string;
  campaign_id: string;
  campaign_name: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions?: number;
  conversion_value?: number;
}

interface MetaAPIResponse {
  data: Array<{
    date_start: string;
    campaign_id: string;
    campaign_name: string;
    adset_id?: string;
    adset_name?: string;
    ad_id?: string;
    ad_name?: string;
    spend: string;
    impressions: string;
    clicks: string;
    actions?: Array<{ action_type: string; value: string }>;
  }>;
  paging?: {
    next?: string;
  };
}

// Exponential backoff helper
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Request failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

async function fetchMetaAdsData(
  accessToken: string,
  adAccountId: string,
  startDate: string,
  endDate: string
): Promise<MetaAdData[]> {
  const baseUrl = 'https://graph.facebook.com/v18.0';
  const fields = [
    'date_start',
    'campaign_id',
    'campaign_name',
    'adset_id',
    'adset_name',
    'ad_id',
    'ad_name',
    'spend',
    'impressions',
    'clicks',
    'actions'
  ].join(',');

  const url = `${baseUrl}/${adAccountId}/insights?fields=${fields}&time_range={"since":"${startDate}","until":"${endDate}"}&level=ad&time_increment=1`;

  console.log(`[Meta ETL] Fetching data from ${startDate} to ${endDate}...`);

  const allData: MetaAdData[] = [];
  let nextUrl: string | undefined = url;

  while (nextUrl) {
    const response = await fetchWithRetry(nextUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data: MetaAPIResponse = await response.json();

    for (const item of data.data) {
      // Extract conversion actions
      const conversions = item.actions?.filter(a => 
        a.action_type === 'purchase' || a.action_type === 'lead'
      ) || [];
      const conversionValue = conversions.reduce((sum, a) => sum + parseFloat(a.value || '0'), 0);

      allData.push({
        date: item.date_start,
        campaign_id: item.campaign_id,
        campaign_name: item.campaign_name,
        adset_id: item.adset_id,
        adset_name: item.adset_name,
        ad_id: item.ad_id,
        ad_name: item.ad_name,
        spend: parseFloat(item.spend || '0'),
        impressions: parseInt(item.impressions || '0', 10),
        clicks: parseInt(item.clicks || '0', 10),
        conversions: conversions.length,
        conversion_value: conversionValue,
      });
    }

    nextUrl = data.paging?.next;
    if (nextUrl) {
      await sleep(500); // Rate limit protection
    }
  }

  console.log(`[Meta ETL] Fetched ${allData.length} records`);
  return allData;
}

async function loadToSupabase(
  supabase: ReturnType<typeof createClient>,
  data: MetaAdData[],
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`[Meta ETL] DRY RUN - Would insert ${data.length} records:`);
    data.slice(0, 5).forEach(record => {
      console.log(`  - ${record.date}: ${record.campaign_name} - $${record.spend.toFixed(2)}`);
    });
    return;
  }

  console.log(`[Meta ETL] Loading ${data.length} records to Supabase...`);

  const records = data.map(record => ({
    date: record.date,
    channel: 'meta_ads' as const,
    campaign_id: record.campaign_id,
    campaign_name: record.campaign_name,
    ad_set_id: record.adset_id || null,
    ad_set_name: record.adset_name || null,
    ad_id: record.ad_id || null,
    ad_name: record.ad_name || null,
    amount: record.spend,
    impressions: record.impressions,
    clicks: record.clicks,
    conversions: record.conversions || 0,
    conversion_value: record.conversion_value || 0,
    source: 'meta_api',
    source_data: {
      fetched_at: new Date().toISOString(),
      api_version: 'v18.0',
    },
  }));

  // Upsert in batches
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase
      .from('spend')
      .upsert(batch, { onConflict: 'date,channel,campaign_id,ad_set_id,ad_id' });

    if (error) {
      console.error(`[Meta ETL] Error loading batch ${i / batchSize + 1}:`, error);
      throw error;
    }
    console.log(`[Meta ETL] Loaded batch ${i / batchSize + 1}/${Math.ceil(records.length / batchSize)}`);
  }

  console.log(`[Meta ETL] Successfully loaded ${records.length} records`);
}

async function main() {
  const startTime = Date.now();
  console.log(`[Meta ETL] Starting at ${new Date().toISOString()}`);

  const args = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      'date': { type: 'string' },
      'days': { type: 'string', default: '1' },
      'cron': { type: 'boolean', default: false },
    },
    strict: false,
  });

  const dryRun = args.values['dry-run'] || false;
  const isCron = args.values['cron'] || false;

  // Determine date range
  const today = new Date();
  const endDate = args.values['date'] 
    ? new Date(args.values['date'])
    : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1); // Yesterday by default
  
  const days = parseInt(args.values['days'] || '1', 10);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days + 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Validate environment variables
  const accessToken = process.env.META_ACCESS_TOKEN || 'YOUR_META_ACCESS_TOKEN';
  const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_YOUR_ACCOUNT_ID';
  const supabaseUrl = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

  if (accessToken === 'YOUR_META_ACCESS_TOKEN' || adAccountId === 'act_YOUR_ACCOUNT_ID') {
    console.error('[Meta ETL] ERROR: META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set');
    process.exit(1);
  }

  if (supabaseUrl === 'https://YOUR_PROJECT.supabase.co' || supabaseKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.error('[Meta ETL] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  try {
    // Fetch data from Meta API
    const metaData = await fetchMetaAdsData(accessToken, adAccountId, startDateStr, endDateStr);

    if (metaData.length === 0) {
      console.log('[Meta ETL] No data to load');
      return;
    }

    // Load to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    await loadToSupabase(supabase, metaData, dryRun);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Meta ETL] Completed successfully in ${duration}s`);
  } catch (error) {
    console.error('[Meta ETL] ERROR:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
