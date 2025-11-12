/**
 * ETL Script: Pull Meta Ads Data
 * Description: Fetches ad spend, clicks, impressions, conversions from Meta Ads API
 * Schedule: Daily at 01:10 America/Toronto
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const META_API_VERSION = 'v18.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaAdData {
  date_start: string;
  date_stop: string;
  campaign_id: string;
  adset_id: string;
  spend: string;
  clicks: string;
  impressions: string;
  actions?: Array<{ action_type: string; value: string }>;
}

async function fetchMetaAdsData(
  accessToken: string,
  accountId: string,
  startDate: string,
  endDate: string
): Promise<MetaAdData[]> {
  const url = `${META_BASE_URL}/${accountId}/insights`;
  const params = new URLSearchParams({
    time_range: JSON.stringify({
      since: startDate,
      until: endDate,
    }),
    fields: 'date_start,date_stop,campaign_id,adset_id,spend,clicks,impressions,actions',
    level: 'adset',
    time_increment: '1',
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Meta API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

function parseMetaData(data: MetaAdData[]): Array<{
  platform: string;
  campaign_id: string;
  adset_id: string;
  date: string;
  spend_cents: number;
  clicks: number;
  impressions: number;
  conv: number;
}> {
  return data.map((item) => {
    const conversions = item.actions?.find((a) => a.action_type === 'purchase')?.value || '0';
    return {
      platform: 'meta',
      campaign_id: item.campaign_id,
      adset_id: item.adset_id,
      date: item.date_start,
      spend_cents: Math.round(parseFloat(item.spend) * 100),
      clicks: parseInt(item.clicks, 10),
      impressions: parseInt(item.impressions, 10),
      conv: parseInt(conversions, 10),
    };
  });
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

  const metaToken = process.env.META_TOKEN;
  if (!metaToken) {
    throw new Error('Missing META_TOKEN');
  }

  const metaAccountId = process.env.META_ACCOUNT_ID || process.env.META_AD_ACCOUNT_ID;
  if (!metaAccountId) {
    throw new Error('Missing META_ACCOUNT_ID or META_AD_ACCOUNT_ID');
  }

  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    // Fetch last 7 days of data (Meta API typically updates daily)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching Meta Ads data from ${startDateStr} to ${endDateStr}...`);

    const rawData = await fetchMetaAdsData(metaToken, metaAccountId, startDateStr, endDateStr);
    const parsedData = parseMetaData(rawData);

    console.log(`Found ${parsedData.length} records`);

    if (parsedData.length > 0) {
      await upsertSpendData(pool, parsedData);
      console.log(`✅ Upserted ${parsedData.length} records to spend table`);
    } else {
      console.log('No new data to upsert');
    }
  } catch (error) {
    console.error('Error pulling Meta Ads data:', error);
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

export { fetchMetaAdsData, parseMetaData, upsertSpendData };
