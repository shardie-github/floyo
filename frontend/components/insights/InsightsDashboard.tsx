'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analytics } from '@/lib/analytics/analytics';

interface Insight {
  type: string;
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}

interface Recommendation {
  insight_id: string;
  title: string;
  description: string;
  priority: string;
  action_type: string;
  metadata?: Record<string, unknown>;
}

interface InsightsData {
  insights: Insight[];
  recommendations: Recommendation[];
  count: number;
  generated_at: string;
}

export function InsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(30);

  useEffect(() => {
    fetchInsights();
  }, [daysBack]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/insights?days_back=${daysBack}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      
      const insightsData = await response.json();
      setData(insightsData);
      
      // Track first insight view
      if (insightsData.insights && insightsData.insights.length > 0) {
        analytics.trackActivationEvent('first_insight_view', {
          insight_count: insightsData.count,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered insights from your workflow patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered insights from your workflow patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.count === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered insights from your workflow patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No insights yet. Start tracking your file usage to generate insights!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Insights & Recommendations</CardTitle>
            <CardDescription>
              AI-powered insights from your workflow patterns (Last {daysBack} days)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDaysBack(7)}
              className={`px-3 py-1 text-sm rounded ${daysBack === 7 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              7d
            </button>
            <button
              onClick={() => setDaysBack(30)}
              className={`px-3 py-1 text-sm rounded ${daysBack === 30 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              30d
            </button>
            <button
              onClick={() => setDaysBack(90)}
              className={`px-3 py-1 text-sm rounded ${daysBack === 90 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              90d
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Insights */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Insights ({data.count})</h3>
            <div className="space-y-4">
              {data.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${priorityColors[insight.priority] || priorityColors.medium}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <p className="text-sm font-medium">{insight.recommendation}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${insight.priority === 'high' ? 'bg-red-100 text-red-800' : insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {insight.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Recommendations ({data.recommendations.length})
              </h3>
              <div className="space-y-3">
                {data.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                      <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">
                        {rec.action_type === 'create_template' && 'Create Template'}
                        {rec.action_type === 'consolidate_tools' && 'Learn More'}
                        {rec.action_type === 'schedule_task' && 'Schedule'}
                        {rec.action_type === 'create_workflow' && 'Create Workflow'}
                        {!['create_template', 'consolidate_tools', 'schedule_task', 'create_workflow'].includes(rec.action_type) && 'View'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated timestamp */}
          {data.generated_at && (
            <div className="text-xs text-muted-foreground pt-4 border-t">
              Generated: {new Date(data.generated_at).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
