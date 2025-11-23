import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const metricName = searchParams.get('name');

    if (metricName) {
      const stats = performanceMonitor.getStats(metricName);
      if (!stats) {
        return NextResponse.json(
          { error: 'Metric not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ metric: metricName, stats });
    }

    // Return all metrics
    const allMetrics = performanceMonitor.getAllMetrics();
    return NextResponse.json({ metrics: allMetrics });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    );
  }
}
