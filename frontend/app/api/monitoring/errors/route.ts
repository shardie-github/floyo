/**
 * Error Monitoring Endpoint
 * Receives error reports from client-side error logging
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();

    // In production, forward to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (sentryDsn) {
        // Forward to Sentry or other error tracking service
        // This is a placeholder - implement actual Sentry integration if needed
        // await sendToSentry(errorData);
      }
    }

    // Log error server-side for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Monitoring]', errorData);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}
