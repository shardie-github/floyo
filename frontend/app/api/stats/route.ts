/**
 * Stats API Route
 * 
 * Provides user statistics and metrics.
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

  // Get event count
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId);

  // Get pattern count
  const { count: patternCount } = await supabase
    .from('patterns')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId);

  // Get relationship count
  const { count: relationshipCount } = await supabase
    .from('relationships')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId);

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: recentActivityCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)
    .gte('timestamp', sevenDaysAgo.toISOString());

  return NextResponse.json({
    totalEvents: eventCount || 0,
    totalPatterns: patternCount || 0,
    totalRelationships: relationshipCount || 0,
    recentActivity: recentActivityCount || 0,
    period: '7d',
  });
});
