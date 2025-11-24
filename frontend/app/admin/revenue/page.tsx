'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RevenueDashboard() {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['revenue'],
    queryFn: async () => {
      const res = await fetch('/api/admin/revenue');
      if (!res.ok) throw new Error('Failed to fetch revenue');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <div>Loading revenue data...</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Revenue Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${revenue?.mrr?.toLocaleString() || '0'}
            </div>
            {revenue?.mrrChange && (
              <div className={`text-sm ${revenue.mrrChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenue.mrrChange >= 0 ? '+' : ''}{revenue.mrrChange}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Annual Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${revenue?.arr?.toLocaleString() || '0'}
            </div>
            {revenue?.arrChange && (
              <div className={`text-sm ${revenue.arrChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenue.arrChange >= 0 ? '+' : ''}{revenue.arrChange}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {revenue?.totalCustomers || 0}
            </div>
            {revenue?.customerChange && (
              <div className={`text-sm ${revenue.customerChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenue.customerChange >= 0 ? '+' : ''}{revenue.customerChange}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {revenue?.churnRate || 0}%
            </div>
            {revenue?.churnChange && (
              <div className={`text-sm ${revenue.churnChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenue.churnChange >= 0 ? '+' : ''}{revenue.churnChange}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      {revenue?.planDistribution && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Free</div>
                <div className="text-2xl font-bold">{revenue.planDistribution.free || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pro</div>
                <div className="text-2xl font-bold">{revenue.planDistribution.pro || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Enterprise</div>
                <div className="text-2xl font-bold">{revenue.planDistribution.enterprise || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Revenue chart coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
