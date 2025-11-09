/**
 * Metrics Service
 * 
 * Business logic for metrics aggregation and analysis.
 */

import { createClient } from '@supabase/supabase-js';
import { average, sum } from '@/lib/utils/metrics-utils';

export interface MetricsData {
  performance: {
    webVitals?: {
      LCP?: number;
      CLS?: number;
      FID?: number;
      TTFB?: number;
      errors?: number;
    };
    supabase?: {
      avgLatencyMs?: number;
      queryCount?: number;
      errorRate?: number;
    };
    expo?: {
      bundleMB?: number;
      buildDurationMin?: number;
      successRate?: number;
    };
    ci?: {
      avgBuildMin?: number;
      failureRate?: number;
      queueLength?: number;
    };
    client?: {
      avgTTFB?: number;
      avgLCP?: number;
      errorCount?: number;
    };
  };
  status: "healthy" | "degraded" | "regression";
  lastUpdated: string;
  trends?: {
    [key: string]: number;
  };
  recommendations?: string[];
}

interface MetricLog {
  source: string;
  metric: Record<string, unknown>;
  ts: string;
}

export class MetricsService {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async getMetrics(hours: number = 24): Promise<MetricsData> {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: metrics, error } = await this.supabase
      .from("metrics_log")
      .select("source, metric, ts")
      .gte("ts", hoursAgo)
      .order("ts", { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`Failed to fetch metrics: ${error.message}`);
    }

    return this.aggregateMetrics(metrics || []);
  }

  private aggregateMetrics(metrics: MetricLog[]): MetricsData {
    const aggregated: MetricsData = {
      performance: {},
      status: "healthy",
      lastUpdated: new Date().toISOString(),
      trends: {},
      recommendations: [],
    };

    // Group by source
    const bySource: Record<string, MetricLog[]> = {};
    metrics.forEach((m) => {
      if (!bySource[m.source]) bySource[m.source] = [];
      bySource[m.source].push(m);
    });

    // Process each source
    if (bySource.vercel) {
      const vercelMetrics = bySource.vercel.map((m) => m.metric);
      aggregated.performance.webVitals = {
        LCP: average(vercelMetrics, "LCP"),
        CLS: average(vercelMetrics, "CLS"),
        FID: average(vercelMetrics, "FID"),
        TTFB: average(vercelMetrics, "TTFB"),
        errors: sum(vercelMetrics, "errors"),
      };
    }

    if (bySource.supabase) {
      const supabaseMetrics = bySource.supabase.map((m) => m.metric);
      aggregated.performance.supabase = {
        avgLatencyMs: average(supabaseMetrics, "latencyMs"),
        queryCount: sum(supabaseMetrics, "queryCount"),
        errorRate: average(supabaseMetrics, "errorRate"),
      };
    }

    if (bySource.expo) {
      const expoMetrics = bySource.expo.map((m) => m.metric);
      aggregated.performance.expo = {
        bundleMB: average(expoMetrics, "bundleMB"),
        buildDurationMin: average(expoMetrics, "buildDurationMin"),
        successRate: average(expoMetrics, "successRate"),
      };
    }

    if (bySource.ci) {
      const ciMetrics = bySource.ci.map((m) => m.metric);
      aggregated.performance.ci = {
        avgBuildMin: average(ciMetrics, "buildDurationMin"),
        failureRate: average(ciMetrics, "failureRate"),
        queueLength: average(ciMetrics, "queueLength"),
      };
    }

    if (bySource.client || bySource.telemetry) {
      const clientMetrics = [
        ...(bySource.client || []),
        ...(bySource.telemetry || []),
      ].map((m) => m.metric);
      aggregated.performance.client = {
        avgTTFB: average(clientMetrics, "ttfb"),
        avgLCP: average(clientMetrics, "lcp"),
        errorCount: sum(clientMetrics, "errors"),
      };
    }

    // Calculate trends
    this.calculateTrends(aggregated);

    // Determine status and generate recommendations
    this.determineStatus(aggregated);
    this.generateRecommendations(aggregated);

    return aggregated;
  }

  private async calculateTrends(aggregated: MetricsData): Promise<void> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const [recentResult, previousResult] = await Promise.all([
      this.supabase
        .from("metrics_log")
        .select("source, metric")
        .gte("ts", sixHoursAgo)
        .lt("ts", new Date().toISOString()),
      this.supabase
        .from("metrics_log")
        .select("source, metric")
        .gte("ts", twelveHoursAgo)
        .lt("ts", sixHoursAgo),
    ]);

    const recentMetrics = recentResult.data || [];
    const previousMetrics = previousResult.data || [];

    if (recentMetrics.length > 0 && previousMetrics.length > 0) {
      const recentLCP = average(
        recentMetrics
          .filter((m) => m.source === "vercel" || m.source === "client")
          .map((m) => m.metric),
        "LCP"
      );
      const previousLCP = average(
        previousMetrics
          .filter((m) => m.source === "vercel" || m.source === "client")
          .map((m) => m.metric),
        "LCP"
      );

      if (previousLCP && recentLCP) {
        const lcpChange = ((recentLCP - previousLCP) / previousLCP) * 100;
        aggregated.trends!["LCP"] = lcpChange;
      }
    }
  }

  private determineStatus(aggregated: MetricsData): void {
    const hasRegression = Object.values(aggregated.trends || {}).some(
      (change) => change > 10
    );
    if (hasRegression) {
      aggregated.status = "regression";
    } else if (
      aggregated.performance.webVitals?.LCP &&
      aggregated.performance.webVitals.LCP > 2.5
    ) {
      aggregated.status = "degraded";
    }
  }

  private generateRecommendations(aggregated: MetricsData): void {
    if (aggregated.performance.webVitals?.LCP && aggregated.performance.webVitals.LCP > 2.5) {
      aggregated.recommendations!.push("Enable image compression and next-image optimization");
    }
    if (aggregated.performance.supabase?.avgLatencyMs && aggregated.performance.supabase.avgLatencyMs > 200) {
      aggregated.recommendations!.push("Consider adding Supabase indexes for slow queries");
    }
    if (aggregated.performance.expo?.bundleMB && aggregated.performance.expo.bundleMB > 30) {
      aggregated.recommendations!.push("Trigger expo optimize to reduce bundle size");
    }
    if (aggregated.performance.ci?.queueLength && aggregated.performance.ci.queueLength > 3) {
      aggregated.recommendations!.push("Throttle GitHub workflow concurrency");
    }
  }
}
