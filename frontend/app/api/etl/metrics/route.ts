/**
 * Metrics Computation ETL Webhook Endpoint
 * Called by Zapier to trigger metrics computation and aggregation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/etl/metrics
 * Webhook endpoint for Metrics Computation ETL pipeline
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
    const { data, timestamp, metricsType } = body;

    // Log ETL event
    await supabase.from('audit_logs').insert({
      action: 'etl_metrics_computation',
      resource: 'metrics',
      metadata: {
        source: 'zapier',
        dataReceived: !!data,
        metricsType: metricsType || 'all',
        timestamp: timestamp || new Date().toISOString(),
      },
      timestamp: new Date(),
    });

    // Trigger metrics computation
    // This could call the existing /api/metrics/collect endpoint logic
    try {
      const metricsResponse = await fetch(
        `${supabaseUrl}/functions/v1/analyze-performance`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metricsType: metricsType || 'all',
            source: 'zapier',
          }),
        }
      );

      const analysis = metricsResponse.ok
        ? await metricsResponse.json()
        : null;

      // Store metrics computation result
      if (supabase.from('metrics_log').insert) {
        await supabase.from('metrics_log').insert({
          source: 'zapier',
          metric: {
            type: 'computation',
            analysis: analysis,
            timestamp: new Date().toISOString(),
            metricsType: metricsType || 'all',
          },
        });
      }

      return NextResponse.json({
        ok: true,
        message: 'Metrics computation triggered',
        timestamp: new Date().toISOString(),
        analysis: analysis,
        metricsType: metricsType || 'all',
      });
    } catch (metricsError: any) {
      // If metrics computation fails, still return success for webhook
      // but log the error
      console.error('Metrics computation error:', metricsError);
      
      return NextResponse.json({
        ok: true,
        message: 'Metrics ETL triggered (computation may have failed)',
        timestamp: new Date().toISOString(),
        warning: 'Metrics computation encountered an error',
      });
    }
  } catch (error: any) {
    console.error('Metrics ETL error:', error);
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
 * GET /api/etl/metrics
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/etl/metrics',
    method: 'POST',
    authentication: 'ZAPIER_SECRET',
  });
}
