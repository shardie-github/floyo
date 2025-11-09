#!/usr/bin/env tsx
/**
 * ETL Script: Pull TikTok Ads Data
 * 
 * Fetches advertising spend and performance data from TikTok Ads API
 * and loads it into the spend table.
 * 
 * Usage:
 *   node scripts/etl/pull_ads_tiktok.ts [--dry-run] [--date YYYY-MM-DD] [--days N]
 * 
 * Environment Variables:
 *   TIKTOK_ACCESS_TOKEN - TikTok API access token
 *   TIKTOK_ADVERTISER_ID - TikTok advertiser ID
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { parseArgs } from 'util';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

interface TikTokAdData {
  date: string;
  campaign_id: string;
  campaign_name: string;
  adgroup_id?: string;
  adgroup_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions?: number;
  conversion_value?: number;
}

interface TikTokAPIResponse {
  code: number;
  message: string;
  request_id: string;
  data: {
    list: Array<{
      dimensions: {
        stat_time_day: string;
        campaign_id: string;
        campaign_name: string;
        adgroup_id?: string;
        adgroup_name?: string;
        ad_id?: string;
        ad_name?: string;
      };
      metrics: {
        spend: string;
        impressions: string;
        clicks: string;
        conversions?: string;
        conversion_value?: string;
      };
    }>;
    page_info?: {
      page: number;
      page_size: number;
      total_number: number;
      total_page: number;
    };
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

async function fetchTikTokAdsData(
  accessToken: string,
  advertiserId: string,
  startDate: string,
  endDate: string
): Promise<TikTokAdData[]> {
  const baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';
  
  const allData: TikTokAdData[] = [];
  let page = 1;
  const pageSize = 100;

  console.log(`[TikTok ETL] Fetching data from ${startDate} to ${endDate}...`);

  while (true) {
    const requestBody = {
      advertiser_id: advertiserId,
      start_date: startDate,
      end_date: endDate,
      dimensions: ['stat_time_day', 'campaign_id', 'campaign_name', 'adgroup_id', 'adgroup_name', 'ad_id', 'ad_name'],
      metrics: ['spend', 'impressions', 'clicks', 'conversions', 'conversion_value'],
      page: page,
      page_size: pageSize,
      data_level: 'AUCTION_AD',
    };

    const response = await fetchWithRetry(`${baseUrl}/report/integrated/get/`, {
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: TikTokAPIResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(`TikTok API error: ${data.message} (code: ${data.code})`);
    }

    if (!data.data?.list || data.data.list.length === 0) {
      break;
    }

    for (const item of data.data.list) {
      allData.push({
        date: item.dimensions.stat_time_day,
        campaign_id: item.dimensions.campaign_id,
        campaign_name: item.dimensions.campaign_name,
        adgroup_id: item.dimensions.adgroup_id,
        adgroup_name: item.dimensions.adgroup_name,
        ad_id: item.dimensions.ad_id,
        ad_name: item.dimensions.ad_name,
        spend: parseFloat(item.metrics.spend || '0'),
        impressions: parseInt(item.metrics.impressions || '0', 10),
        clicks: parseInt(item.metrics.clicks || '0', 10),
        conversions: item.metrics.conversions ? parseInt(item.metrics.conversions, 10) : undefined,
        conversion_value: item.metrics.conversion_value ? parseFloat(item.metrics.conversion_value) : undefined,
      });
    }

    const pageInfo = data.data.page_info;
    if (!pageInfo || page >= pageInfo.total_page) {
      break;
    }

    page++;
    await sleep(500); // Rate limit protection
  }

  console.log(`[TikTok ETL] Fetched ${allData.length} records`);
  return allData;
}

async function loadToSupabase(
  supabase: ReturnType<typeof createClient>,
  data: TikTokAdData[],
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`[TikTok ETL] DRY RUN - Would insert ${data.length} records:`);
    data.slice(0, 5).forEach(record => {
      console.log(`  - ${record.date}: ${record.campaign_name} - $${record.spend.toFixed(2)}`);
    });
    return;
  }

  console.log(`[TikTok ETL] Loading ${data.length} records to Supabase...`);

  const records = data.map(record => ({
    date: record.date,
    channel: 'tiktok_ads' as const,
    campaign_id: record.campaign_id,
    campaign_name: record.campaign_name,
    ad_set_id: record.adgroup_id || null,
    ad_set_name: record.adgroup_name || null,
    ad_id: record.ad_id || null,
    ad_name: record.ad_name || null,
    amount: record.spend,
    impressions: record.impressions,
    clicks: record.clicks,
    conversions: record.conversions || 0,
    conversion_value: record.conversion_value || 0,
    source: 'tiktok_api',
    source_data: {
      fetched_at: new Date().toISOString(),
      api_version: 'v1.3',
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
      console.error(`[TikTok ETL] Error loading batch ${i / batchSize + 1}:`, error);
      throw error;
    }
    console.log(`[TikTok ETL] Loaded batch ${i / batchSize + 1}/${Math.ceil(records.length / batchSize)}`);
  }

  console.log(`[TikTok ETL] Successfully loaded ${records.length} records`);
}

async function main() {
  const startTime = Date.now();
  console.log(`[TikTok ETL] Starting at ${new Date().toISOString()}`);

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
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN || 'YOUR_TIKTOK_ACCESS_TOKEN';
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID || 'YOUR_ADVERTISER_ID';
  const supabaseUrl = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

  if (accessToken === 'YOUR_TIKTOK_ACCESS_TOKEN' || advertiserId === 'YOUR_ADVERTISER_ID') {
    console.error('[TikTok ETL] ERROR: TIKTOK_ACCESS_TOKEN and TIKTOK_ADVERTISER_ID must be set');
    process.exit(1);
  }

  if (supabaseUrl === 'https://YOUR_PROJECT.supabase.co' || supabaseKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.error('[TikTok ETL] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  try {
    // Fetch data from TikTok API
    const tiktokData = await fetchTikTokAdsData(accessToken, advertiserId, startDateStr, endDateStr);

    if (tiktokData.length === 0) {
      console.log('[TikTok ETL] No data to load');
      return;
    }

    // Load to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    await loadToSupabase(supabase, tiktokData, dryRun);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[TikTok ETL] Completed successfully in ${duration}s`);
  } catch (error) {
    console.error('[TikTok ETL] ERROR:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
