/**
 * Privacy Settings Page
 * Comprehensive privacy controls and transparency
 */

'use client';

import { useState, useEffect } from 'react';
import { privacyAPI, verifyMFA, checkMfaElevation } from '@/lib/privacy-api';
import Link from 'next/link';

export default function PrivacySettingsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [transparencyLog, setTransparencyLog] = useState<any[]>([]);
  const [mfaElevated, setMfaElevated] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
    checkMfa();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prefsData, appsData, signalsData, logData] = await Promise.all([
        privacyAPI.getConsent(),
        privacyAPI.getApps(),
        privacyAPI.getSignals(),
        privacyAPI.getTransparencyLog(1, 50),
      ]);
      setPrefs(prefsData);
      setApps(appsData);
      setSignals(signalsData);
      setTransparencyLog(logData.logs || []);
    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMfa = async () => {
    const { elevated } = await checkMfaElevation();
    setMfaElevated(elevated);
  };

  const handleMfaVerify = async () => {
    try {
      const { sessionToken } = await verifyMFA(mfaCode);
      localStorage.setItem('mfa_session_token', sessionToken);
      setMfaElevated(true);
      setMfaCode('');
    } catch (error: any) {
      alert(error.message || 'MFA verification failed');
    }
  };

  const handleExport = async () => {
    if (!mfaElevated) {
      alert('MFA required to export data');
      return;
    }
    try {
      setExporting(true);
      const result = await privacyAPI.exportData('json');
      alert(`Export ready! Download link: ${result.signedUrl}`);
    } catch (error: any) {
      alert(error.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (immediate: boolean) => {
    if (!mfaElevated) {
      alert('MFA required to delete data');
      return;
    }
    if (!confirm(`Are you sure you want to ${immediate ? 'immediately' : 'schedule'} delete all your data?`)) {
      return;
    }
    try {
      setDeleting(true);
      const result = await privacyAPI.deleteData(immediate);
      alert(result.message || 'Delete request processed');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'apps', label: 'Apps & Scopes' },
    { id: 'signals', label: 'Signals' },
    { id: 'retention', label: 'Data & Retention' },
    { id: 'security', label: 'Security (MFA)' },
    { id: 'transparency', label: 'Transparency Log' },
    { id: 'export', label: 'Export/Delete' },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your privacy preferences and data
        </p>
      </div>

      {/* MFA Warning Banner */}
      {!mfaElevated && ['overview', 'apps', 'signals', 'retention', 'export'].includes(activeTab) && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>MFA required:</strong> Multi-factor authentication is required to modify settings, export, or delete data.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Monitoring Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Monitoring Enabled</span>
                  <span className={`font-medium ${prefs?.monitoringEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {prefs?.monitoringEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Consent Given</span>
                  <span className={`font-medium ${prefs?.consentGiven ? 'text-green-600' : 'text-gray-500'}`}>
                    {prefs?.consentGiven ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Apps Monitored</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {apps.filter((a) => a.enabled).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Data Retention</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {prefs?.dataRetentionDays || 14} days
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
                Your Data, Your Rules
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                Your telemetry is encrypted and stored under your account. No staff or administrators can view your telemetry.
              </p>
              <Link
                href="/privacy/policy"
                className="text-blue-600 dark:text-blue-400 underline hover:no-underline text-sm"
              >
                Read full privacy policy →
              </Link>
            </div>
          </div>
        )}

        {/* Apps & Scopes */}
        {activeTab === 'apps' && (
          <div className="space-y-4">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {app.appName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{app.appId}</p>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={app.enabled}
                      disabled={!mfaElevated}
                      onChange={async (e) => {
                        try {
                          await privacyAPI.updateApp({ ...app, enabled: e.target.checked });
                          await loadData();
                        } catch (error: any) {
                          alert(error.message || 'Failed to update app');
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {app.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
                {app.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scope
                    </label>
                    <select
                      value={app.scope}
                      disabled={!mfaElevated}
                      onChange={async (e) => {
                        try {
                          await privacyAPI.updateApp({ ...app, scope: e.target.value as any });
                          await loadData();
                        } catch (error: any) {
                          alert(error.message || 'Failed to update scope');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="metadata_only">Metadata Only (Recommended)</option>
                      <option value="metadata_plus_usage">Metadata + Usage</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Signals */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {signal.signalKey}
                    </h3>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signal.enabled}
                      disabled={!mfaElevated}
                      onChange={async (e) => {
                        try {
                          await privacyAPI.updateSignal({ ...signal, enabled: e.target.checked });
                          await loadData();
                        } catch (error: any) {
                          alert(error.message || 'Failed to update signal');
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {signal.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
                {signal.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sampling Rate: {(signal.samplingRate * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={signal.samplingRate}
                      disabled={!mfaElevated}
                      onChange={async (e) => {
                        try {
                          await privacyAPI.updateSignal({
                            ...signal,
                            samplingRate: parseFloat(e.target.value),
                          });
                          await loadData();
                        } catch (error: any) {
                          alert(error.message || 'Failed to update sampling rate');
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Data & Retention */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Data Retention
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Retention Period (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={prefs?.dataRetentionDays || 14}
                    disabled={!mfaElevated}
                    onChange={async (e) => {
                      try {
                        await privacyAPI.updateConsent({
                          consentGiven: prefs?.consentGiven || false,
                          dataRetentionDays: parseInt(e.target.value),
                          mfaRequired: prefs?.mfaRequired || true,
                        });
                        await loadData();
                      } catch (error: any) {
                        alert(error.message || 'Failed to update retention');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Data older than this period will be automatically deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security (MFA) */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Multi-Factor Authentication
              </h2>
              {mfaElevated ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200">
                    ✓ MFA session active (expires in 1 hour)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Enter your TOTP code to elevate your session for sensitive operations.
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleMfaVerify}
                      disabled={mfaCode.length !== 6}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transparency Log */}
        {activeTab === 'transparency' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Transparency Log
              </h2>
              <div className="space-y-2">
                {transparencyLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.resource && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Resource: {log.resource}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Export/Delete */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Export Your Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Download all your telemetry data in JSON format. Export links expire after 1 hour.
              </p>
              <button
                onClick={handleExport}
                disabled={!mfaElevated || exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
              <h2 className="text-xl font-semibold mb-4 text-red-900 dark:text-red-100">
                Delete Your Data
              </h2>
              <p className="text-red-800 dark:text-red-200 mb-4">
                Permanently delete all your telemetry data. This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDelete(false)}
                  disabled={!mfaElevated || deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Processing...' : 'Schedule Delete (7 days)'}
                </button>
                <button
                  onClick={() => handleDelete(true)}
                  disabled={!mfaElevated || deleting}
                  className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Immediately'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
