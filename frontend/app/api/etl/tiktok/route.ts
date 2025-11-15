/**
 * TikTok Ads ETL Webhook Endpoint
 * Called by Zapier to trigger TikTok Ads data extraction and transformation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/etl/tiktok
 * Webhook endpoint for TikTok Ads ETL pipeline
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Zapier secret
    const authHeader = req.headers.get('authorization');
    const zapierSecret = process.env.ZAPIER_SECRET;
    
    if (zapierSecret) {
      const token = authHeader?.replace('Bearer ', '') || req.headers.get('x-zapier-secret');
      if (token !== zapierSecret) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { data, timestamp } = body;

    // Log ETL event
    await supabase.from('audit_logs').insert({
      action: 'etl_tiktok_ads',
      resource: 'tiktok_ads',
      metadata: {
        source: 'zapier',
        dataReceived: !!data,
        timestamp: timestamp || new Date().toISOString(),
      },
      timestamp: new Date(),
    });

    // Fetch campaigns from TikTok Ads API
    try {
      // Get active TikTok Ads integrations
      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('userId, config')
        .eq('provider', 'tiktok_ads')
        .eq('isActive', true);

      if (integrations && integrations.length > 0) {
        for (const integration of integrations) {
          const config = integration.config as any;
          const accessToken = config.accessToken;
          const advertiserIds = config.advertiserIds || [];

          if (!accessToken || !advertiserIds.length) continue;

          // Fetch campaigns for each advertiser
          for (const advertiserId of advertiserIds) {
            try {
              const campaignsResponse = await fetch(
                `https://ads.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${advertiserId}`,
                {
                  method: 'GET',
                  headers: {
                    'Access-Token': accessToken,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (campaignsResponse.ok) {
                const campaignsData = await campaignsResponse.json();
                const campaigns = campaignsData.data?.list || [];

                // Store campaign data (you may want to create a dedicated table)
                for (const campaign of campaigns) {
                  await supabase.from('audit_logs').insert({
                    action: 'tiktok_campaign_synced',
                    userId: integration.userId,
                    resource: 'tiktok_ads',
                    resourceId: campaign.campaign_id,
                    metadata: {
                      advertiserId,
                      campaign: {
                        id: campaign.campaign_id,
                        name: campaign.campaign_name,
                        status: campaign.status,
                        budget: campaign.budget,
                      },
                    },
                    timestamp: new Date(),
                  });
                }
              }
            } catch (campaignError) {
              console.error(`Error fetching campaigns for advertiser ${advertiserId}:`, campaignError);
            }
          }
        }
      }
    } catch (apiError) {
      console.error('TikTok Ads API error:', apiError);
      // Continue execution even if API call fails
    }

    return NextResponse.json({
      ok: true,
      message: 'TikTok Ads ETL triggered',
      timestamp: new Date().toISOString(),
      note: 'TikTok Ads API integration pending - event logged',
    });
  } catch (error: any) {
    console.error('TikTok Ads ETL error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/etl/tiktok
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/etl/tiktok',
    method: 'POST',
    authentication: 'ZAPIER_SECRET',
  });
}
