/**
 * ETL Script: Pull TikTok Ads Data
 * Description: Fetches ad spend, clicks, impressions, conversions from TikTok Ads API
 * Schedule: Daily at 01:15 America/Toronto
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const TIKTOK_API_VERSION = 'v1.3';
const TIKTOK_BASE_URL = `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}`;

interface TikTokAdData {
  date: string;
  campaign_id: string;
  adgroup_id: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

async function fetchTikTokAdsData(
  accessToken: string,
  advertiserId: string,
  startDate: string,
  endDate: string
): Promise<TikTokAdData[]> {
  const url = `${TIKTOK_BASE_URL}/report/integrated/get/`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': accessToken,
    },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      service_type: 'AUCTION',
      report_type: 'BASIC',
      data_level: 'AUCTION_ADGROUP',
      dimensions: ['stat_time_day', 'campaign_id', 'adgroup_id'],
      metrics: ['spend', 'clicks', 'impressions', 'conversions'],
      start_date: startDate,
      end_date: endDate,
      page_size: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`TikTok API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`);
  }

  return (data.data?.list || []).map((item: any) => ({
    date: item.dimensions.stat_time_day,
    campaign_id: item.dimensions.campaign_id,
    adgroup_id: item.dimensions.adgroup_id,
    spend: parseFloat(item.metrics.spend || 0),
    clicks: parseInt(item.metrics.clicks || 0, 10),
    impressions: parseInt(item.metrics.impressions || 0, 10),
    conversions: parseInt(item.metrics.conversions || 0, 10),
  }));
}

async function upsertSpendData(
  pool: pg.Pool,
  records: Array<{
    platform: string;
    campaign_id: string;
    adset_id: string;
    date: string;
    spend_cents: number;
    clicks: number;
    impressions: number;
    conv: number;
  }>
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const record of records) {
      await client.query(
        `INSERT INTO public.spend (platform, campaign_id, adset_id, date, spend_cents, clicks, impressions, conv)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (platform, campaign_id, adset_id, date) 
         DO UPDATE SET spend_cents = EXCLUDED.spend_cents, clicks = EXCLUDED.clicks, 
                       impressions = EXCLUDED.impressions, conv = EXCLUDED.conv`,
        [
          record.platform,
          record.campaign_id,
          record.adset_id,
          record.date,
          record.spend_cents,
          record.clicks,
          record.impressions,
          record.conv,
        ]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL');
  }

  const tiktokToken = process.env.TIKTOK_TOKEN;
  if (!tiktokToken) {
    throw new Error('Missing TIKTOK_TOKEN');
  }

  const tiktokAdvertiserId = process.env.TIKTOK_ADVERTISER_ID;
  if (!tiktokAdvertiserId) {
    throw new Error('Missing TIKTOK_ADVERTISER_ID');
  }

  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    // Fetch last 7 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching TikTok Ads data from ${startDateStr} to ${endDateStr}...`);

    const rawData = await fetchTikTokAdsData(
      tiktokToken,
      tiktokAdvertiserId,
      startDateStr,
      endDateStr
    );

    const parsedData = rawData.map((item) => ({
      platform: 'tiktok',
      campaign_id: item.campaign_id,
      adset_id: item.adgroup_id, // TikTok uses adgroup_id, we map to adset_id
      date: item.date,
      spend_cents: Math.round(item.spend * 100),
      clicks: item.clicks,
      impressions: item.impressions,
      conv: item.conversions,
    }));

    console.log(`Found ${parsedData.length} records`);

    if (parsedData.length > 0) {
      await upsertSpendData(pool, parsedData);
      console.log(`✅ Upserted ${parsedData.length} records to spend table`);
    } else {
      console.log('No new data to upsert');
    }
  } catch (error) {
    console.error('Error pulling TikTok Ads data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { fetchTikTokAdsData, upsertSpendData };
