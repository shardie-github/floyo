/**
 * Integration Status API Route
 * Returns status of all configured integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/integrations/status
 * Get status of all integrations
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check integration endpoints
    const integrations = [
      {
        id: 'zapier',
        name: 'Zapier',
        enabled: !!process.env.ZAPIER_SECRET,
        endpoints: {
          meta: '/api/etl/meta',
          tiktok: '/api/etl/tiktok',
          shopify: '/api/etl/shopify',
          metrics: '/api/etl/metrics',
        },
        status: 'configured',
      },
      {
        id: 'tiktok_ads',
        name: 'TikTok Ads',
        enabled: !!(process.env.TIKTOK_ADS_API_KEY && process.env.TIKTOK_ADS_API_SECRET),
        endpoints: {},
        status: process.env.TIKTOK_ADS_API_KEY ? 'configured' : 'not_configured',
      },
      {
        id: 'meta_ads',
        name: 'Meta Ads',
        enabled: !!(process.env.META_ADS_ACCESS_TOKEN && process.env.META_ADS_APP_ID),
        endpoints: {},
        status: process.env.META_ADS_ACCESS_TOKEN ? 'configured' : 'not_configured',
      },
      {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        enabled: !!process.env.ELEVENLABS_API_KEY,
        endpoints: {},
        status: process.env.ELEVENLABS_API_KEY ? 'configured' : 'not_configured',
      },
      {
        id: 'autods',
        name: 'AutoDS',
        enabled: !!process.env.AUTODS_API_KEY,
        endpoints: {},
        status: process.env.AUTODS_API_KEY ? 'configured' : 'not_configured',
      },
      {
        id: 'capcut',
        name: 'CapCut',
        enabled: !!process.env.CAPCUT_API_KEY,
        endpoints: {},
        status: process.env.CAPCUT_API_KEY ? 'configured' : 'not_configured',
      },
      {
        id: 'mindstudio',
        name: 'MindStudio',
        enabled: !!process.env.MINSTUDIO_API_KEY,
        endpoints: {},
        status: process.env.MINSTUDIO_API_KEY ? 'configured' : 'not_configured',
      },
    ];

    // Get integration usage from database if table exists
    let integrationUsage: Record<string, any> = {};
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('action, resource, timestamp')
        .in('action', ['etl_meta_ads', 'etl_tiktok_ads', 'etl_shopify_orders', 'etl_metrics_computation'])
        .order('timestamp', { ascending: false })
        .limit(100);

      if (data) {
        integrationUsage = {
          lastMetaAdsETL: data.find(d => d.action === 'etl_meta_ads')?.timestamp,
          lastTikTokAdsETL: data.find(d => d.action === 'etl_tiktok_ads')?.timestamp,
          lastShopifyETL: data.find(d => d.action === 'etl_shopify_orders')?.timestamp,
          lastMetricsETL: data.find(d => d.action === 'etl_metrics_computation')?.timestamp,
        };
      }
    } catch (error) {
      // Table might not exist, ignore
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      integrations,
      usage: integrationUsage,
    });
  } catch (error: any) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
