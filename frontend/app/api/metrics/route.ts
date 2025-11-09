import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CACHE_TTL = 60; // 60 seconds cache

interface MetricsData {
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
    [key: string]: number; // Percentage change
  };
  recommendations?: string[];
}

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get last 24 hours of metrics
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Aggregate metrics by source
    const { data: metrics, error } = await supabase
      .from("metrics_log")
      .select("source, metric, ts")
      .gte("ts", twentyFourHoursAgo)
      .order("ts", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("Error fetching metrics:", error);
      return NextResponse.json(
        { error: "Failed to fetch metrics" },
        { status: 500 }
      );
    }

    // Process and aggregate metrics
    const aggregated: MetricsData = {
      performance: {},
      status: "healthy",
      lastUpdated: new Date().toISOString(),
      trends: {},
      recommendations: [],
    };

    // Group by source and calculate averages
    const bySource: Record<string, any[]> = {};
    metrics?.forEach((m) => {
      if (!bySource[m.source]) bySource[m.source] = [];
      bySource[m.source].push(m);
    });

    // Process Vercel metrics
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

    // Process Supabase metrics
    if (bySource.supabase) {
      const supabaseMetrics = bySource.supabase.map((m) => m.metric);
      aggregated.performance.supabase = {
        avgLatencyMs: average(supabaseMetrics, "latencyMs"),
        queryCount: sum(supabaseMetrics, "queryCount"),
        errorRate: average(supabaseMetrics, "errorRate"),
      };
    }

    // Process Expo metrics
    if (bySource.expo) {
      const expoMetrics = bySource.expo.map((m) => m.metric);
      aggregated.performance.expo = {
        bundleMB: average(expoMetrics, "bundleMB"),
        buildDurationMin: average(expoMetrics, "buildDurationMin"),
        successRate: average(expoMetrics, "successRate"),
      };
    }

    // Process CI metrics
    if (bySource.ci) {
      const ciMetrics = bySource.ci.map((m) => m.metric);
      aggregated.performance.ci = {
        avgBuildMin: average(ciMetrics, "buildDurationMin"),
        failureRate: average(ciMetrics, "failureRate"),
        queueLength: average(ciMetrics, "queueLength"),
      };
    }

    // Process client telemetry
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

    // Calculate trends (compare last 6 hours vs previous 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data: recentMetrics } = await supabase
      .from("metrics_log")
      .select("source, metric")
      .gte("ts", sixHoursAgo)
      .lt("ts", new Date().toISOString());

    const { data: previousMetrics } = await supabase
      .from("metrics_log")
      .select("source, metric")
      .gte("ts", twelveHoursAgo)
      .lt("ts", sixHoursAgo);

    // Calculate percentage changes
    if (recentMetrics && previousMetrics) {
      const recentLCP = average(
        recentMetrics.filter((m) => m.source === "vercel" || m.source === "client").map((m) => m.metric),
        "LCP"
      );
      const previousLCP = average(
        previousMetrics.filter((m) => m.source === "vercel" || m.source === "client").map((m) => m.metric),
        "LCP"
      );

      if (previousLCP && recentLCP) {
        const lcpChange = ((recentLCP - previousLCP) / previousLCP) * 100;
        aggregated.trends!["LCP"] = lcpChange;
      }
    }

    // Determine status
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

    // Generate recommendations
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

    return NextResponse.json(aggregated, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=300`,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/metrics:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function average(metrics: any[], key: string): number | undefined {
  const values = metrics
    .map((m) => m[key] || m[key.toLowerCase()])
    .filter((v) => typeof v === "number" && !isNaN(v));
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sum(metrics: any[], key: string): number {
  return metrics
    .map((m) => m[key] || m[key.toLowerCase()] || 0)
    .reduce((a, b) => a + b, 0);
}
