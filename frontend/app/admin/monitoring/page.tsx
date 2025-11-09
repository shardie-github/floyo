'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface SystemMetrics {
  timestamp: string;
  requests?: {
    total: number;
    errors: number;
    avgLatency: number;
  };
  errors?: Array<{
    type: string;
    message: string;
    count: number;
  }>;
}

export default function MonitoringDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: metrics, refetch } = useQuery<SystemMetrics[]>({
    queryKey: ['monitoring-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/monitoring/metrics');
      return res.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: health } = useQuery<{
    status: string;
    errorRate: number;
    avgLatency: number;
  }>({
    queryKey: ['monitoring-health'],
    queryFn: async () => {
      const res = await fetch('/api/monitoring/health');
      return res.json();
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  if (!metrics || !health) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Real-time Monitoring
          </h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
            <div className={`text-2xl font-bold ${getStatusColor(health.status)}`}>
              {health.status.toUpperCase()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Error Rate</div>
            <div className={`text-2xl font-bold ${health.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
              {(health.errorRate * 100).toFixed(2)}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Latency</div>
            <div className={`text-2xl font-bold ${health.avgLatency > 500 ? 'text-red-600' : 'text-green-600'}`}>
              {health.avgLatency.toFixed(0)}ms
            </div>
          </div>
        </div>

        {/* Recent Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Recent Metrics
          </h2>
          <div className="space-y-2">
            {metrics.slice(-10).reverse().map((metric, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                  {metric.requests && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {metric.requests.total} requests • {metric.requests.errors} errors • {metric.requests.avgLatency.toFixed(0)}ms avg
                    </div>
                  )}
                </div>
                {metric.requests && (
                  <div className={`text-sm font-semibold ${
                    metric.requests.errors / metric.requests.total > 0.05
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {((metric.requests.errors / metric.requests.total) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
