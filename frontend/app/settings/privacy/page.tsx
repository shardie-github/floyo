'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PrivacySettings {
  monitoringEnabled: boolean;
  dataRetentionDays: number;
  appAllowlists: Array<{
    appId: string;
    appName: string;
    enabled: boolean;
  }>;
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    monitoringEnabled: false,
    dataRetentionDays: 14,
    appAllowlists: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/privacy/settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading privacy settings...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Privacy Settings</h1>
        <p className="text-muted-foreground">
          Control what data is tracked and how long it's stored
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring</CardTitle>
          <CardDescription>Enable or disable file usage tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Monitoring</p>
              <p className="text-sm text-muted-foreground">
                Track file usage patterns to generate insights
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.monitoringEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, monitoringEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>How long to keep your tracking data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Retention Period: {settings.dataRetentionDays} days
              </label>
              <input
                type="range"
                min="7"
                max="90"
                value={settings.dataRetentionDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    dataRetentionDays: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>7 days</span>
                <span>90 days</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Data older than {settings.dataRetentionDays} days will be automatically deleted.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Allowlists</CardTitle>
          <CardDescription>Control which applications can track file usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings.appAllowlists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No apps configured. Install the Floyo extension or desktop app to start tracking.
              </p>
            ) : (
              settings.appAllowlists.map((app) => (
                <div
                  key={app.appId}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">{app.appName}</p>
                    <p className="text-sm text-muted-foreground">App ID: {app.appId}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={app.enabled}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          appAllowlists: settings.appAllowlists.map((a) =>
                            a.appId === app.appId ? { ...a, enabled: e.target.checked } : a
                          ),
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
