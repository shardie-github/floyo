/**
 * TikTok Ads OAuth Integration
 * Handles OAuth flow for TikTok Ads API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/integrations/tiktok/oauth
 * Initiate TikTok Ads OAuth flow
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const redirectUri = searchParams.get('redirect_uri') || 
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/integrations/tiktok/oauth/callback`;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const clientKey = process.env.TIKTOK_ADS_API_KEY;
    const clientSecret = process.env.TIKTOK_ADS_API_SECRET;

    if (!clientKey || !clientSecret) {
      return NextResponse.json(
        { error: 'TikTok Ads API credentials not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // Generate state for CSRF protection
    const state = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

    // TikTok Ads OAuth URL
    const authUrl = new URL('https://ads.tiktok.com/marketing_api/auth');
    authUrl.searchParams.set('app_id', clientKey);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'ads.management'); // Required scopes

    // Store state in database for verification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('audit_logs').insert({
        action: 'tiktok_oauth_initiated',
        userId,
        resource: 'tiktok_ads',
        metadata: { state, redirectUri },
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
    });
  } catch (error: any) {
    console.error('TikTok OAuth initiation error:', error);
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
 * GET /api/integrations/tiktok/oauth/callback
 * Handle TikTok Ads OAuth callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, state, userId } = body;

    if (!code || !state || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const clientKey = process.env.TIKTOK_ADS_API_KEY;
    const clientSecret = process.env.TIKTOK_ADS_API_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/integrations/tiktok/oauth/callback`;

    if (!clientKey || !clientSecret) {
      return NextResponse.json(
        { error: 'TikTok Ads API credentials not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://ads.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: clientKey,
        secret: clientSecret,
        auth_code: code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to exchange code for token', details: error, code: 'OAUTH_ERROR' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, advertiser_ids } = tokenData.data || {};

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token received', code: 'OAUTH_ERROR' },
        { status: 400 }
      );
    }

    // Store tokens securely in database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store integration configuration
    await supabase.from('user_integrations').upsert({
      userId,
      provider: 'tiktok_ads',
      name: 'TikTok Ads',
      config: {
        accessToken: access_token, // In production, encrypt this
        refreshToken: refresh_token,
        expiresAt: expires_in ? Date.now() + expires_in * 1000 : null,
        advertiserIds: advertiser_ids || [],
      },
      isActive: true,
      lastSyncAt: new Date(),
    }, {
      onConflict: 'userId,provider',
    });

    // Log successful connection
    await supabase.from('audit_logs').insert({
      action: 'tiktok_oauth_completed',
      userId,
      resource: 'tiktok_ads',
      metadata: {
        advertiserIds: advertiser_ids || [],
        expiresIn: expires_in,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      ok: true,
      message: 'TikTok Ads connected successfully',
      advertiserIds: advertiser_ids || [],
    });
  } catch (error: any) {
    console.error('TikTok OAuth callback error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
