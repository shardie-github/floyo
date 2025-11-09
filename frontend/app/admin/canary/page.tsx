'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function CanaryDashboard() {
  const [module, setModule] = useState('checkout');

  const { data: flags, isLoading } = useQuery({
    queryKey: ['flags'],
    queryFn: async () => {
      const res = await fetch('/api/flags');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const canaryConfig = flags?.canary?.[module];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          Canary Deployment Dashboard
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Module
          </label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="checkout">Checkout</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        ) : canaryConfig ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Configuration
              </h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {canaryConfig.enabled ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-gray-400">Disabled</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Traffic</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {canaryConfig.trafficPercentage}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Channel</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {canaryConfig.channels.web}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Stop-Loss Thresholds
              </h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {(canaryConfig.stopLossThresholds.errorRate * 100).toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">p95 Latency</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {canaryConfig.stopLossThresholds.p95LatencyMs}ms
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Rollback</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {canaryConfig.stopLossThresholds.rollbackOnBreach ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-gray-400">Disabled</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400">
              No canary configuration found for module: {module}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
