'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface SystemState {
  timestamp: string
  issues: Array<{
    type: string
    severity: string
    message: string
    impact?: string
  }>
  opportunities: Array<{
    type: string
    priority: string
    current: number
    target: number
    action: string
    expected_impact: string
    confidence: number
  }>
  health_score: number
  alignment_score: number
  recommendations: Array<{
    type: string
    action: string
    expected_impact: string
  }>
}

interface CycleResults {
  cycle_id: string
  started_at: string
  completed_at: string
  duration_seconds: number
  dry_run: boolean
  summary: {
    health_score: number
    alignment_score: number
    issues_found: number
    issues_healed: number
    optimizations_applied: number
    patterns_learned: number
    decisions_made: number
  }
  phases: {
    analysis?: SystemState
    healing?: any
    optimization?: any
    preventive?: any
    learning?: any
    decisions?: any
    alignment?: any
  }
}

export function AutonomousDashboard() {
  const [systemState, setSystemState] = useState<SystemState | null>(null)
  const [cycleResults, setCycleResults] = useState<CycleResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [runningCycle, setRunningCycle] = useState(false)

  useEffect(() => {
    loadSystemState()
  }, [])

  const loadSystemState = async () => {
    try {
      const state = await apiClient.request<SystemState>('/api/autonomous/system-state')
      setSystemState(state)
    } catch (error) {
      console.error('Failed to load system state:', error)
    }
  }

  const runAutonomousCycle = async (dryRun: boolean = true) => {
    setRunningCycle(true)
    setLoading(true)
    try {
      const results = await apiClient.request<CycleResults>('/api/autonomous/run-cycle', {
        method: 'POST',
        body: JSON.stringify({ dry_run: dryRun }),
      })
      setCycleResults(results)
      await loadSystemState() // Refresh state after cycle
    } catch (error) {
      console.error('Failed to run autonomous cycle:', error)
    } finally {
      setRunningCycle(false)
      setLoading(false)
    }
  }

  const triggerSelfHealing = async (dryRun: boolean = true) => {
    setLoading(true)
    try {
      const results = await apiClient.request('/api/autonomous/self-heal', {
        method: 'POST',
        body: JSON.stringify({ dry_run: dryRun }),
      })
      console.log('Self-healing results:', results)
      await loadSystemState()
    } catch (error) {
      console.error('Failed to trigger self-healing:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Autonomous Engine Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => runAutonomousCycle(true)}
            disabled={runningCycle || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {runningCycle ? 'Running...' : 'Run Cycle (Dry Run)'}
          </button>
          <button
            onClick={() => triggerSelfHealing(true)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Self-Heal (Dry Run)
          </button>
        </div>
      </div>

      {systemState && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Health Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Health Score</span>
                  <span className={`text-2xl font-bold ${getHealthColor(systemState.health_score)}`}>
                    {systemState.health_score.toFixed(1)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      systemState.health_score >= 80
                        ? 'bg-green-500'
                        : systemState.health_score >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${systemState.health_score}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Alignment Score</span>
                  <span className={`text-2xl font-bold ${getHealthColor(systemState.alignment_score)}`}>
                    {systemState.alignment_score.toFixed(1)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      systemState.alignment_score >= 80
                        ? 'bg-green-500'
                        : systemState.alignment_score >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${systemState.alignment_score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Issues */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Issues Detected ({systemState.issues.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {systemState.issues.length === 0 ? (
                <p className="text-gray-500 text-sm">No issues detected</p>
              ) : (
                systemState.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="font-semibold">{issue.type}</div>
                    <div className="text-sm">{issue.message}</div>
                    {issue.impact && (
                      <div className="text-xs mt-1 opacity-75">Impact: {issue.impact}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Optimization Opportunities ({systemState.opportunities.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {systemState.opportunities.length === 0 ? (
                <p className="text-gray-500 text-sm">No optimization opportunities</p>
              ) : (
                systemState.opportunities.map((opp, idx) => (
                  <div key={idx} className="p-3 rounded border border-blue-200 bg-blue-50">
                    <div className="font-semibold text-blue-900">{opp.type}</div>
                    <div className="text-sm text-blue-700">{opp.action}</div>
                    <div className="text-xs mt-1 text-blue-600">
                      Current: {opp.current.toFixed(1)}% → Target: {opp.target.toFixed(1)}%
                    </div>
                    <div className="text-xs mt-1 text-blue-600">
                      Expected: {opp.expected_impact} (Confidence: {(opp.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Recommendations ({systemState.recommendations.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {systemState.recommendations.length === 0 ? (
                <p className="text-gray-500 text-sm">No recommendations</p>
              ) : (
                systemState.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded border border-purple-200 bg-purple-50">
                    <div className="font-semibold text-purple-900">{rec.type}</div>
                    <div className="text-sm text-purple-700">{rec.action}</div>
                    <div className="text-xs mt-1 text-purple-600">{rec.expected_impact}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {cycleResults && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">
            Last Autonomous Cycle: {cycleResults.cycle_id}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Issues Found</div>
              <div className="text-2xl font-bold">{cycleResults.summary.issues_found}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Issues Healed</div>
              <div className="text-2xl font-bold text-green-600">
                {cycleResults.summary.issues_healed}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Optimizations</div>
              <div className="text-2xl font-bold text-blue-600">
                {cycleResults.summary.optimizations_applied}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-2xl font-bold">
                {cycleResults.duration_seconds.toFixed(1)}s
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Started: {new Date(cycleResults.started_at).toLocaleString()}
            {cycleResults.completed_at &&
              ` • Completed: ${new Date(cycleResults.completed_at).toLocaleString()}`}
            {cycleResults.dry_run && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                DRY RUN
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
