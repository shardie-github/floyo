/**
 * Monitoring Dashboard Component
 * 
 * Provides real-time monitoring of system health, metrics, and performance.
 */

'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: ComponentHealth
    supabase: ComponentHealth
    environment: ComponentHealth
    integrations: Record<string, ComponentHealth>
  }
  metrics?: {
    responseTime: number
    uptime: number
  }
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  latency?: number
}

export function MonitoringDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  async function fetchHealth() {
    try {
      const response = await fetch('/api/health/comprehensive')
      if (!response.ok) {
        throw new Error('Failed to fetch health status')
      }
      const data = await response.json()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading health status...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!health) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Health</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
          {health.status.toUpperCase()}
        </div>
      </div>

      {/* Metrics */}
      {health.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            <div className="text-2xl font-bold">{health.metrics.responseTime}ms</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            <div className="text-2xl font-bold">{Math.floor(health.metrics.uptime / 3600)}h</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">Version</div>
            <div className="text-2xl font-bold">{health.version || '1.0.0'}</div>
          </div>
        </div>
      )}

      {/* Component Health */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Component Status</h3>
        
        {/* Database */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Database</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {health.checks.database.message}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(health.checks.database.status)}`}>
              {health.checks.database.status}
            </div>
          </div>
          {health.checks.database.latency && (
            <div className="text-xs text-gray-500 mt-2">
              Latency: {health.checks.database.latency}ms
            </div>
          )}
        </div>

        {/* Supabase */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Supabase</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {health.checks.supabase.message}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(health.checks.supabase.status)}`}>
              {health.checks.supabase.status}
            </div>
          </div>
          {health.checks.supabase.latency && (
            <div className="text-xs text-gray-500 mt-2">
              Latency: {health.checks.supabase.latency}ms
            </div>
          )}
        </div>

        {/* Integrations */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="font-medium mb-2">Integrations</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(health.checks.integrations).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm capitalize">{name}</span>
                <div className={`px-2 py-1 rounded text-xs ${getStatusColor(status.status)}`}>
                  {status.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
