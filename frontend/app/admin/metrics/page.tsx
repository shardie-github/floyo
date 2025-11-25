'use client';

import { useEffect, useState } from 'react';
import MetricsChart from '@/components/MetricsChart';

interface MetricsData {
  dau_wau_mau?: {
    dau: number;
    wau: number;
    mau: number;
  };
  revenue?: {
    mrr: number;
    arr: number;
    arpu: number;
    total_paid_users: number;
  };
  engagement?: {
    events_per_user: number;
    integrations_per_user: number;
    active_users: number;
  };
  activation?: {
    total_signups: number;
    activated_users: number;
    activation_rate: number;
  };
  unit_economics?: {
    cac: number;
    ltv: number;
    ltv_cac_ratio: number;
    payback_period_months: number;
  };
  acquisition_channels?: {
    channels: Array<{
      source: string;
      medium: string;
      signups: number;
      percentage: number;
    }>;
    total_signups: number;
  };
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Fetch all metrics in parallel
        const [dauWauMau, revenue, engagement, activation, unitEconomics, channels] = await Promise.all([
          fetch('/api/analytics/dau-wau-mau').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/analytics/revenue-metrics').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/analytics/engagement-metrics?days=30').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/analytics/activation-metrics?days=30').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/analytics/unit-economics').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/analytics/acquisition-channels?days=30').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        setMetrics({
          dau_wau_mau: dauWauMau,
          revenue,
          engagement,
          activation,
          unit_economics: unitEconomics,
          acquisition_channels: channels,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading Metrics...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">YC Metrics Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time metrics for YC interview prep</p>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={metrics.activation?.total_signups || 0}
            subtitle="Signups"
          />
          <StatCard
            label="Paid Users"
            value={metrics.revenue?.total_paid_users || 0}
            subtitle="Active subscriptions"
          />
          <StatCard
            label="MRR"
            value={`$${metrics.revenue?.mrr?.toLocaleString() || 0}`}
            subtitle="Monthly recurring revenue"
          />
          <StatCard
            label="ARR"
            value={`$${metrics.revenue?.arr?.toLocaleString() || 0}`}
            subtitle="Annual recurring revenue"
          />
        </div>

        {/* DAU/WAU/MAU */}
        {metrics.dau_wau_mau && (
          <MetricSection title="Usage Metrics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                label="DAU"
                value={metrics.dau_wau_mau.dau}
                subtitle="Daily active users"
              />
              <StatCard
                label="WAU"
                value={metrics.dau_wau_mau.wau}
                subtitle="Weekly active users"
              />
              <StatCard
                label="MAU"
                value={metrics.dau_wau_mau.mau}
                subtitle="Monthly active users"
              />
            </div>
            {/* Trend chart placeholder - would need historical data */}
          </MetricSection>
        )}

        {/* Activation */}
        {metrics.activation && (
          <MetricSection title="Activation Metrics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Total Signups"
                value={metrics.activation.total_signups}
                subtitle="Last 30 days"
              />
              <StatCard
                label="Activated Users"
                value={metrics.activation.activated_users}
                subtitle="Viewed first suggestion"
              />
              <StatCard
                label="Activation Rate"
                value={`${metrics.activation.activation_rate?.toFixed(1) || 0}%`}
                subtitle="% of signups who activate"
              />
            </div>
          </MetricSection>
        )}

        {/* Revenue */}
        {metrics.revenue && (
          <MetricSection title="Revenue Metrics">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="MRR"
                value={`$${metrics.revenue.mrr?.toLocaleString() || 0}`}
                subtitle="Monthly recurring revenue"
              />
              <StatCard
                label="ARR"
                value={`$${metrics.revenue.arr?.toLocaleString() || 0}`}
                subtitle="Annual recurring revenue"
              />
              <StatCard
                label="ARPU"
                value={`$${metrics.revenue.arpu?.toFixed(2) || 0}`}
                subtitle="Average revenue per user"
              />
              <StatCard
                label="Paid Users"
                value={metrics.revenue.total_paid_users}
                subtitle="Active subscriptions"
              />
            </div>
          </MetricSection>
        )}

        {/* Unit Economics */}
        {metrics.unit_economics && (
          <MetricSection title="Unit Economics">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="CAC"
                value={`$${metrics.unit_economics.cac?.toFixed(2) || 0}`}
                subtitle="Customer acquisition cost"
              />
              <StatCard
                label="LTV"
                value={`$${metrics.unit_economics.ltv?.toFixed(2) || 0}`}
                subtitle="Lifetime value"
              />
              <StatCard
                label="LTV:CAC"
                value={`${metrics.unit_economics.ltv_cac_ratio?.toFixed(1) || 0}:1`}
                subtitle="Target: >3:1"
              />
              <StatCard
                label="Payback Period"
                value={`${metrics.unit_economics.payback_period_months?.toFixed(1) || 0} mo`}
                subtitle="Months to recover CAC"
              />
            </div>
          </MetricSection>
        )}

        {/* Engagement */}
        {metrics.engagement && (
          <MetricSection title="Engagement Metrics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Events per User"
                value={metrics.engagement.events_per_user?.toFixed(1) || 0}
                subtitle="Average per day"
              />
              <StatCard
                label="Integrations per User"
                value={metrics.engagement.integrations_per_user?.toFixed(1) || 0}
                subtitle="Average per user"
              />
              <StatCard
                label="Active Users"
                value={metrics.engagement.active_users}
                subtitle="Last 30 days"
              />
            </div>
          </MetricSection>
        )}

        {/* Acquisition Channels */}
        {metrics.acquisition_channels && metrics.acquisition_channels.channels.length > 0 && (
          <MetricSection title="Acquisition Channels">
            <div className="bg-white rounded-lg shadow p-6">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Source</th>
                    <th className="text-left py-2 px-4 font-semibold">Medium</th>
                    <th className="text-right py-2 px-4 font-semibold">Signups</th>
                    <th className="text-right py-2 px-4 font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.acquisition_channels.channels.map((channel, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-4">{channel.source || 'direct'}</td>
                      <td className="py-2 px-4">{channel.medium || 'none'}</td>
                      <td className="text-right py-2 px-4">{channel.signups}</td>
                      <td className="text-right py-2 px-4">
                        <div className="flex items-center justify-end">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${channel.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm">{channel.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MetricSection>
        )}

        {/* Export Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              const data = JSON.stringify(metrics, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `floyo-metrics-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export JSON
          </button>
          <button
            onClick={() => {
              // Create CSV export
              const rows = [
                ['Metric', 'Value'],
                ['Total Users', metrics.activation?.total_signups || 0],
                ['Paid Users', metrics.revenue?.total_paid_users || 0],
                ['MRR', `$${metrics.revenue?.mrr || 0}`],
                ['ARR', `$${metrics.revenue?.arr || 0}`],
                ['DAU', metrics.dau_wau_mau?.dau || 0],
                ['WAU', metrics.dau_wau_mau?.wau || 0],
                ['MAU', metrics.dau_wau_mau?.mau || 0],
                ['Activation Rate', `${metrics.activation?.activation_rate || 0}%`],
                ['CAC', `$${metrics.unit_economics?.cac || 0}`],
                ['LTV', `$${metrics.unit_economics?.ltv || 0}`],
                ['LTV:CAC', `${metrics.unit_economics?.ltv_cac_ratio || 0}:1`],
              ];
              const csv = rows.map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `floyo-metrics-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

function MetricSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
