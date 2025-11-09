/**
 * Cost Forecasting & Reliability Intelligence
 * Collects metrics and predicts infrastructure costs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export interface CostForecast {
  current: number;
  forecasted: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  breakdown: {
    vercel: number;
    supabase: number;
    expo: number;
    github: number;
    other: number;
  };
  recommendations: string[];
  budget: number;
  overrunRisk: boolean;
}

export interface ReliabilityTrends {
  uptime: number;
  avgLatency: number;
  errorRate: number;
  buildTime: number;
  trends: {
    uptime: number[];
    latency: number[];
    errors: number[];
    builds: number[];
  };
  period: string;
}

export async function forecastCosts(
  budget: number,
  supabase: SupabaseClient
): Promise<CostForecast> {
  // Collect recent metrics from Supabase
  const { data: metrics } = await supabase
    .from('metrics_log')
    .select('metric, ts')
    .eq('source', 'vercel')
    .order('ts', { ascending: false })
    .limit(100);

  // Calculate current costs from metrics
  const currentCosts = calculateCurrentCosts(metrics || []);

  // Forecast based on trends
  const forecasted = forecastNextMonth(currentCosts, metrics || []);

  // Generate recommendations
  const recommendations = generateRecommendations(forecasted, budget);

  return {
    current: currentCosts.total,
    forecasted,
    trend: forecasted > currentCosts.total ? 'increasing' : forecasted < currentCosts.total ? 'decreasing' : 'stable',
    breakdown: currentCosts.breakdown,
    recommendations,
    budget,
    overrunRisk: forecasted > budget * 1.1, // 10% buffer
  };
}

export async function trackReliabilityTrends(
  supabase: SupabaseClient
): Promise<ReliabilityTrends> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get metrics from last 30 days
  const { data: metrics } = await supabase
    .from('metrics_log')
    .select('metric, ts, source')
    .gte('ts', thirtyDaysAgo.toISOString())
    .order('ts', { ascending: true });

  const trends = calculateTrends(metrics || []);

  return {
    uptime: trends.uptime,
    avgLatency: trends.avgLatency,
    errorRate: trends.errorRate,
    buildTime: trends.buildTime,
    trends: {
      uptime: trends.uptimeHistory,
      latency: trends.latencyHistory,
      errors: trends.errorHistory,
      builds: trends.buildHistory,
    },
    period: '30d',
  };
}

function calculateCurrentCosts(metrics: any[]): { total: number; breakdown: CostForecast['breakdown'] } {
  // Estimate costs based on usage patterns
  // This is a simplified model - in production, integrate with actual billing APIs
  
  const vercelCost = estimateVercelCost(metrics.filter(m => m.source === 'vercel'));
  const supabaseCost = estimateSupabaseCost(metrics.filter(m => m.source === 'supabase'));
  const expoCost = estimateExpoCost(metrics.filter(m => m.source === 'expo'));
  const githubCost = estimateGitHubCost(metrics.filter(m => m.source === 'ci'));

  return {
    total: vercelCost + supabaseCost + expoCost + githubCost,
    breakdown: {
      vercel: vercelCost,
      supabase: supabaseCost,
      expo: expoCost,
      github: githubCost,
      other: 0,
    },
  };
}

function estimateVercelCost(metrics: any[]): number {
  // Simplified: assume $20/month base + $0.01 per 1000 requests
  const requests = metrics.reduce((sum, m) => sum + (m.metric?.requests || 0), 0);
  return 20 + (requests / 1000) * 0.01;
}

function estimateSupabaseCost(metrics: any[]): number {
  // Simplified: assume $25/month base + usage
  const dbSize = metrics.reduce((sum, m) => sum + (m.metric?.dbSize || 0), 0);
  return 25 + (dbSize / 1024 / 1024) * 0.01; // $0.01 per MB
}

function estimateExpoCost(metrics: any[]): number {
  // Expo is typically free for basic usage
  return 0;
}

function estimateGitHubCost(metrics: any[]): number {
  // GitHub Actions: assume $0.008 per minute
  const minutes = metrics.reduce((sum, m) => sum + (m.metric?.duration || 0), 0);
  return (minutes / 60) * 0.008;
}

function forecastNextMonth(currentCosts: number, metrics: any[]): number {
  // Simple linear regression on last 7 days
  if (metrics.length < 7) return currentCosts;

  const dailyCosts = groupByDay(metrics);
  const trend = calculateLinearTrend(dailyCosts);
  
  return currentCosts * (1 + trend * 30); // Extrapolate to 30 days
}

function groupByDay(metrics: any[]): number[] {
  const days: Record<string, number> = {};
  
  metrics.forEach(m => {
    const day = new Date(m.ts).toISOString().split('T')[0];
    days[day] = (days[day] || 0) + (m.metric?.cost || 0);
  });

  return Object.values(days);
}

function calculateLinearTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope / (sumY / n); // Normalize
}

function generateRecommendations(forecasted: number, budget: number): string[] {
  const recommendations: string[] = [];

  if (forecasted > budget) {
    recommendations.push('Consider implementing caching to reduce API calls');
    recommendations.push('Review Supabase query patterns for optimization');
    recommendations.push('Enable Vercel Edge Caching for static assets');
    recommendations.push('Consider connection pooling for database queries');
  }

  if (forecasted > budget * 1.2) {
    recommendations.push('🚨 Cost overrun risk: Review infrastructure scaling');
    recommendations.push('Consider moving to a lower tier plan if usage allows');
  }

  return recommendations;
}

function calculateTrends(metrics: any[]): {
  uptime: number;
  avgLatency: number;
  errorRate: number;
  buildTime: number;
  uptimeHistory: number[];
  latencyHistory: number[];
  errorHistory: number[];
  buildHistory: number[];
} {
  const healthChecks = metrics.filter(m => m.metric?.type === 'health');
  const latencies = metrics.filter(m => m.metric?.latency);
  const errors = metrics.filter(m => m.metric?.type === 'error');
  const builds = metrics.filter(m => m.source === 'ci');

  const uptime = healthChecks.length > 0
    ? (healthChecks.filter(h => h.metric?.status === 'ok').length / healthChecks.length) * 100
    : 99.9;

  const avgLatency = latencies.length > 0
    ? latencies.reduce((sum, l) => sum + (l.metric?.latency || 0), 0) / latencies.length
    : 0;

  const errorRate = metrics.length > 0
    ? (errors.length / metrics.length) * 100
    : 0;

  const buildTime = builds.length > 0
    ? builds.reduce((sum, b) => sum + (b.metric?.duration || 0), 0) / builds.length
    : 0;

  // Generate history (daily averages)
  const daily = groupMetricsByDay(metrics);
  const uptimeHistory = daily.map(d => d.uptime);
  const latencyHistory = daily.map(d => d.latency);
  const errorHistory = daily.map(d => d.errors);
  const buildHistory = daily.map(d => d.builds);

  return {
    uptime,
    avgLatency,
    errorRate,
    buildTime,
    uptimeHistory,
    latencyHistory,
    errorHistory,
    buildHistory,
  };
}

function groupMetricsByDay(metrics: any[]): Array<{ uptime: number; latency: number; errors: number; builds: number }> {
  const days: Record<string, any[]> = {};

  metrics.forEach(m => {
    const day = new Date(m.ts).toISOString().split('T')[0];
    if (!days[day]) days[day] = [];
    days[day].push(m);
  });

  return Object.values(days).map(dayMetrics => {
    const health = dayMetrics.filter(m => m.metric?.type === 'health');
    const latencies = dayMetrics.filter(m => m.metric?.latency);
    const errors = dayMetrics.filter(m => m.metric?.type === 'error');
    const builds = dayMetrics.filter(m => m.source === 'ci');

    return {
      uptime: health.length > 0
        ? (health.filter(h => h.metric?.status === 'ok').length / health.length) * 100
        : 100,
      latency: latencies.length > 0
        ? latencies.reduce((sum, l) => sum + (l.metric?.latency || 0), 0) / latencies.length
        : 0,
      errors: errors.length,
      builds: builds.length,
    };
  });
}
