'use client';

/**
 * Wiring Dashboard
 * 
 * Admin console showing connectivity matrix and status
 */

import { useEffect, useState } from 'react';

interface CheckResult {
  system: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'DEGRADED' | 'SKIP';
  latency?: number;
  evidence?: string[];
  error?: string;
  fixPR?: string;
  nextAction?: string;
}

interface ConnectivityMatrix {
  timestamp: string;
  version: string;
  checks: CheckResult[];
  summary: {
    total: number;
    pass: number;
    fail: number;
    degraded: number;
    skip: number;
  };
}

export default function WiringDashboard() {
  const [matrix, setMatrix] = useState<ConnectivityMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch connectivity status from API route
    fetch('/api/wiring-status')
      .then((res) => res.json())
      .then((data) => {
        setMatrix(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Wiring Status Dashboard</h1>
          <div className="text-center py-12">Loading connectivity data...</div>
        </div>
      </div>
    );
  }

  if (error || !matrix) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Wiring Status Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              {error || 'Failed to load connectivity data'}
            </p>
            <p className="text-sm text-red-600 mt-2">
              Run <code className="bg-red-100 px-2 py-1 rounded">pnpm wiring:run</code> to generate reports
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return '?';
      case 'FAIL':
        return '?';
      case 'DEGRADED':
        return '??';
      case 'SKIP':
        return '??';
      default:
        return '?';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
        return 'bg-red-100 text-red-800';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800';
      case 'SKIP':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const checksBySystem = matrix.checks.reduce((acc, check) => {
    if (!acc[check.system]) {
      acc[check.system] = [];
    }
    acc[check.system].push(check);
    return acc;
  }, {} as Record<string, CheckResult[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wiring Status Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {new Date(matrix.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Checks</div>
            <div className="text-3xl font-bold">{matrix.summary.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">? Pass</div>
            <div className="text-3xl font-bold text-green-600">{matrix.summary.pass}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">? Fail</div>
            <div className="text-3xl font-bold text-red-600">{matrix.summary.fail}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">?? Degraded</div>
            <div className="text-3xl font-bold text-yellow-600">{matrix.summary.degraded}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">?? Skip</div>
            <div className="text-3xl font-bold text-gray-600">{matrix.summary.skip}</div>
          </div>
        </div>

        {/* Connectivity Matrix by System */}
        <div className="space-y-6">
          {Object.entries(checksBySystem).map(([system, checks]) => (
            <div key={system} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold">{system}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Check
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Latency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Evidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Next Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {checks.map((check, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{check.check}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              check.status
                            )}`}
                          >
                            {getStatusIcon(check.status)} {check.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {check.latency ? `${check.latency}ms` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {check.evidence ? (
                            <div className="max-w-md">
                              {check.evidence.map((e, i) => (
                                <div key={i} className="truncate">{e}</div>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {check.nextAction || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Failures Section */}
        {matrix.summary.fail > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">
              Failures Requiring Attention
            </h2>
            <ul className="space-y-2">
              {matrix.checks
                .filter((c) => c.status === 'FAIL')
                .map((check, idx) => (
                  <li key={idx} className="text-red-700">
                    <strong>{check.system}: {check.check}</strong> - {check.error || 'Unknown error'}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
