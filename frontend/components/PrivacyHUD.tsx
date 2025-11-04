/**
 * Privacy HUD Component
 * Always-visible indicator when monitoring is ON
 */

'use client';

import { useState, useEffect } from 'react';
import { privacyAPI } from '@/lib/privacy-api';

export function PrivacyHUD() {
  const [monitoring, setMonitoring] = useState(false);
  const [appsCount, setAppsCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const [prefs, apps] = await Promise.all([
        privacyAPI.getConsent(),
        privacyAPI.getApps(),
      ]);
      setMonitoring(prefs.monitoringEnabled && prefs.consentGiven);
      setAppsCount(apps.filter((a: any) => a.enabled).length);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handlePause = async (duration: '15m' | '1h' | 'tomorrow') => {
    const now = new Date();
    let until: Date;

    switch (duration) {
      case '15m':
        until = new Date(now.getTime() + 15 * 60 * 1000);
        break;
      case '1h':
        until = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'tomorrow':
        until = new Date(now);
        until.setHours(24, 0, 0, 0);
        break;
    }

    setPaused(true);
    setPausedUntil(until);

    // Store pause state in localStorage (client-side only)
    localStorage.setItem('privacy_paused_until', until.toISOString());

    // Clear pause after duration
    setTimeout(() => {
      setPaused(false);
      setPausedUntil(null);
      localStorage.removeItem('privacy_paused_until');
    }, until.getTime() - now.getTime());
  };

  // Check if paused state has expired
  useEffect(() => {
    const pausedUntilStr = localStorage.getItem('privacy_paused_until');
    if (pausedUntilStr) {
      const pausedUntil = new Date(pausedUntilStr);
      if (pausedUntil > new Date()) {
        setPaused(true);
        setPausedUntil(pausedUntil);
      } else {
        localStorage.removeItem('privacy_paused_until');
      }
    }
  }, []);

  // Check kill-switch
  const killSwitchActive = process.env.NEXT_PUBLIC_PRIVACY_KILL_SWITCH === 'true';

  if (loading || (!monitoring && !killSwitchActive)) {
    return null;
  }

  if (killSwitchActive) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
          <span>Private Mode — No telemetry collected</span>
        </span>
      </div>
    );
  }

  if (paused) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
          <span>
            Monitoring Paused
            {pausedUntil && (
              <span className="ml-2 opacity-75">
                until {pausedUntil.toLocaleTimeString()}
              </span>
            )}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
          <span>Monitoring ON</span>
          {appsCount > 0 && (
            <span className="opacity-75">({appsCount} app{appsCount !== 1 ? 's' : ''})</span>
          )}
        </span>
        <div className="flex items-center space-x-2 ml-2 border-l border-blue-500 pl-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs underline hover:no-underline"
            aria-label="Show details"
          >
            Details
          </button>
          <div className="relative">
            <button
              className="text-xs underline hover:no-underline"
              aria-label="Pause monitoring"
            >
              Pause
            </button>
            {showDetails && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white rounded-lg shadow-lg p-2 min-w-[200px]">
                <button
                  onClick={() => handlePause('15m')}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded text-xs"
                >
                  Pause 15m
                </button>
                <button
                  onClick={() => handlePause('1h')}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded text-xs"
                >
                  Pause 1h
                </button>
                <button
                  onClick={() => handlePause('tomorrow')}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded text-xs"
                >
                  Pause until tomorrow
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-blue-500">
          <a
            href="/settings/privacy"
            className="text-xs underline hover:no-underline"
          >
            What's collected?
          </a>
        </div>
      )}
    </div>
  );
}
