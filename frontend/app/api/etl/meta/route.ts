/**
 * Meta Ads ETL Webhook Endpoint
 * Called by Zapier to trigger Meta Ads data extraction and transformation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/etl/meta
 * Webhook endpoint for Meta Ads ETL pipeline
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
      action: 'etl_meta_ads',
      resource: 'meta_ads',
      metadata: {
        source: 'zapier',
        dataReceived: !!data,
        timestamp: timestamp || new Date().toISOString(),
      },
      timestamp: new Date(),
    });

    // Fetch campaigns from Meta Ads API
    try {
      // Get active Meta Ads integrations
      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('userId, config')
        .eq('provider', 'meta_ads')
        .eq('isActive', true);

      if (integrations && integrations.length > 0) {
        for (const integration of integrations) {
          const config = integration.config as any;
          const accessToken = config.accessToken;
          const adAccountIds = config.adAccountIds || [];

          if (!accessToken || !adAccountIds.length) continue;

          // Fetch campaigns for each ad account
          for (const adAccountId of adAccountIds) {
            try {
              const campaignsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`
              );

              if (campaignsResponse.ok) {
                const campaignsData = await campaignsResponse.json();
                const campaigns = campaignsData.data || [];

                // Store campaign data
                for (const campaign of campaigns) {
                  await supabase.from('audit_logs').insert({
                    action: 'meta_campaign_synced',
                    userId: integration.userId,
                    resource: 'meta_ads',
                    resourceId: campaign.id,
                    metadata: {
                      adAccountId,
                      campaign: {
                        id: campaign.id,
                        name: campaign.name,
                        status: campaign.status,
                        objective: campaign.objective,
                        dailyBudget: campaign.daily_budget,
                        lifetimeBudget: campaign.lifetime_budget,
                      },
                    },
                    timestamp: new Date(),
                  });
                }
              }
            } catch (campaignError) {
              console.error(`Error fetching campaigns for ad account ${adAccountId}:`, campaignError);
            }
          }
        }
      }
    } catch (apiError) {
      console.error('Meta Ads API error:', apiError);
      // Continue execution even if API call fails
    }

    return NextResponse.json({
      ok: true,
      message: 'Meta Ads ETL triggered',
      timestamp: new Date().toISOString(),
      note: 'Meta Ads API integration pending - event logged',
    });
  } catch (error: any) {
    console.error('Meta Ads ETL error:', error);
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
 * GET /api/etl/meta
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/etl/meta',
    method: 'POST',
    authentication: 'ZAPIER_SECRET',
  });
}
