// Supabase Edge Function: Analyze Performance Metrics
// Auto-analysis and optimization recommendations

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Regression {
  metric: string;
  changePercent: number;
  threshold: number;
}

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const supa = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get metrics from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentMetrics, error: recentError } = await supa
      .from('metrics_log')
      .select('source, metric, ts')
      .gte('ts', twentyFourHoursAgo)
      .order('ts', { ascending: false })
      .limit(100);

    if (recentError) {
      throw recentError;
    }

    // Get metrics from previous 24 hours for comparison
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: previousMetrics, error: previousError } = await supa
      .from('metrics_log')
      .select('source, metric, ts')
      .gte('ts', fortyEightHoursAgo)
      .lt('ts', twentyFourHoursAgo)
      .order('ts', { ascending: false })
      .limit(100);

    if (previousError) {
      throw previousError;
    }

    // Analyze for regressions
    const regressions: Regression[] = [];
    const recommendations: string[] = [];

    // Compare LCP
    const recentLCP = recentMetrics
      ?.filter(m => m.source === 'vercel' || m.source === 'client' || m.source === 'telemetry')
      .map(m => m.metric.LCP || m.metric.lcp)
      .filter(v => typeof v === 'number' && !isNaN(v)) as number[];

    const previousLCP = previousMetrics
      ?.filter(m => m.source === 'vercel' || m.source === 'client' || m.source === 'telemetry')
      .map(m => m.metric.LCP || m.metric.lcp)
      .filter(v => typeof v === 'number' && !isNaN(v)) as number[];

    if (recentLCP && previousLCP && recentLCP.length > 0 && previousLCP.length > 0) {
      const recentAvg = recentLCP.reduce((a, b) => a + b, 0) / recentLCP.length;
      const previousAvg = previousLCP.reduce((a, b) => a + b, 0) / previousLCP.length;
      
      if (previousAvg > 0) {
        const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
        if (changePercent > 10) {
          regressions.push({
            metric: 'LCP',
            changePercent,
            threshold: 10,
          });
          recommendations.push('Enable image compression and next-image optimization');
        }
      }
    }

    // Check Supabase latency
    const supabaseLatency = recentMetrics
      ?.filter(m => m.source === 'supabase')
      .map(m => m.metric.latencyMs || m.metric.avgLatencyMs)
      .filter(v => typeof v === 'number' && !isNaN(v)) as number[];

    if (supabaseLatency && supabaseLatency.length > 0) {
      const avgLatency = supabaseLatency.reduce((a, b) => a + b, 0) / supabaseLatency.length;
      if (avgLatency > 200) {
        recommendations.push('Consider adding Supabase indexes for slow queries');
      }
    }

    // Check Expo bundle size
    const expoBundle = recentMetrics
      ?.filter(m => m.source === 'expo')
      .map(m => m.metric.bundleMB)
      .filter(v => typeof v === 'number' && !isNaN(v)) as number[];

    if (expoBundle && expoBundle.length > 0) {
      const avgBundle = expoBundle.reduce((a, b) => a + b, 0) / expoBundle.length;
      if (avgBundle > 30) {
        recommendations.push('Trigger expo optimize to reduce bundle size');
      }
    }

    // Check CI queue
    const ciQueue = recentMetrics
      ?.filter(m => m.source === 'ci')
      .map(m => m.metric.queueLength)
      .filter(v => typeof v === 'number' && !isNaN(v)) as number[];

    if (ciQueue && ciQueue.length > 0) {
      const avgQueue = ciQueue.reduce((a, b) => a + b, 0) / ciQueue.length;
      if (avgQueue > 3) {
        recommendations.push('Throttle GitHub workflow concurrency');
      }
    }

    // Determine status
    const status = regressions.length > 0 ? 'regression' : 
                   (recommendations.length > 0 ? 'degraded' : 'healthy');

    return new Response(
      JSON.stringify({
        status,
        regressions,
        recommendations,
        metricsAnalyzed: recentMetrics?.length || 0,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
});
