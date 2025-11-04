/**
 * Trust Dashboard Page
 * User-facing transparency dashboard showing Guardian activity
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TrustSummary {
  total_events: number;
  risk_distribution: Record<string, number>;
  action_distribution: Record<string, number>;
  confidence_score: number;
  entries: Array<{
    event_id: string;
    timestamp: string;
    event_type: string;
    description: string;
    risk_level: string;
    guardian_action: string;
    purpose: string;
  }>;
}

interface GuardianEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  scope: string;
  data_class: string;
  description: string;
  purpose: string;
  risk_level: string;
  risk_score: number;
  guardian_action: string;
  action_reason: string;
  source: string;
}

export default function TrustDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<TrustSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<GuardianEvent | null>(null);
  const [privateMode, setPrivateMode] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadTrustSummary();
    loadSettings();
  }, [days]);

  const loadTrustSummary = async () => {
    try {
      const response = await fetch(`/api/guardian/trust-summary?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to load trust summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/guardian/settings');
      if (response.ok) {
        const data = await response.json();
        setPrivateMode(data.private_mode_enabled);
        setLockdown(data.lockdown_enabled);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const togglePrivateMode = async () => {
    try {
      const response = await fetch('/api/guardian/settings/private-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !privateMode }),
      });
      if (response.ok) {
        setPrivateMode(!privateMode);
      }
    } catch (error) {
      console.error('Failed to toggle private mode:', error);
    }
  };

  const toggleLockdown = async () => {
    if (!confirm('Enable emergency data lockdown? This will freeze all telemetry.')) {
      return;
    }
    try {
      const response = await fetch('/api/guardian/settings/lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !lockdown }),
      });
      if (response.ok) {
        setLockdown(!lockdown);
      }
    } catch (error) {
      console.error('Failed to toggle lockdown:', error);
    }
  };

  const loadEventDetails = async (eventId: string) => {
    try {
      const response = await fetch(`/api/guardian/event/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedEvent(data);
      }
    } catch (error) {
      console.error('Failed to load event details:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskPercentage = (risk: string) => {
    if (!summary) return 0;
    const total = summary.total_events;
    const count = summary.risk_distribution[risk] || 0;
    return total > 0 ? (count / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Guardian
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your data privacy transparency dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={togglePrivateMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              privateMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {privateMode ? '🔒 Private Mode ON' : '🔓 Private Mode OFF'}
          </button>
          <button
            onClick={toggleLockdown}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              lockdown
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {lockdown ? '🚨 Lockdown Active' : 'Emergency Lockdown'}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              This Week's Summary
            </h2>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>

          <div className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {summary.total_events === 0 ? (
              "No data access events recorded."
            ) : (
              <>
                Your data was accessed <strong>{summary.total_events}</strong> times.
                {summary.risk_distribution.low > 0 && (
                  <> <strong>{summary.risk_distribution.low}</strong> were low-risk,</>
                )}
                {summary.risk_distribution.medium > 0 && (
                  <> <strong>{summary.risk_distribution.medium}</strong> were medium-risk,</>
                )}
                {(summary.risk_distribution.high || summary.risk_distribution.critical) > 0 && (
                  <> <strong>{(summary.risk_distribution.high || 0) + (summary.risk_distribution.critical || 0)}</strong> were high-risk.</>
                )}
              </>
            )}
          </div>

          {/* Risk Meter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Confidence Score</span>
              <span className="text-2xl font-bold text-blue-600">{summary.confidence_score.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${summary.confidence_score}%` }}
              ></div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {['low', 'medium', 'high', 'critical'].map((risk) => (
              <div key={risk} className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(risk)}`}>
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.risk_distribution[risk] || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getRiskPercentage(risk).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {summary && summary.entries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {summary.entries.map((event) => (
              <div
                key={event.event_id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => loadEventDetails(event.event_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(event.risk_level)}`}>
                        {event.risk_level}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {event.description}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.purpose}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {event.guardian_action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Event Details
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">What happened?</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedEvent.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Why?</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedEvent.purpose}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Risk Assessment</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded font-medium ${getRiskColor(selectedEvent.risk_level)}`}>
                    {selectedEvent.risk_level} ({selectedEvent.risk_score.toFixed(2)})
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Guardian Action</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedEvent.action_reason}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Data Class</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedEvent.data_class}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Source</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedEvent.source}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
