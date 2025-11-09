/**
 * Monitoring Metrics API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { realtimeMonitor } from '@/lib/monitoring/realtime-monitor';
import { withErrorHandler } from '@/lib/api/error-handler';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const metrics = realtimeMonitor.getRecent(30); // Last 30 minutes

  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
});
