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

    // TODO: Implement actual TikTok Ads API integration
    // For now, this is a placeholder that logs the event
    // When TikTok Ads API is configured:
    // 1. Fetch campaigns from TikTok Ads API
    // 2. Transform data
    // 3. Store in database (e.g., tiktok_ads_campaigns table)
    // 4. Trigger analytics updates

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
