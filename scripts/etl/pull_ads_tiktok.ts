#!/usr/bin/env tsx
/**
 * ETL Script: Pull TikTok Ads Data
 * Description: Fetches advertising spend and performance data from TikTok Ads API
 * Usage: tsx scripts/etl/pull_ads_tiktok.ts [--dry-run] [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TIKTOK_TOKEN: z.string().min(1),
  TIKTOK_ADVERTISER_ID: z.string().optional(),
  TZ: z.string().default('America/Toronto'),
});

const argsSchema = z.object({
  dryRun: z.boolean().default(false),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

interface TikTokAdStat {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  campaign_id: string;
  campaign_name: string;
  adgroup_id?: string;
  adgroup_name?: string;
  ad_id?: string;
  ad_name?: string;
}

// Exponential backoff helper
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Unknown error');
}

async function pullTikTokAdsData(
  token: string,
  advertiserId: string | undefined,
  startDate: string,
  endDate: string
): Promise<TikTokAdStat[]> {
  // TODO: Replace with actual TikTok Ads API implementation
  // This is a placeholder structure
  
  const adId = advertiserId || '<ADVERTISER_ID>';
  const apiVersion = 'v1.3';
  const baseUrl = `https://business-api.tiktok.com/open_api/${apiVersion}`;
  
  console.log(`[TikTok ETL] Fetching data from ${startDate} to ${endDate} for advertiser ${adId}`);
  
  // Placeholder: In production, implement actual TikTok Marketing API calls
  // Example structure:
  // const response = await fetch(
  //   `${baseUrl}/report/integrated/get/?` +
  //   `advertiser_id=${adId}&` +
  //   `start_date=${startDate}&` +
  //   `end_date=${endDate}&` +
  //   `fields=["spend","impressions","clicks","conversions","campaign_id","campaign_name"]&` +
  //   `access_token=${token}`,
  //   { method: 'GET', headers: { 'Access-Token': token } }
  // );
  
  // For now, return empty array (dry-run mode will show structure)
  return [];
}

async function upsertSpendData(
  supabase: ReturnType<typeof createClient>,
  stats: TikTokAdStat[],
  dryRun: boolean
): Promise<void> {
  if (stats.length === 0) {
    console.log('[TikTok ETL] No data to upsert');
    return;
  }
  
  const records = stats.map((stat) => ({
    source: 'tiktok',
    external_id: `${stat.campaign_id}_${stat.date}`,
    date: stat.date,
    amount: stat.spend,
    currency: 'USD',
    impressions: stat.impressions || 0,
    clicks: stat.clicks || 0,
    conversions: stat.conversions || 0,
    campaign_id: stat.campaign_id,
    campaign_name: stat.campaign_name,
    ad_set_id: stat.adgroup_id,
    ad_set_name: stat.adgroup_name,
    ad_id: stat.ad_id,
    ad_name: stat.ad_name,
    metadata: {
      source: 'tiktok_ads_api',
      fetched_at: new Date().toISOString(),
    },
  }));
  
  if (dryRun) {
    console.log('[TikTok ETL] DRY RUN - Would upsert records:');
    console.log(JSON.stringify(records.slice(0, 3), null, 2));
    console.log(`[TikTok ETL] Total records: ${records.length}`);
    return;
  }
  
  const { error } = await supabase
    .from('spend')
    .upsert(records, {
      onConflict: 'source,external_id,date',
      ignoreDuplicates: false,
    });
  
  if (error) {
    throw new Error(`Failed to upsert spend data: ${error.message}`);
  }
  
  console.log(`[TikTok ETL] Successfully upserted ${records.length} records`);
}

async function main() {
  const startTime = Date.now();
  console.log('[TikTok ETL] Starting TikTok Ads data pull...');
  console.log(`[TikTok ETL] Timezone: ${process.env.TZ || 'America/Toronto'}`);
  
  try {
    // Parse environment variables
    const env = envSchema.parse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      TIKTOK_TOKEN: process.env.TIKTOK_TOKEN || 'TIKTOK_TOKEN_PLACEHOLDER',
      TIKTOK_ADVERTISER_ID: process.env.TIKTOK_ADVERTISER_ID,
      TZ: process.env.TZ || 'America/Toronto',
    });
    
    // Parse command line arguments
    const args = {
      dryRun: process.argv.includes('--dry-run'),
      startDate: process.argv.includes('--start-date')
        ? process.argv[process.argv.indexOf('--start-date') + 1]
        : undefined,
      endDate: process.argv.includes('--end-date')
        ? process.argv[process.argv.indexOf('--end-date') + 1]
        : undefined,
    };
    
    const parsedArgs = argsSchema.parse(args);
    
    // Default to last 7 days if not specified
    const endDate = parsedArgs.endDate || new Date().toISOString().split('T')[0];
    const startDate = parsedArgs.startDate || (() => {
      const date = new Date(endDate);
      date.setDate(date.getDate() - 7);
      return date.toISOString().split('T')[0];
    })();
    
    if (parsedArgs.dryRun) {
      console.log('[TikTok ETL] DRY RUN MODE - No data will be written');
    }
    
    // Initialize Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Fetch data from TikTok Ads API
    const stats = await fetchWithRetry(() =>
      pullTikTokAdsData(env.TIKTOK_TOKEN, env.TIKTOK_ADVERTISER_ID, startDate, endDate)
    );
    
    // Upsert to Supabase
    await upsertSpendData(supabase, stats, parsedArgs.dryRun);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[TikTok ETL] Completed successfully in ${duration}s`);
    
  } catch (error) {
    console.error('[TikTok ETL] Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { pullTikTokAdsData, upsertSpendData };
