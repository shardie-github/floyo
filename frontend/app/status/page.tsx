// [STAKE+TRUST:BEGIN:status_page]
"use client";

import { useEffect, useState } from 'react';

interface ComponentStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  lastIncident?: string;
}

export default function Status() {
  const [components, setComponents] = useState<ComponentStatus[]>([
    { name: 'API', status: 'operational' },
    { name: 'Database', status: 'operational' },
    { name: 'Frontend', status: 'operational' },
    { name: 'Authentication', status: 'operational' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In real implementation, fetch from status API
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'down':
        return 'Service Outage';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          System Status
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time status of our services
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${getStatusColor('operational')}`}></div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {getStatusText('operational')}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All systems nominal. No incidents reported.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Component Status
        </h2>
        <div className="space-y-3">
          {components.map((component) => (
            <div
              key={component.name}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(component.status)}`}></div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {component.name}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {component.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Subscribe to Updates
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Get notified when incidents occur or are resolved.
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Subscribe via Email
        </button>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:status_page]
