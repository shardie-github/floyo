'use client';

import { useState } from 'react';
import { Zap, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface ZapierConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  webhook_url?: string;
  last_sync?: string;
}

export function ZapierIntegration() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<ZapierConnection[]>([]);
  const [error, setError] = useState('');

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/zapier/status');
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected || false);
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error('Failed to check Zapier connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectZapier = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/integrations/zapier/connect', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Zapier OAuth
        if (data.auth_url) {
          window.location.href = data.auth_url;
        } else {
          setConnected(true);
          await checkConnection();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to connect to Zapier');
      }
    } catch (err) {
      setError('Failed to connect to Zapier');
    } finally {
      setLoading(false);
    }
  };

  const disconnectZapier = async () => {
    if (!confirm('Are you sure you want to disconnect Zapier? This will stop all active workflows.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/integrations/zapier/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConnected(false);
        setConnections([]);
      } else {
        setError('Failed to disconnect Zapier');
      }
    } catch (err) {
      setError('Failed to disconnect Zapier');
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    checkConnection();
  });

  if (loading && !connected) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-orange-600" />
          <div>
            <h3 className="text-lg font-semibold">Zapier Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect Floyo with 5000+ apps via Zapier
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${connected ? 'text-green-600' : 'text-gray-400'}`}>
          {connected ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          <span className="text-sm font-medium">{connected ? 'Connected' : 'Not Connected'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {connected ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Active Connections</h4>
            {connections.length > 0 ? (
              <div className="space-y-2">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{conn.name}</div>
                      {conn.last_sync && (
                        <div className="text-xs text-gray-500">
                          Last sync: {new Date(conn.last_sync).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 text-xs rounded ${
                        conn.status === 'connected'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {conn.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No active connections. Create a Zap in Zapier to get started.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <a
              href="https://zapier.com/apps/floyo/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Zapier
            </a>
            <button
              onClick={disconnectZapier}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect Floyo to Zapier to automate workflows across 5000+ apps. Create Zaps to trigger
            actions based on your file usage patterns.
          </p>
          <button
            onClick={connectZapier}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {loading ? 'Connecting...' : 'Connect to Zapier'}
          </button>
        </div>
      )}
    </div>
  );
}
