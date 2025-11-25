'use client';

import { useEffect, useState } from 'react';

interface GrowthData {
  referral: {
    conversion_rate: number;
    viral_coefficient: number;
    total_referrals: number;
    total_signups_from_referrals: number;
  };
  share: {
    share_rate: number;
    total_shares: number;
    signups_from_shares: number;
  };
  seo: {
    landing_pages: Array<{
      page: string;
      visitors: number;
      signups: number;
      conversion_rate: number;
    }>;
    total_organic_signups: number;
  };
  experiments: Array<{
    name: string;
    status: string;
    impact: string;
  }>;
}

export default function GrowthDashboard() {
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthMetrics();
    const interval = setInterval(fetchGrowthMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchGrowthMetrics() {
    try {
      const [referral, share, seo, experiments] = await Promise.all([
        fetch('/api/growth/referral-metrics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/growth/share-metrics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/growth/seo-metrics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/experiments/active').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      setGrowth({
        referral: referral || {
          conversion_rate: 0,
          viral_coefficient: 0,
          total_referrals: 0,
          total_signups_from_referrals: 0,
        },
        share: share || {
          share_rate: 0,
          total_shares: 0,
          signups_from_shares: 0,
        },
        seo: seo || {
          landing_pages: [],
          total_organic_signups: 0,
        },
        experiments: experiments?.experiments || [],
      });
    } catch (error) {
      console.error('Error fetching growth metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading Growth Metrics...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Growth Metrics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track all growth levers and their performance</p>
        </div>

        {/* Growth Levers Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GrowthCard
            label="Referral Conversion Rate"
            value={`${growth?.referral?.conversion_rate?.toFixed(1) || 0}%`}
            subtitle={`${growth?.referral?.total_signups_from_referrals || 0} signups from referrals`}
          />
          <GrowthCard
            label="Viral Coefficient"
            value={growth?.referral?.viral_coefficient?.toFixed(2) || '0.00'}
            subtitle="Target: >1.2"
          />
          <GrowthCard
            label="Share Rate"
            value={`${growth?.share?.share_rate?.toFixed(1) || 0}%`}
            subtitle={`${growth?.share?.total_shares || 0} total shares`}
          />
        </div>

        {/* Referral Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Referral System</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricBox
              label="Total Referrals Sent"
              value={growth?.referral?.total_referrals || 0}
            />
            <MetricBox
              label="Signups from Referrals"
              value={growth?.referral?.total_signups_from_referrals || 0}
            />
            <MetricBox
              label="Conversion Rate"
              value={`${growth?.referral?.conversion_rate?.toFixed(1) || 0}%`}
            />
            <MetricBox
              label="Viral Coefficient"
              value={growth?.referral?.viral_coefficient?.toFixed(2) || '0.00'}
            />
          </div>
        </div>

        {/* Share Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Share Functionality</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricBox
              label="Total Shares"
              value={growth?.share?.total_shares || 0}
            />
            <MetricBox
              label="Signups from Shares"
              value={growth?.share?.signups_from_shares || 0}
            />
            <MetricBox
              label="Share Rate"
              value={`${growth?.share?.share_rate?.toFixed(1) || 0}%`}
            />
          </div>
        </div>

        {/* SEO Landing Pages */}
        {growth?.seo?.landing_pages && growth.seo.landing_pages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">SEO Landing Pages</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Page</th>
                    <th className="text-right py-2 px-4 font-semibold">Visitors</th>
                    <th className="text-right py-2 px-4 font-semibold">Signups</th>
                    <th className="text-right py-2 px-4 font-semibold">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {growth.seo.landing_pages.map((page, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-4">{page.page}</td>
                      <td className="text-right py-2 px-4">{page.visitors}</td>
                      <td className="text-right py-2 px-4">{page.signups}</td>
                      <td className="text-right py-2 px-4">
                        <div className="flex items-center justify-end">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${page.conversion_rate}%` }}
                            />
                          </div>
                          <span className="text-sm">{page.conversion_rate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Total Organic Signups: <span className="font-semibold">{growth.seo.total_organic_signups}</span>
            </div>
          </div>
        )}

        {/* Active Experiments */}
        {growth?.experiments && growth.experiments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Active Growth Experiments</h2>
            <div className="space-y-3">
              {growth.experiments.map((exp, idx) => (
                <div key={idx} className="border-b pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{exp.name}</div>
                      <div className="text-sm text-gray-600">{exp.status}</div>
                    </div>
                    <div className="text-sm text-gray-500">{exp.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GrowthCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
