'use client';

import { useEffect, useState } from 'react';

interface SecurityData {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  policies: {
    https: boolean;
    rls: boolean;
    cors: boolean;
    mfa: boolean;
    csp: boolean;
    hsts: boolean;
  };
  active_sessions: number;
  failed_logins_24h: number;
  security_events_24h: number;
  last_audit: string;
}

export default function SecurityDashboard() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const res = await fetch('/api/monitoring/security');
      if (!res.ok) throw new Error('Failed to fetch security data');
      const securityData = await res.json();
      setData(securityData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading security dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div>No security data available</div>
      </div>
    );
  }

  const totalVulnerabilities =
    data.vulnerabilities.critical +
    data.vulnerabilities.high +
    data.vulnerabilities.medium +
    data.vulnerabilities.low;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <span className="text-sm text-gray-500">
          Last audit: {new Date(data.last_audit).toLocaleString()}
        </span>
      </div>

      {/* Vulnerability Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Vulnerability Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded">
            <div className="text-3xl font-bold text-red-600">
              {data.vulnerabilities.critical}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded">
            <div className="text-3xl font-bold text-orange-600">
              {data.vulnerabilities.high}
            </div>
            <div className="text-sm text-gray-600">High</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded">
            <div className="text-3xl font-bold text-yellow-600">
              {data.vulnerabilities.medium}
            </div>
            <div className="text-sm text-gray-600">Medium</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-3xl font-bold text-blue-600">
              {data.vulnerabilities.low}
            </div>
            <div className="text-sm text-gray-600">Low</div>
          </div>
        </div>
        {totalVulnerabilities > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-sm text-red-800">
              ⚠️ {totalVulnerabilities} vulnerabilities detected. Please review and remediate.
            </div>
          </div>
        )}
      </div>

      {/* Security Policies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Security Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">HTTPS Enforcement</span>
            <span>{data.policies.https ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">Row Level Security (RLS)</span>
            <span>{data.policies.rls ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">CORS Configured</span>
            <span>{data.policies.cors ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">MFA Enabled</span>
            <span>{data.policies.mfa ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">Content Security Policy</span>
            <span>{data.policies.csp ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">HSTS</span>
            <span>{data.policies.hsts ? '✅' : '❌'}</span>
          </div>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Security Metrics (24h)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Active Sessions</div>
            <div className="text-2xl font-bold">{data.active_sessions}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Failed Login Attempts</div>
            <div className="text-2xl font-bold text-red-600">
              {data.failed_logins_24h}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Security Events</div>
            <div className="text-2xl font-bold">{data.security_events_24h}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
