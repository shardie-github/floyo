/**
 * TikTok Ads Campaigns API
 * Fetch and manage TikTok Ads campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/integrations/tiktok/campaigns
 * Fetch TikTok Ads campaigns
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const advertiserId = searchParams.get('advertiser_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
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

    // Get user's TikTok Ads integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('config')
      .eq('userId', userId)
      .eq('provider', 'tiktok_ads')
      .eq('isActive', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'TikTok Ads not connected', code: 'NOT_CONNECTED' },
        { status: 404 }
      );
    }

    const config = integration.config as any;
    const accessToken = config.accessToken;
    const advertiserIds = config.advertiserIds || [];

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Use provided advertiser_id or first available
    const targetAdvertiserId = advertiserId || advertiserIds[0];

    if (!targetAdvertiserId) {
      return NextResponse.json(
        { error: 'No advertiser ID available', code: 'ADVERTISER_MISSING' },
        { status: 400 }
      );
    }

    // Fetch campaigns from TikTok Ads API
    const campaignsResponse = await fetch(
      `https://ads.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${targetAdvertiserId}`,
      {
        method: 'GET',
        headers: {
          'Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!campaignsResponse.ok) {
      const error = await campaignsResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Failed to fetch campaigns',
          details: error,
          code: 'API_ERROR',
        },
        { status: campaignsResponse.status }
      );
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data?.list || [];

    // Store campaigns in database (optional - for caching/analytics)
    if (campaigns.length > 0) {
      // Log fetch event
      await supabase.from('audit_logs').insert({
        action: 'tiktok_campaigns_fetched',
        userId,
        resource: 'tiktok_ads',
        metadata: {
          advertiserId: targetAdvertiserId,
          campaignCount: campaigns.length,
        },
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      ok: true,
      campaigns,
      advertiserId: targetAdvertiserId,
      count: campaigns.length,
    });
  } catch (error: any) {
    console.error('TikTok campaigns fetch error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
