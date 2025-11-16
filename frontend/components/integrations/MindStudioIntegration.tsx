'use client';

import { useState } from 'react';
import { Brain, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface MindStudioAgent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  last_sync?: string;
  workflow_count?: number;
}

export function MindStudioIntegration() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<MindStudioAgent[]>([]);
  const [error, setError] = useState('');

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/mindstudio/status');
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected || false);
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to check MindStudio connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectMindStudio = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/integrations/mindstudio/connect', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to MindStudio OAuth
        if (data.auth_url) {
          window.location.href = data.auth_url;
        } else {
          setConnected(true);
          await checkConnection();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to connect to MindStudio');
      }
    } catch (err) {
      setError('Failed to connect to MindStudio');
    } finally {
      setLoading(false);
    }
  };

  const disconnectMindStudio = async () => {
    if (!confirm('Are you sure you want to disconnect MindStudio? This will stop all active agents.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/integrations/mindstudio/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConnected(false);
        setAgents([]);
      } else {
        setError('Failed to disconnect MindStudio');
      }
    } catch (err) {
      setError('Failed to disconnect MindStudio');
    } finally {
      setLoading(false);
    }
  };

  const syncAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/mindstudio/sync', {
        method: 'POST',
      });

      if (response.ok) {
        await checkConnection();
      } else {
        setError('Failed to sync agents');
      }
    } catch (err) {
      setError('Failed to sync agents');
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
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">MindStudio Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect AI agents from MindStudio to automate workflows
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
          <div className="flex items-center justify-between">
            <h4 className="font-medium">AI Agents</h4>
            <button
              onClick={syncAgents}
              disabled={loading}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
          {agents.length > 0 ? (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-500">
                      {agent.workflow_count || 0} workflows
                      {agent.last_sync && ` • Last sync: ${new Date(agent.last_sync).toLocaleString()}`}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 text-xs rounded ${
                      agent.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : agent.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No agents found. Create agents in MindStudio and sync them here.
            </p>
          )}

          <div className="flex gap-2">
            <a
              href="https://mindstudio.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open MindStudio
            </a>
            <button
              onClick={disconnectMindStudio}
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
            Connect MindStudio to Floyo to leverage AI agents for intelligent workflow automation.
            Agents can analyze patterns and suggest optimizations.
          </p>
          <button
            onClick={connectMindStudio}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Brain className="w-4 h-4" />
            {loading ? 'Connecting...' : 'Connect to MindStudio'}
          </button>
        </div>
      )}
    </div>
  );
}
