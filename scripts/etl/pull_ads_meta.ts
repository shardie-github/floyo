#!/usr/bin/env tsx
/**
 * ETL Script: Pull Meta Ads Data
 * Description: Fetches advertising spend and performance data from Meta Ads API
 * Usage: tsx scripts/etl/pull_ads_meta.ts [--dry-run] [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD]
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
  META_TOKEN: z.string().min(1),
  META_AD_ACCOUNT_ID: z.string().optional(),
  TZ: z.string().default('America/Toronto'),
});

const argsSchema = z.object({
  dryRun: z.boolean().default(false),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

interface MetaAdInsight {
  date: string;
  spend: string;
  impressions: string;
  clicks: string;
  conversions: string;
  campaign_id: string;
  campaign_name: string;
  adset_id?: string;
  adset_name?: string;
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

async function pullMetaAdsData(
  token: string,
  adAccountId: string | undefined,
  startDate: string,
  endDate: string
): Promise<MetaAdInsight[]> {
  // TODO: Replace with actual Meta Ads API implementation
  // This is a placeholder structure
  
  const accountId = adAccountId || 'act_<ACCOUNT_ID>';
  const apiVersion = 'v18.0';
  const baseUrl = `https://graph.facebook.com/${apiVersion}`;
  
  console.log(`[Meta ETL] Fetching data from ${startDate} to ${endDate} for account ${accountId}`);
  
  // Placeholder: In production, implement actual Meta Graph API calls
  // Example structure:
  // const response = await fetch(
  //   `${baseUrl}/${accountId}/insights?` +
  //   `fields=spend,impressions,clicks,conversions,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name&` +
  //   `time_range={'since':'${startDate}','until':'${endDate}'}&` +
  //   `access_token=${token}`
  // );
  
  // For now, return empty array (dry-run mode will show structure)
  return [];
}

async function upsertSpendData(
  supabase: ReturnType<typeof createClient>,
  insights: MetaAdInsight[],
  dryRun: boolean
): Promise<void> {
  if (insights.length === 0) {
    console.log('[Meta ETL] No data to upsert');
    return;
  }
  
  const records = insights.map((insight) => ({
    source: 'meta',
    external_id: `${insight.campaign_id}_${insight.date}`,
    date: insight.date,
    amount: parseFloat(insight.spend),
    currency: 'USD',
    impressions: parseInt(insight.impressions) || 0,
    clicks: parseInt(insight.clicks) || 0,
    conversions: parseInt(insight.conversions) || 0,
    campaign_id: insight.campaign_id,
    campaign_name: insight.campaign_name,
    ad_set_id: insight.adset_id,
    ad_set_name: insight.adset_name,
    ad_id: insight.ad_id,
    ad_name: insight.ad_name,
    metadata: {
      source: 'meta_ads_api',
      fetched_at: new Date().toISOString(),
    },
  }));
  
  if (dryRun) {
    console.log('[Meta ETL] DRY RUN - Would upsert records:');
    console.log(JSON.stringify(records.slice(0, 3), null, 2));
    console.log(`[Meta ETL] Total records: ${records.length}`);
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
  
  console.log(`[Meta ETL] Successfully upserted ${records.length} records`);
}

async function main() {
  const startTime = Date.now();
  console.log('[Meta ETL] Starting Meta Ads data pull...');
  console.log(`[Meta ETL] Timezone: ${process.env.TZ || 'America/Toronto'}`);
  
  try {
    // Parse environment variables
    const env = envSchema.parse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      META_TOKEN: process.env.META_TOKEN || 'META_TOKEN_PLACEHOLDER',
      META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID,
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
      console.log('[Meta ETL] DRY RUN MODE - No data will be written');
    }
    
    // Initialize Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Fetch data from Meta Ads API
    const insights = await fetchWithRetry(() =>
      pullMetaAdsData(env.META_TOKEN, env.META_AD_ACCOUNT_ID, startDate, endDate)
    );
    
    // Upsert to Supabase
    await upsertSpendData(supabase, insights, parsedArgs.dryRun);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Meta ETL] Completed successfully in ${duration}s`);
    
  } catch (error) {
    console.error('[Meta ETL] Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { pullMetaAdsData, upsertSpendData };
