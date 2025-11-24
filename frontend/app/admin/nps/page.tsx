'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NPSDashboard() {
  const { data: nps, isLoading } = useQuery({
    queryKey: ['nps'],
    queryFn: async () => {
      const res = await fetch('/api/admin/nps');
      if (!res.ok) throw new Error('Failed to fetch NPS data');
      return res.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return <div>Loading NPS data...</div>;
  }

  const score = nps?.score;
  const scoreColor = score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">NPS Dashboard</h1>
      
      {/* Current NPS Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current NPS Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-6xl font-bold ${scoreColor}`}>
            {score !== null ? score.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Based on {nps?.count || 0} responses (last 30 days)
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-green-600">
              Promoters (9-10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nps?.promoters || 0}</div>
            <div className="text-sm text-muted-foreground">
              {nps?.count > 0 ? Math.round((nps.promoters / nps.count) * 100) : 0}% of responses
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-yellow-600">
              Passives (7-8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nps?.passives || 0}</div>
            <div className="text-sm text-muted-foreground">
              {nps?.count > 0 ? Math.round((nps.passives / nps.count) * 100) : 0}% of responses
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-red-600">
              Detractors (0-6)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nps?.detractors || 0}</div>
            <div className="text-sm text-muted-foreground">
              {nps?.count > 0 ? Math.round((nps.detractors / nps.count) * 100) : 0}% of responses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      {nps?.recentFeedback && nps.recentFeedback.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nps.recentFeedback.slice(0, 10).map((item: any, index: number) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.category === 'promoter' ? 'bg-green-100 text-green-800' :
                        item.category === 'passive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.category}
                      </span>
                      <span className="font-bold">{item.score}/10</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  {item.feedback && (
                    <p className="text-sm text-muted-foreground">{item.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart Placeholder */}
      {nps?.trend && nps.trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>NPS Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              NPS trend chart coming soon
              {/* TODO: Implement chart with nps.trend data */}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
