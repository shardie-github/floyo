'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FunnelData {
  [key: string]: {
    user_count: number;
    event_count: number;
  };
}

interface ActivationFunnelData {
  funnel: FunnelData;
  conversion_rates: {
    onboarding?: number;
    first_event?: number;
    first_insight?: number;
    activation?: number;
  };
  period_days: number;
  signups: number;
  activated: number;
  activation_rate: number;
}

export function ActivationFunnelDashboard() {
  const [data, setData] = useState<ActivationFunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchFunnelData();
  }, [days]);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/analytics/activation-funnel?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activation funnel data');
      }
      const funnelData = await response.json();
      setData(funnelData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error fetching activation funnel:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activation Funnel</CardTitle>
          <CardDescription>User journey from signup to activation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activation Funnel</CardTitle>
          <CardDescription>User journey from signup to activation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const stages = [
    { key: 'signup', label: 'Signups', count: data.signups },
    { key: 'onboarding_completion', label: 'Onboarding Completed', count: data.funnel.onboarding_completion?.user_count || 0 },
    { key: 'first_event_tracked', label: 'First Event Tracked', count: data.funnel.first_event_tracked?.user_count || 0 },
    { key: 'first_insight_view', label: 'First Insight Viewed', count: data.funnel.first_insight_view?.user_count || 0 },
  ];

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activation Funnel</CardTitle>
            <CardDescription>
              User journey from signup to activation (Last {days} days)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1 text-sm rounded ${days === 7 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              7d
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1 text-sm rounded ${days === 30 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              30d
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-3 py-1 text-sm rounded ${days === 90 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              90d
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Activation Rate Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{data.signups}</div>
              <div className="text-sm text-muted-foreground">Signups</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{data.activated}</div>
              <div className="text-sm text-muted-foreground">Activated</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold">{data.activation_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Activation Rate</div>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const width = (stage.count / maxCount) * 100;
              const conversionRate = index > 0 && stages[0].count > 0
                ? ((stage.count / stages[0].count) * 100).toFixed(1)
                : '100.0';

              return (
                <div key={stage.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{stage.count} users</span>
                      {index > 0 && (
                        <span className="text-muted-foreground">
                          {conversionRate}% conversion
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${width}%` }}
                    >
                      {width > 20 && `${stage.count}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Rates */}
          {data.conversion_rates && Object.keys(data.conversion_rates).length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Conversion Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                {data.conversion_rates.onboarding !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">Onboarding</div>
                    <div className="text-lg font-semibold">
                      {data.conversion_rates.onboarding.toFixed(1)}%
                    </div>
                  </div>
                )}
                {data.conversion_rates.first_event !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">First Event</div>
                    <div className="text-lg font-semibold">
                      {data.conversion_rates.first_event.toFixed(1)}%
                    </div>
                  </div>
                )}
                {data.conversion_rates.first_insight !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">First Insight</div>
                    <div className="text-lg font-semibold">
                      {data.conversion_rates.first_insight.toFixed(1)}%
                    </div>
                  </div>
                )}
                {data.conversion_rates.activation !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">Activation</div>
                    <div className="text-lg font-semibold text-primary">
                      {data.conversion_rates.activation.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
