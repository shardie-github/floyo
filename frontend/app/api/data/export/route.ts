/**
 * Data Export API Route
 * 
 * Exports user data in JSON format (GDPR compliance).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '@/lib/api/error-handler';

export const runtime = 'nodejs';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Export all user data
  const [user, events, patterns, relationships, privacyPrefs] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('events').select('*').eq('userId', userId),
    supabase.from('patterns').select('*').eq('userId', userId),
    supabase.from('relationships').select('*').eq('userId', userId),
    supabase.from('privacy_prefs').select('*').eq('userId', userId).single(),
  ]);

  const exportData = {
    userId,
    exportedAt: new Date().toISOString(),
    user: user.data,
    events: events.data || [],
    patterns: patterns.data || [],
    relationships: relationships.data || [],
    privacyPreferences: privacyPrefs.data,
  };

  // Generate download URL (in production, upload to S3 and return signed URL)
  // For now, return data directly
  return NextResponse.json(exportData, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="floyo-export-${userId}-${Date.now()}.json"`,
    },
  });
});
