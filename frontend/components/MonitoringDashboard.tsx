'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { statsAPI } from '@/lib/api'

// Mock monitoring API - replace with actual endpoint when available
const monitoringAPI = {
  getMetrics: async () => {
    const response = await fetch('/api/monitoring/metrics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch metrics')
    return response.json()
  },
  getHealth: async () => {
    const response = await fetch('/api/monitoring/health/detailed', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch health')
    return response.json()
  },
}

export function MonitoringDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['monitoring-metrics'],
    queryFn: monitoringAPI.getMetrics,
    refetchInterval: refreshInterval,
  })

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['monitoring-health'],
    queryFn: monitoringAPI.getHealth,
    refetchInterval: refreshInterval,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: statsAPI.get,
    refetchInterval: refreshInterval,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (metricsLoading || healthLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Monitoring Dashboard</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Refresh:
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
            </select>
          </label>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(health.components || {}).map(([component, status]: [string, any]) => (
              <div key={component} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {component.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-sm font-semibold ${getStatusColor(status.status || status)}`}>
                    {status.status || status}
                  </span>
                </div>
                {status.response_time_ms && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Response: {status.response_time_ms.toFixed(2)}ms
                  </div>
                )}
                {status.utilization !== undefined && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Utilization: {(status.utilization * 100).toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status.utilization < 0.7 ? 'bg-green-600' : status.utilization < 0.9 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${status.utilization * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.system && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.system.cpu_percent?.toFixed(1) || 'N/A'}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.system.memory_mb ? `${metrics.system.memory_mb.toFixed(0)} MB` : 'N/A'}
                </div>
                {metrics.system.memory_percent && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metrics.system.memory_percent.toFixed(1)}% of system
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Threads</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.system.num_threads || 'N/A'}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Open Files</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.system.open_files || 'N/A'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Application Metrics */}
      {metrics && metrics.application && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Application Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.application.active_users || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.application.total_events?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Patterns</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.application.total_patterns?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Suggestions</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.application.total_suggestions?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Metrics */}
      {metrics && metrics.database && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Database Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pool Size</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.database.pool_size || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Checked Out</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.database.pool_checked_out || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Utilization</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.database.pool_utilization
                  ? `${(metrics.database.pool_utilization * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overflow</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.database.pool_overflow || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cache Metrics */}
      {metrics && metrics.cache && metrics.cache.status !== 'not_configured' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Cache Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              <div className={`text-lg font-semibold ${getStatusColor(metrics.cache.status)}`}>
                {metrics.cache.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Used</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.cache.used_memory_mb
                  ? `${metrics.cache.used_memory_mb.toFixed(0)} MB`
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Connected Clients</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.cache.connected_clients || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Commands Processed</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.cache.total_commands_processed?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
