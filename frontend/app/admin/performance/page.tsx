'use client';

import { useEffect, useState } from 'react';
import { metrics, metricNames } from '@/lib/obs/metrics';

// [CRUX+HARDEN:BEGIN:perf-dashboard]

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
}

export default function PerformanceDashboard() {
  const [metricData, setMetricData] = useState<MetricData[]>([]);
  const [counters, setCounters] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const exported = metrics.export();
      setCounters(exported.counters);
      setMetricData(exported.metrics.slice(-50)); // Last 50 metrics
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatValue = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toString();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Performance Dashboard</h1>

      {/* Counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Events Ingested"
          value={counters[metricNames.EVENTS_INGESTED] || 0}
          format={formatValue}
        />
        <MetricCard
          title="Workflows Run"
          value={counters[metricNames.WORKFLOWS_RUN] || 0}
          format={formatValue}
        />
        <MetricCard
          title="Workflows Failed"
          value={counters[metricNames.WORKFLOWS_FAILED] || 0}
          format={formatValue}
        />
        <MetricCard
          title="API Errors"
          value={counters[metricNames.API_ERRORS] || 0}
          format={formatValue}
        />
        <MetricCard
          title="Rate Limit Hits"
          value={counters[metricNames.RATE_LIMIT_HITS] || 0}
          format={formatValue}
        />
        <MetricCard
          title="DB Queries"
          value={counters[metricNames.DB_QUERIES] || 0}
          format={formatValue}
        />
      </div>

      {/* Metrics Timeline */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Metrics</h2>
        <div className="space-y-2">
          {metricData.slice(-10).reverse().map((metric, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b">
              <span className="font-mono text-sm">{metric.name}</span>
              <span className="font-semibold">{formatValue(metric.value)}</span>
              <span className="text-xs text-gray-500">
                {new Date(metric.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  format 
}: { 
  title: string; 
  value: number; 
  format: (v: number) => string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm text-gray-600 mb-2">{title}</h3>
      <p className="text-2xl font-bold">{format(value)}</p>
    </div>
  );
}

// [CRUX+HARDEN:END:perf-dashboard]
