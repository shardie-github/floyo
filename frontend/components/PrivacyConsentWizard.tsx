/**
 * Privacy Consent Wizard
 * Multi-step onboarding flow for privacy-first monitoring
 */

'use client';

import { useState } from 'react';
import { privacyAPI, verifyMFA, ConsentSchema } from '@/lib/privacy-api';
import { z } from 'zod';

interface ConsentWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function PrivacyConsentWizard({ onComplete, onCancel }: ConsentWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerified, setMfaVerified] = useState(false);

  const [formData, setFormData] = useState({
    consentGiven: false,
    dataRetentionDays: 14,
    mfaRequired: true,
    monitoringEnabled: false,
    apps: [] as Array<{ appId: string; appName: string; enabled: boolean; scope: 'metadata_only' | 'metadata_plus_usage' | 'none' }>,
    signals: [] as Array<{ signalKey: string; enabled: boolean; samplingRate: number }>,
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleMfaVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      const { sessionToken } = await verifyMFA(mfaCode);
      localStorage.setItem('mfa_session_token', sessionToken);
      setMfaVerified(true);
    } catch (err: any) {
      setError(err.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (formData.mfaRequired && !mfaVerified) {
        setError('MFA verification required');
        return;
      }

      // Update consent
      await privacyAPI.updateConsent({
        consentGiven: formData.consentGiven,
        dataRetentionDays: formData.dataRetentionDays,
        mfaRequired: formData.mfaRequired,
      });

      // Update apps
      for (const app of formData.apps) {
        await privacyAPI.updateApp(app);
      }

      // Update signals
      for (const signal of formData.signals) {
        await privacyAPI.updateSignal(signal);
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Privacy-First Monitoring Setup
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex items-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded ${
                s <= step
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Step 1: Purpose & Benefits */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Purpose & Benefits
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We offer optional, privacy-first monitoring to help you improve your daily workflows.
              It analyzes only the signals you explicitly enable to surface patterns and suggestions.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <p className="text-blue-900 dark:text-blue-100 text-sm font-medium mb-2">
                Important:
              </p>
              <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-disc list-inside">
                <li>Monitoring is OFF by default</li>
                <li>We never record passwords, message contents, screenshots, or keystrokes</li>
                <li>You control exactly what is collected</li>
                <li>You can turn monitoring ON/OFF anytime</li>
              </ul>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consentGiven}
                onChange={(e) =>
                  setFormData({ ...formData, consentGiven: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">
                I understand and want to proceed
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Choose Apps */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Choose Apps to Monitor
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Select which apps you want to monitor. You can change this anytime.
            </p>
            <div className="space-y-3">
              {['VS Code', 'Chrome', 'Terminal', 'Slack', 'Email'].map((appName) => (
                <div
                  key={appName}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={
                        formData.apps.find((a) => a.appName === appName)?.enabled || false
                      }
                      onChange={(e) => {
                        const apps = [...formData.apps];
                        const index = apps.findIndex((a) => a.appName === appName);
                        if (e.target.checked) {
                          if (index === -1) {
                            apps.push({
                              appId: appName.toLowerCase().replace(' ', '-'),
                              appName,
                              enabled: true,
                              scope: 'metadata_only',
                            });
                          } else {
                            apps[index].enabled = true;
                          }
                        } else {
                          if (index !== -1) {
                            apps[index].enabled = false;
                          }
                        }
                        setFormData({ ...formData, apps });
                      }}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{appName}</span>
                  </div>
                  {formData.apps.find((a) => a.appName === appName)?.enabled && (
                    <select
                      value={formData.apps.find((a) => a.appName === appName)?.scope || 'metadata_only'}
                      onChange={(e) => {
                        const apps = [...formData.apps];
                        const index = apps.findIndex((a) => a.appName === appName);
                        if (index !== -1) {
                          apps[index].scope = e.target.value as any;
                        }
                        setFormData({ ...formData, apps });
                      }}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="metadata_only">Metadata Only</option>
                      <option value="metadata_plus_usage">Metadata + Usage</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Choose Signals */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Choose Signals to Collect
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Select which telemetry signals to collect. You can adjust sampling rates.
            </p>
            <div className="space-y-3">
              {[
                { key: 'window_titles', label: 'Window Titles', defaultRate: 1.0 },
                { key: 'durations', label: 'App Usage Durations', defaultRate: 1.0 },
                { key: 'focus_switches', label: 'Focus Switches', defaultRate: 0.5 },
              ].map((signal) => {
                const existing = formData.signals.find((s) => s.signalKey === signal.key);
                return (
                  <div
                    key={signal.key}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={existing?.enabled || false}
                          onChange={(e) => {
                            const signals = [...formData.signals];
                            const index = signals.findIndex((s) => s.signalKey === signal.key);
                            if (e.target.checked) {
                              if (index === -1) {
                                signals.push({
                                  signalKey: signal.key,
                                  enabled: true,
                                  samplingRate: signal.defaultRate,
                                });
                              } else {
                                signals[index].enabled = true;
                              }
                            } else {
                              if (index !== -1) {
                                signals[index].enabled = false;
                              }
                            }
                            setFormData({ ...formData, signals });
                          }}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{signal.label}</span>
                      </label>
                    </div>
                    {existing?.enabled && (
                      <div className="mt-2 ml-8">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Sampling Rate: {(existing.samplingRate * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={existing.samplingRate}
                          onChange={(e) => {
                            const signals = [...formData.signals];
                            const index = signals.findIndex((s) => s.signalKey === signal.key);
                            if (index !== -1) {
                              signals[index].samplingRate = parseFloat(e.target.value);
                            }
                            setFormData({ ...formData, signals });
                          }}
                          className="w-full mt-1"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Data Retention */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Data Retention
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Choose how long to keep your data. Older data is automatically deleted.
            </p>
            <div className="space-y-3">
              {[7, 14, 30, 90].map((days) => (
                <label
                  key={days}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer ${
                    formData.dataRetentionDays === days
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="retention"
                    value={days}
                    checked={formData.dataRetentionDays === days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dataRetentionDays: parseInt(e.target.value),
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {days} days {days === 14 && '(recommended)'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: MFA Setup */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Multi-Factor Authentication
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              MFA is required to enable monitoring, export data, or delete data.
            </p>
            {!mfaVerified ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter TOTP Code
                  </label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleMfaVerify}
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Verify MFA
                </button>
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200">✓ MFA Verified</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Back
        </button>
        {step < 5 ? (
          <button
            onClick={handleNext}
            disabled={step === 1 && !formData.consentGiven}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || (formData.mfaRequired && !mfaVerified) || !formData.consentGiven}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Start Monitoring'}
          </button>
        )}
      </div>
    </div>
  );
}
