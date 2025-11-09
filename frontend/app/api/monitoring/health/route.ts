/**
 * Monitoring Health API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { realtimeMonitor } from '@/lib/monitoring/realtime-monitor';
import { withErrorHandler } from '@/lib/api/error-handler';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const errorRate = realtimeMonitor.getErrorRate(5);
  const avgLatency = realtimeMonitor.getAvgLatency(5);
  const isHealthy = realtimeMonitor.isHealthy();

  return NextResponse.json({
    status: isHealthy ? 'healthy' : errorRate > 0.1 ? 'unhealthy' : 'degraded',
    errorRate,
    avgLatency,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
});
