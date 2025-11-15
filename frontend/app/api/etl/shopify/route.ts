/**
 * Shopify Orders ETL Webhook Endpoint
 * Called by Zapier to trigger Shopify orders data extraction and transformation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/etl/shopify
 * Webhook endpoint for Shopify Orders ETL pipeline
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
    const { data, timestamp, orderId, orderData } = body;

    // Log ETL event
    await supabase.from('audit_logs').insert({
      action: 'etl_shopify_orders',
      resource: 'shopify_orders',
      resourceId: orderId,
      metadata: {
        source: 'zapier',
        dataReceived: !!data || !!orderData,
        timestamp: timestamp || new Date().toISOString(),
        orderId,
      },
      timestamp: new Date(),
    });

    // TODO: Implement actual Shopify API integration
    // For now, this is a placeholder that logs the event
    // When Shopify API is configured:
    // 1. Fetch orders from Shopify API
    // 2. Transform data
    // 3. Store in database (e.g., shopify_orders table)
    // 4. Trigger workflow automations
    // 5. Update analytics

    return NextResponse.json({
      ok: true,
      message: 'Shopify Orders ETL triggered',
      timestamp: new Date().toISOString(),
      orderId: orderId || null,
      note: 'Shopify API integration pending - event logged',
    });
  } catch (error: any) {
    console.error('Shopify ETL error:', error);
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
 * GET /api/etl/shopify
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/etl/shopify',
    method: 'POST',
    authentication: 'ZAPIER_SECRET',
  });
}
