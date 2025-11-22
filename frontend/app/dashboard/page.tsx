'use client';

import { useEffect, useState } from 'react';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';
import { FileTracker } from '@/components/file-tracking/FileTracker';
import { ActivationFunnelDashboard } from '@/components/analytics/ActivationFunnelDashboard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { analytics } from '@/lib/analytics/analytics';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Track dashboard view
    analytics.pageView('/dashboard');
    
    // Track first insight view when insights are loaded
    const checkInsights = async () => {
      try {
        const response = await fetch('/api/insights?days_back=30', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.insights && data.insights.length > 0) {
            analytics.trackActivationEvent('first_insight_view', {
              insight_count: data.count,
            });
          }
        }
      } catch (err) {
        // Silently fail - insights are optional
      } finally {
        setLoading(false);
      }
    };

    checkInsights();
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        error={error}
        retry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Your workflow insights and patterns
        </p>
      </div>

      {/* File Tracker */}
      <FileTracker />

      {/* Insights Dashboard */}
      <InsightsDashboard />

      {/* Activation Funnel (Admin/Internal) */}
      {process.env.NEXT_PUBLIC_SHOW_ADMIN_DASHBOARD === 'true' && (
        <ActivationFunnelDashboard />
      )}
    </div>
  );
}
