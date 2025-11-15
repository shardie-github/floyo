/**
 * Meta Ads Campaigns API
 * Fetch and manage Meta Ads campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/integrations/meta/campaigns
 * Fetch Meta Ads campaigns
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const adAccountId = searchParams.get('ad_account_id');

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

    // Get user's Meta Ads integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('config')
      .eq('userId', userId)
      .eq('provider', 'meta_ads')
      .eq('isActive', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Meta Ads not connected', code: 'NOT_CONNECTED' },
        { status: 404 }
      );
    }

    const config = integration.config as any;
    const accessToken = config.accessToken;
    const adAccountIds = config.adAccountIds || [];

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found', code: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    // Use provided ad_account_id or first available
    const targetAdAccountId = adAccountId || adAccountIds[0];

    if (!targetAdAccountId) {
      return NextResponse.json(
        { error: 'No ad account ID available', code: 'ACCOUNT_MISSING' },
        { status: 400 }
      );
    }

    // Fetch campaigns from Meta Ads API
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${targetAdAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`
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
    const campaigns = campaignsData.data || [];

    // Store campaigns in database (optional - for caching/analytics)
    if (campaigns.length > 0) {
      // Log fetch event
      await supabase.from('audit_logs').insert({
        action: 'meta_campaigns_fetched',
        userId,
        resource: 'meta_ads',
        metadata: {
          adAccountId: targetAdAccountId,
          campaignCount: campaigns.length,
        },
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      ok: true,
      campaigns,
      adAccountId: targetAdAccountId,
      count: campaigns.length,
    });
  } catch (error: any) {
    console.error('Meta campaigns fetch error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
