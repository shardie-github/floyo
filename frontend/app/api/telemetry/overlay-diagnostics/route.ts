/**
 * Overlay Diagnostics API Route
 * 
 * Receives overlay interaction diagnostics and stores them for workflow model building.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '@/lib/api/error-handler';

export const runtime = 'nodejs';

interface OverlayDiagnosticsPayload {
  interactions: any[];
  sessionId: string;
  userId?: string;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  const body: OverlayDiagnosticsPayload = await req.json();
  const { interactions, sessionId, userId } = body;

  if (!interactions || !Array.isArray(interactions) || interactions.length === 0) {
    return NextResponse.json(
      { error: 'Invalid interactions data' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Store interactions in telemetry_events table
  const eventsToInsert = interactions.map((interaction) => ({
    userId: userId || null,
    timestamp: new Date(interaction.timestamp).toISOString(),
    appId: 'overlay-diagnostics',
    eventType: `overlay_${interaction.type}`,
    durationMs: null,
    metadataRedactedJson: {
      target: interaction.target,
      overlay: interaction.overlay,
      position: interaction.position,
      metadata: interaction.metadata,
      session: {
        sessionId,
        pageUrl: interaction.session.pageUrl,
        referrer: interaction.session.referrer,
      },
    },
  }));

  const { error } = await supabase.from('telemetry_events').insert(eventsToInsert);

  if (error) {
    console.error('Error storing overlay diagnostics:', error);
    return NextResponse.json(
      { error: 'Failed to store overlay diagnostics' },
      { status: 500 }
    );
  }

  // Also store in a dedicated overlay_interactions table if it exists
  // For now, we'll use telemetry_events

  return NextResponse.json({
    ok: true,
    stored: eventsToInsert.length,
    sessionId,
  });
});
