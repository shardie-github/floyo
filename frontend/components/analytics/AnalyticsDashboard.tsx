/**
 * Analytics Dashboard Component
 * 
 * Comprehensive analytics dashboard with metrics, charts, and insights.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartLine, ChartBar, ChartArea, ChartPie } from '@/components/ui/chart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AnalyticsData {
  overview: {
    total_events: number;
    total_patterns: number;
    active_integrations: number;
    workflows_executed: number;
  };
  trends: Array<{
    date: string;
    events: number;
    patterns: number;
  }>;
  top_patterns: Array<{
    file_extension: string;
    count: number;
    percentage: number;
  }>;
  integration_usage: Array<{
    integration: string;
    usage_count: number;
    success_rate: number;
  }>;
  workflow_performance: Array<{
    workflow_id: string;
    workflow_name: string;
    executions: number;
    success_rate: number;
    avg_duration: number;
  }>;
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard?time_range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const trendChartConfig = useMemo(() => ({
    events: { label: 'Events', color: '#3b82f6' },
    patterns: { label: 'Patterns', color: '#10b981' },
  }), []);

  const patternChartConfig = useMemo(() => ({
    count: { label: 'Usage Count', color: '#8b5cf6' },
  }), []);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Failed to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your usage patterns and performance</p>
        </div>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.total_events.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Patterns Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.total_patterns.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.active_integrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Workflows Executed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.workflows_executed.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Events and patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLine
                data={data.trends}
                dataKey="date"
                config={trendChartConfig}
                title="Usage Trends"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top File Patterns</CardTitle>
                <CardDescription>Most used file extensions</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartBar
                  data={data.top_patterns}
                  dataKey="file_extension"
                  config={patternChartConfig}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pattern Distribution</CardTitle>
                <CardDescription>Usage by file type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartPie
                  data={data.top_patterns.map((p) => ({
                    name: p.file_extension,
                    value: p.count,
                  }))}
                  config={patternChartConfig}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Usage</CardTitle>
              <CardDescription>Usage and success rates by integration</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.integration_usage.map((integration) => (
                    <TableRow key={integration.integration}>
                      <TableCell className="font-medium">{integration.integration}</TableCell>
                      <TableCell>{integration.usage_count.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={integration.success_rate >= 95 ? 'default' : 'secondary'}>
                          {(integration.success_rate * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>Execution metrics and success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Executions</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Avg Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.workflow_performance.map((workflow) => (
                    <TableRow key={workflow.workflow_id}>
                      <TableCell className="font-medium">{workflow.workflow_name}</TableCell>
                      <TableCell>{workflow.executions.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={workflow.success_rate >= 95 ? 'default' : 'secondary'}>
                          {(workflow.success_rate * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{workflow.avg_duration.toFixed(2)}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
