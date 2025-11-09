import { NextRequest, NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";
import { withErrorHandler } from "@/lib/api/error-handler";
import { InternalError } from "@/src/lib/errors";
import { trackApiPerformance } from "@/lib/obs/telemetry";

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

const handler = withErrorHandler(async (_req: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new InternalError("Supabase configuration missing");
  }

  const metricsService = new MetricsService(supabaseUrl, supabaseServiceKey);
  const aggregated = await metricsService.getMetrics(24);

  return NextResponse.json(aggregated, {
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=300`,
      "Content-Type": "application/json",
    },
  });
});

export const GET = (req: NextRequest) => trackApiPerformance('/api/metrics', 'GET', () => handler(req));
