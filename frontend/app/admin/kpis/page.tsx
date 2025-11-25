'use client';

import { useEffect, useState } from 'react';

interface KPIData {
  dau_wau_mau: {
    dau: number;
    wau: number;
    mau: number;
    date: string;
  };
  activation: {
    activation_rate: number;
    total_signups: number;
    activated_users: number;
  };
  retention: {
    d7: Array<{
      cohort: string;
      size: number;
      retained: number;
      rate: number;
    }>;
  };
  revenue: {
    mrr: number;
    arr: number;
    arpu: number;
  };
  experiments: Array<{
    name: string;
    status: string;
    results: string;
  }>;
}

export default function KPIDashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchKPIs();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchKPIs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchKPIs() {
    try {
      const [dauWauMau, activation, retention, revenue, experiments] = await Promise.all([
        fetch('/api/analytics/dau-wau-mau').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/analytics/activation-metrics?days=7').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/analytics/retention-cohorts').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/analytics/revenue-metrics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/experiments/active').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      setKpis({
        dau_wau_mau: dauWauMau,
        activation: activation,
        retention: retention,
        revenue: revenue,
        experiments: experiments?.experiments || [],
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading KPIs...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly KPI Dashboard</h1>
            <p className="text-gray-600 mt-2">Key performance indicators for mentor review</p>
          </div>
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KPICard
            label="DAU"
            value={kpis?.dau_wau_mau?.dau || 0}
            subtitle="Daily Active Users"
            trend={null}
          />
          <KPICard
            label="WAU"
            value={kpis?.dau_wau_mau?.wau || 0}
            subtitle="Weekly Active Users"
            trend={null}
          />
          <KPICard
            label="MAU"
            value={kpis?.dau_wau_mau?.mau || 0}
            subtitle="Monthly Active Users"
            trend={null}
          />
          <KPICard
            label="Activation Rate"
            value={`${kpis?.activation?.activation_rate?.toFixed(1) || 0}%`}
            subtitle="% of signups who activate"
            trend={null}
          />
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Activation Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Activation Metrics (Last 7 Days)</h2>
            <div className="space-y-4">
              <MetricRow
                label="Total Signups"
                value={kpis?.activation?.total_signups || 0}
              />
              <MetricRow
                label="Activated Users"
                value={kpis?.activation?.activated_users || 0}
              />
              <MetricRow
                label="Activation Rate"
                value={`${kpis?.activation?.activation_rate?.toFixed(1) || 0}%`}
              />
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Revenue Metrics</h2>
            <div className="space-y-4">
              <MetricRow
                label="MRR"
                value={`$${kpis?.revenue?.mrr?.toLocaleString() || 0}`}
              />
              <MetricRow
                label="ARR"
                value={`$${kpis?.revenue?.arr?.toLocaleString() || 0}`}
              />
              <MetricRow
                label="ARPU"
                value={`$${kpis?.revenue?.arpu?.toFixed(2) || 0}`}
              />
            </div>
          </div>
        </div>

        {/* Retention Cohorts */}
        {kpis?.retention?.retention && kpis.retention.retention.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Retention Cohorts</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Cohort</th>
                    <th className="text-right py-2 px-4 font-semibold">Size</th>
                    <th className="text-right py-2 px-4 font-semibold">Retained</th>
                    <th className="text-right py-2 px-4 font-semibold">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.retention.retention.map((cohort, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-4">{cohort.cohort}</td>
                      <td className="text-right py-2 px-4">{cohort.size}</td>
                      <td className="text-right py-2 px-4">{cohort.retained}</td>
                      <td className="text-right py-2 px-4">
                        <div className="flex items-center justify-end">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${cohort.rate}%` }}
                            />
                          </div>
                          <span className="text-sm">{cohort.rate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Active Experiments */}
        {kpis?.experiments && kpis.experiments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Active Experiments</h2>
            <div className="space-y-3">
              {kpis.experiments.map((exp, idx) => (
                <div key={idx} className="border-b pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{exp.name}</div>
                      <div className="text-sm text-gray-600">{exp.status}</div>
                    </div>
                    <div className="text-sm text-gray-500">{exp.results}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8">
          <button
            onClick={fetchKPIs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh KPIs
          </button>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  subtitle,
  trend,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  trend: number | null;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {trend !== null && (
        <div className={`text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
