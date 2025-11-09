/**
 * Analytics Tracking API Route
 * Receives and stores analytics events
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getUserId } from '@/lib/auth-utils';
import { rateLimit } from '@/lib/middleware/rate-limit';
import prisma from '@/lib/db/prisma';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResult = rateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: Object.fromEntries(rateLimitResult.headers.entries()),
      }
    );
  }

  const userId = await getUserId(request);
  const body = await request.json();
  const events = body.events || [];

  // Store events (in production, use analytics service like PostHog, Mixpanel, etc.)
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', { userId, events: events.length });
  }

  // In production, you'd store these in a time-series database
  // or send to analytics service

  return NextResponse.json({ success: true, received: events.length }, {
    headers: Object.fromEntries(rateLimitResult.headers.entries()),
  });
});
