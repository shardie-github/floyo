/**
 * Admin Metrics Dashboard
 * Real-time visualization of system metrics
 */

'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [reliability, setReliability] = useState(null);
  const [cost, setCost] = useState(null);
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      // Load metrics from JSON files
      const [metricsRes, reliabilityRes, costRes, securityRes] = await Promise.all([
        fetch('/admin/metrics.json').catch(() => null),
        fetch('/admin/reliability.json').catch(() => null),
        fetch('/admin/cost.json').catch(() => null),
        fetch('/admin/compliance.json').catch(() => null),
      ]);

      if (metricsRes?.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      if (reliabilityRes?.ok) {
        const data = await reliabilityRes.json();
        setReliability(data);
      }

      if (costRes?.ok) {
        const data = await costRes.json();
        setCost(data);
      }

      if (securityRes?.ok) {
        const data = await securityRes.json();
        setSecurity(data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const latencyData = reliability
    ? [
        { name: 'P50', value: reliability.latency?.p50 || 0 },
        { name: 'P95', value: reliability.latency?.p95 || 0 },
        { name: 'P99', value: reliability.latency?.p99 || 0 },
      ]
    : [];

  const buildTimeData = reliability
    ? [
        {
          name: 'Frontend',
          time: reliability.buildTime?.frontend || 0,
        },
        {
          name: 'Backend',
          time: reliability.buildTime?.backend || 0,
        },
        {
          name: 'Total',
          time: reliability.buildTime?.total || 0,
        },
      ]
    : [];

  const costData = cost
    ? [
        { name: 'Vercel', value: cost.monthlySpend?.vercel || 0 },
        { name: 'Supabase', value: cost.monthlySpend?.supabase || 0 },
        { name: 'Expo', value: cost.monthlySpend?.expo || 0 },
      ]
    : [];

  const vulnerabilityData = security
    ? [
        { name: 'Critical', value: security.vulnerabilities?.critical || 0 },
        { name: 'High', value: security.vulnerabilities?.high || 0 },
        { name: 'Medium', value: security.vulnerabilities?.medium || 0 },
        { name: 'Low', value: security.vulnerabilities?.low || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          System Metrics Dashboard
        </h1>

        {/* Reliability Metrics */}
        {reliability && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Reliability & Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Latency Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={latencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Build Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={buildTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="time" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reliability.uptime?.toFixed(1) || 99.9}%
                </div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(reliability.errorRate * 100).toFixed(2) || 0}%
                </div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {reliability.regressions?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Regressions</div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Metrics */}
        {cost && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Cost & Efficiency</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Monthly Spend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={costData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ${cost.monthlySpend?.total?.toFixed(2) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Monthly Spend</div>
                </div>
                {cost.overrun && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-sm text-red-800">
                      ⚠️ Cost overrun detected: {cost.overrunPercent?.toFixed(2)}% above baseline
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Metrics */}
        {security && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Security & Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Vulnerabilities</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={vulnerabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-xl font-bold">
                      {security.vulnerabilities?.critical || 0}
                    </div>
                    <div className="text-xs text-gray-600">Critical</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-xl font-bold">
                      {security.vulnerabilities?.high || 0}
                    </div>
                    <div className="text-xs text-gray-600">High</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>HTTPS Enforcement</span>
                    <span>{security.policies?.https ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>RLS Policies</span>
                    <span>{security.policies?.rls ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>CORS Configured</span>
                    <span>{security.policies?.cors ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>MFA Enabled</span>
                    <span>{security.policies?.mfa ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 mt-8">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
