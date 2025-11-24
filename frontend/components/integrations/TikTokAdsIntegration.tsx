'use client';

import { useState, useEffect } from 'react';
import { Video, CheckCircle, XCircle, ExternalLink, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNotificationStore } from '@/lib/store';

interface TikTokAccount {
  id: string;
  name: string;
  status: string;
}

export function TikTokAdsIntegration() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [error, setError] = useState('');
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/tiktok/status');
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected || false);
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to check TikTok connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectTikTok = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/integrations/tiktok/connect', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        } else {
          setConnected(true);
          await checkConnection();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to connect to TikTok Ads');
      }
    } catch (err) {
      setError('Failed to connect to TikTok Ads');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !connected) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-pink-600" />
            <div>
              <CardTitle>TikTok Ads Integration</CardTitle>
              <CardDescription>Connect TikTok Ads to track campaign performance</CardDescription>
            </div>
          </div>
          <div className={`flex items-center gap-2 ${connected ? 'text-green-600' : 'text-gray-400'}`}>
            {connected ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <span className="text-sm font-medium">{connected ? 'Connected' : 'Not Connected'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {connected ? (
          <div className="space-y-4">
            {accounts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Connected Accounts</h4>
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {account.id}</div>
                      </div>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Insights
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-4">
              Connect TikTok Ads to track campaign performance, ad spend, and conversions.
            </p>
            <Button onClick={connectTikTok} disabled={loading} className="w-full">
              <Video className="w-4 h-4 mr-2" />
              {loading ? 'Connecting...' : 'Connect TikTok Ads'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
