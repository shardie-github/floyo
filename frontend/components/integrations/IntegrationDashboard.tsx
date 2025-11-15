/**
 * Integration Dashboard Component
 * Displays status and management for all integrations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Integration {
  id: string;
  name: string;
  enabled: boolean;
  status: 'configured' | 'not_configured' | 'connected' | 'disconnected';
  endpoints?: Record<string, string>;
}

interface IntegrationStatus {
  status: string;
  timestamp: string;
  integrations: Integration[];
  usage?: Record<string, string>;
}

export function IntegrationDashboard() {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/status');
      if (!response.ok) {
        throw new Error('Failed to fetch integration status');
      }
      const data = await response.json();
      setIntegrationStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'not_configured':
      case 'disconnected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusBadge = (integration: Integration) => {
    const statusText = integration.status.replace('_', ' ');
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}
      >
        {statusText}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchIntegrationStatus}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!integrationStatus) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your external integrations
          </p>
        </div>
        <button
          onClick={fetchIntegrationStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrationStatus.integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {integration.id.replace('_', ' ')}
                  </CardDescription>
                </div>
                {getStatusBadge(integration)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{integration.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Enabled:</span>
                  <span className={integration.enabled ? 'text-green-600' : 'text-red-600'}>
                    {integration.enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                {integration.endpoints && Object.keys(integration.endpoints).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600 mb-2">Endpoints:</p>
                    <div className="space-y-1">
                      {Object.entries(integration.endpoints).map(([key, value]) => (
                        <div key={key} className="text-xs font-mono text-gray-500">
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {integrationStatus.usage && integrationStatus.usage[`last${integration.id}ETL`] && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">
                      Last sync: {new Date(integrationStatus.usage[`last${integration.id}ETL`]).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrationStatus.usage && Object.keys(integrationStatus.usage).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Last synchronization times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(integrationStatus.usage).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-gray-600">{key.replace('last', '').replace('ETL', '')}</p>
                  <p className="text-sm font-medium">
                    {value ? new Date(value).toLocaleString() : 'Never'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
