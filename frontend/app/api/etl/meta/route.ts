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

    // TODO: Implement actual Meta Ads API integration
    // For now, this is a placeholder that logs the event
    // When Meta Ads API is configured:
    // 1. Fetch campaigns from Meta Ads API
    // 2. Transform data
    // 3. Store in database (e.g., meta_ads_campaigns table)
    // 4. Trigger analytics updates

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
