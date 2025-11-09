"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface OperationalMetrics {
  timestamp: string;
  active_users: {
    last_hour: number;
    last_24h: number;
  };
  events: {
    last_hour: number;
    per_minute: number;
  };
  workflows: {
    created_last_24h: number;
  };
  subscriptions: {
    created_last_24h: number;
  };
  revenue: {
    last_24h: number;
  };
}

interface AlignmentScore {
  overall_score: number;
  components: Record<string, {
    current: number;
    target: number;
    score: number;
    weight: number;
  }>;
}

export default function OperationalDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [alignment, setAlignment] = useState<AlignmentScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_superuser) return;

    const fetchData = async () => {
      try {
        const [metricsRes, alignmentRes] = await Promise.all([
          fetch("/api/operational/real-time-metrics"),
          fetch("/api/operational/alignment-score?days=30"),
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        if (alignmentRes.ok) {
          const alignmentData = await alignmentRes.json();
          setAlignment(alignmentData);
        }
      } catch (error) {
        console.error("Error fetching operational data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [user]);

  if (!user?.is_superuser) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Admin access required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading operational dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Operational Dashboard</h1>

      {/* Alignment Score */}
      {alignment && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Alignment Score</h2>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold">
              {alignment.overall_score.toFixed(1)}
            </div>
            <div className="text-gray-600">/ 100</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${alignment.overall_score}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">Active Users (24h)</h3>
            <p className="text-2xl font-bold">{metrics.active_users.last_24h}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">Events (1h)</h3>
            <p className="text-2xl font-bold">{metrics.events.last_hour}</p>
            <p className="text-sm text-gray-500">
              {metrics.events.per_minute.toFixed(1)} per minute
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">Workflows Created (24h)</h3>
            <p className="text-2xl font-bold">{metrics.workflows.created_last_24h}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">Subscriptions (24h)</h3>
            <p className="text-2xl font-bold">{metrics.subscriptions.created_last_24h}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-600">Revenue (24h)</h3>
            <p className="text-2xl font-bold">${metrics.revenue.last_24h.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* KPI Components */}
      {alignment && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">KPI Components</h2>
          <div className="space-y-2">
            {Object.entries(alignment.components).map(([kpi, data]) => (
              <div key={kpi} className="flex items-center justify-between p-2 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">
                      {kpi.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm text-gray-600">
                      {data.current.toFixed(1)} / {data.target.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.score >= 80
                          ? "bg-green-500"
                          : data.score >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
