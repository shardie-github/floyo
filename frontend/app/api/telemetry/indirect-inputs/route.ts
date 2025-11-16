/**
 * Indirect Inputs API Route
 * 
 * Receives cookie and indirect input data for workflow model building.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '@/lib/api/error-handler';

export const runtime = 'nodejs';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { data, timestamp } = body;

  if (!data || !Array.isArray(data)) {
    return NextResponse.json(
      { error: 'Invalid data format' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Store in telemetry_events with metadata
  const eventsToInsert = data.map((indirectInput: any) => ({
    userId: null, // May not have user ID for indirect inputs
    timestamp: new Date(indirectInput.timestamp).toISOString(),
    appId: 'indirect-inputs',
    eventType: 'indirect_input_capture',
    durationMs: null,
    metadataRedactedJson: {
      cookies: indirectInput.cookies,
      referrers: indirectInput.referrers,
      utm_params: indirectInput.utm_params,
      query_params: indirectInput.query_params,
      localStorage_keys: indirectInput.localStorage_keys,
      sessionStorage_keys: indirectInput.sessionStorage_keys,
    },
  }));

  const { error } = await supabase.from('telemetry_events').insert(eventsToInsert);

  if (error) {
    console.error('Error storing indirect inputs:', error);
    return NextResponse.json(
      { error: 'Failed to store indirect inputs' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    stored: eventsToInsert.length,
  });
});
