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

interface AnalyticsData {
  period_days: number;
  activation: {
    total_signups: number;
    activated_users: number;
    activation_rate: number;
    avg_time_to_activation_days: number | null;
  };
  retention: {
    d1: { cohort_size: number; retained: number; retention_rate: number };
    d7: { cohort_size: number; retained: number; retention_rate: number };
    d30: { cohort_size: number; retained: number; retention_rate: number };
  };
  conversion_funnel: {
    funnel: {
      signups: number;
      activated: number;
      engaged: number;
      subscribed: number;
    };
    conversion_rates: {
      signup_to_activation: number;
      activation_to_engagement: number;
      engagement_to_subscription: number;
      signup_to_subscription: number;
    };
  };
  revenue: {
    mrr: number;
    arr: number;
    total_subscriptions: number;
    subscriptions_by_tier: Record<string, number>;
  };
  engagement: {
    active_users: number;
    total_users: number;
    dau_mau_ratio: number;
    avg_workflows_per_user: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/dashboard?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const analyticsData = await res.json();
      setData(analyticsData);
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
        <div className="animate-pulse">Loading analytics...</div>
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
        <div>No analytics data available</div>
      </div>
    );
  }

  // Prepare chart data
  const retentionData = [
    { name: 'D1', rate: data.retention.d1.retention_rate },
    { name: 'D7', rate: data.retention.d7.retention_rate },
    { name: 'D30', rate: data.retention.d30.retention_rate },
  ];

  const funnelData = [
    { name: 'Signups', value: data.conversion_funnel.funnel.signups },
    { name: 'Activated', value: data.conversion_funnel.funnel.activated },
    { name: 'Engaged', value: data.conversion_funnel.funnel.engaged },
    { name: 'Subscribed', value: data.conversion_funnel.funnel.subscribed },
  ];

  const revenueByTier = Object.entries(data.revenue.subscriptions_by_tier).map(
    ([tier, count]) => ({ name: tier, value: count })
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Activation Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Activation Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Signups</div>
            <div className="text-2xl font-bold">{data.activation.total_signups}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Activated Users</div>
            <div className="text-2xl font-bold">{data.activation.activated_users}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Activation Rate</div>
            <div className="text-2xl font-bold">{data.activation.activation_rate}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Avg Time to Activation</div>
            <div className="text-2xl font-bold">
              {data.activation.avg_time_to_activation_days
                ? `${data.activation.avg_time_to_activation_days.toFixed(1)} days`
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Retention Cohorts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Retention Cohorts</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rate" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Signup → Activation</div>
            <div className="font-semibold">
              {data.conversion_funnel.conversion_rates.signup_to_activation}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">Activation → Engagement</div>
            <div className="font-semibold">
              {data.conversion_funnel.conversion_rates.activation_to_engagement}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">Engagement → Subscription</div>
            <div className="font-semibold">
              {data.conversion_funnel.conversion_rates.engagement_to_subscription}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">Overall Conversion</div>
            <div className="font-semibold">
              {data.conversion_funnel.conversion_rates.signup_to_subscription}%
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Revenue Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">MRR</div>
                <div className="text-2xl font-bold">${data.revenue.mrr.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ARR</div>
                <div className="text-2xl font-bold">${data.revenue.arr.toFixed(2)}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Subscriptions</div>
              <div className="text-xl font-semibold">{data.revenue.total_subscriptions}</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Subscriptions by Tier</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={revenueByTier}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByTier.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Engagement Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-2xl font-bold">{data.engagement.active_users}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="text-2xl font-bold">{data.engagement.total_users}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">DAU/MAU Ratio</div>
            <div className="text-2xl font-bold">{data.engagement.dau_mau_ratio}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Avg Workflows/User</div>
            <div className="text-2xl font-bold">
              {data.engagement.avg_workflows_per_user.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
