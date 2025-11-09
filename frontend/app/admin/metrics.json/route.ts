import { NextResponse } from 'next/server';

export const config = { runtime: 'edge' };

/**
 * Admin Metrics Endpoint
 * Returns placeholder performance metrics (LCP, TTFB)
 * 
 * Note: In production, this should be populated with actual metrics
 * from Vercel Analytics, Web Vitals, or your monitoring service.
 */
export async function GET() {
  // Placeholder metrics - replace with actual data source
  const metrics = {
    lcp: null, // Largest Contentful Paint (ms)
    ttfb: null, // Time to First Byte (ms)
    fid: null, // First Input Delay (ms)
    cls: null, // Cumulative Layout Shift
    fcp: null, // First Contentful Paint (ms)
    timestamp: Date.now(),
    source: 'placeholder',
  };

  return NextResponse.json(metrics, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
  });
}
