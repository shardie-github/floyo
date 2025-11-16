/**
 * Events API Route
 * 
 * Handles file system event tracking and retrieval.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '@/lib/api/error-handler';

export const runtime = 'nodejs';

interface Event {
  id: string;
  userId: string;
  filePath: string;
  eventType: 'created' | 'modified' | 'accessed' | 'deleted';
  tool?: string;
  timestamp: string;
  metadata?: Record<string, any>;
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

  const body = await req.json();
  const { userId, filePath, eventType, tool, metadata } = body;

  if (!userId || !filePath || !eventType) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, filePath, eventType' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('events')
    .insert({
      userId,
      filePath,
      eventType,
      tool: tool || null,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
});

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
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('userId', userId)
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    events: data || [],
    total: count || 0,
    limit,
    offset,
  });
});
