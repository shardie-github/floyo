'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
  status: 'healthy' | 'degraded' | 'regression';
  lastUpdated: string;
  trends?: {
    [key: string]: number;
  };
  recommendations?: string[];
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div>No metrics available</div>
      </div>
    );
  }

  const statusColor = {
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    regression: 'bg-red-100 text-red-800',
  }[metrics.status];

  // Prepare chart data
  const webVitalsData = metrics.performance.webVitals
    ? [
        {
          name: 'LCP',
          value: metrics.performance.webVitals.LCP?.toFixed(2) || 0,
          target: 2.5,
        },
        {
          name: 'CLS',
          value: metrics.performance.webVitals.CLS?.toFixed(3) || 0,
          target: 0.1,
        },
        {
          name: 'FID',
          value: metrics.performance.webVitals.FID?.toFixed(2) || 0,
          target: 100,
        },
        {
          name: 'TTFB',
          value: metrics.performance.webVitals.TTFB?.toFixed(2) || 0,
          target: 800,
        },
      ]
    : [];

  const systemMetricsData = [
    metrics.performance.supabase?.avgLatencyMs && {
      name: 'Supabase Latency',
      value: metrics.performance.supabase.avgLatencyMs,
      unit: 'ms',
    },
    metrics.performance.expo?.bundleMB && {
      name: 'Expo Bundle',
      value: metrics.performance.expo.bundleMB,
      unit: 'MB',
    },
    metrics.performance.ci?.avgBuildMin && {
      name: 'CI Build Time',
      value: metrics.performance.ci.avgBuildMin,
      unit: 'min',
    },
  ].filter(Boolean);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Intelligence Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}>
            {metrics.status.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">LCP</h3>
          <div className="text-2xl font-bold">
            {metrics.performance.webVitals?.LCP?.toFixed(2) || 'N/A'}s
          </div>
          {metrics.trends?.LCP && (
            <div
              className={`text-sm ${
                metrics.trends.LCP > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {metrics.trends.LCP > 0 ? '+' : ''}
              {metrics.trends.LCP.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">CLS</h3>
          <div className="text-2xl font-bold">
            {metrics.performance.webVitals?.CLS?.toFixed(3) || 'N/A'}
          </div>
          {metrics.trends?.CLS && (
            <div
              className={`text-sm ${
                metrics.trends.CLS > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {metrics.trends.CLS > 0 ? '+' : ''}
              {metrics.trends.CLS.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Supabase Latency</h3>
          <div className="text-2xl font-bold">
            {metrics.performance.supabase?.avgLatencyMs?.toFixed(0) || 'N/A'}ms
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Errors</h3>
          <div className="text-2xl font-bold">
            {metrics.performance.webVitals?.errors || metrics.performance.client?.errorCount || 0}
          </div>
        </div>
      </div>

      {/* Web Vitals Chart */}
      {webVitalsData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Web Vitals</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={webVitalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Current" />
              <Bar dataKey="target" fill="#ef4444" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* System Metrics */}
      {systemMetricsData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={systemMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations */}
      {metrics.recommendations && metrics.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Optimization Recommendations</h2>
          <ul className="list-disc list-inside space-y-2">
            {metrics.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trends */}
      {metrics.trends && Object.keys(metrics.trends).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Trends (6h vs previous 6h)</h2>
          <div className="space-y-2">
            {Object.entries(metrics.trends).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium">{key}</span>
                <span
                  className={`font-semibold ${
                    value > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {value > 0 ? '+' : ''}
                  {value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON View (collapsible) */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-600">
          View Raw JSON
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
          {JSON.stringify(metrics, null, 2)}
        </pre>
      </details>
    </div>
  );
}
