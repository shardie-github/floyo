/**
 * Telemetry instrumentation utilities
 * 
 * Provides RUM (Real User Monitoring) and synthetic metrics collection for API routes and pages.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface TelemetryMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
  userId?: string;
  error?: string;
}

/**
 * Track API endpoint performance
 */
export async function trackApiPerformance(
  endpoint: string,
  method: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  let statusCode = 500;
  let error: string | undefined;

  try {
    const response = await handler();
    statusCode = response.status;
    return response;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;
    
    // Send to metrics collection endpoint (non-blocking)
    trackMetric({
      endpoint,
      method,
      statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
      error,
    }).catch((err) => {
      // Fail silently to avoid disrupting request flow
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to track metric:', err);
      }
    });
  }
}

/**
 * Track metric to collection endpoint
 */
async function trackMetric(metric: TelemetryMetrics): Promise<void> {
  // In production, send to metrics collection API
  if (process.env.NODE_ENV === 'production') {
    try {
      await fetch('/api/metrics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'api',
          metric: {
            endpoint: metric.endpoint,
            method: metric.method,
            statusCode: metric.statusCode,
            durationMs: metric.durationMs,
            error: metric.error,
          },
        }),
      });
    } catch {
      // Ignore errors in telemetry collection
    }
  } else {
    // In development, log to console
    console.log('[Telemetry]', metric);
  }
}

/**
 * Extract user ID from request for telemetry
 */
export function getUserIdFromRequest(request: NextRequest): string | undefined {
  // Try to get from auth header or cookie
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from token (simplified)
    return undefined; // TODO: Implement JWT parsing
  }
  return undefined;
}
