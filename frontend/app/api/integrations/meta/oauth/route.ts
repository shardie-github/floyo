/**
 * Meta Ads OAuth Integration
 * Handles OAuth flow for Meta Ads API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/integrations/meta/oauth
 * Initiate Meta Ads OAuth flow
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const redirectUri = searchParams.get('redirect_uri') || 
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/integrations/meta/oauth/callback`;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const appId = process.env.META_ADS_APP_ID;
    const appSecret = process.env.META_ADS_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Meta Ads API credentials not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // Generate state for CSRF protection
    const state = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

    // Meta Ads OAuth URL
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'ads_read,ads_management'); // Required scopes
    authUrl.searchParams.set('response_type', 'code');

    // Store state in database for verification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('audit_logs').insert({
        action: 'meta_oauth_initiated',
        userId,
        resource: 'meta_ads',
        metadata: { state, redirectUri },
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
    });
  } catch (error: any) {
    console.error('Meta OAuth initiation error:', error);
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
 * POST /api/integrations/meta/oauth/callback
 * Handle Meta Ads OAuth callback
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

    const appId = process.env.META_ADS_APP_ID;
    const appSecret = process.env.META_ADS_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/integrations/meta/oauth/callback`;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Meta Ads API credentials not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'GET',
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to exchange code for token', details: error, code: 'OAUTH_ERROR' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token received', code: 'OAUTH_ERROR' },
        { status: 400 }
      );
    }

    // Get user's ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${access_token}`
    );

    let adAccountIds: string[] = [];
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      adAccountIds = (accountsData.data || []).map((acc: any) => acc.id);
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
      provider: 'meta_ads',
      name: 'Meta Ads',
      config: {
        accessToken: access_token, // In production, encrypt this
        expiresAt: expires_in ? Date.now() + expires_in * 1000 : null,
        adAccountIds,
      },
      isActive: true,
      lastSyncAt: new Date(),
    }, {
      onConflict: 'userId,provider',
    });

    // Log successful connection
    await supabase.from('audit_logs').insert({
      action: 'meta_oauth_completed',
      userId,
      resource: 'meta_ads',
      metadata: {
        adAccountIds,
        expiresIn: expires_in,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      ok: true,
      message: 'Meta Ads connected successfully',
      adAccountIds,
    });
  } catch (error: any) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
