'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNotificationStore } from '@/lib/store';

interface MarketplaceIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_url?: string;
  rating: number;
  review_count: number;
  install_count: number;
  pricing: string;
  tags: string[];
}

export default function MarketplacePage() {
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState('popular');
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    loadIntegrations();
  }, [category, sort]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (search) params.append('search', search);
      params.append('sort', sort);

      const response = await fetch(`/api/marketplace/integrations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_id: integrationId,
          name: integrations.find(i => i.id === integrationId)?.name,
        }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          message: 'Integration installed successfully',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to install integration',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Integration Marketplace</h1>
        <p className="text-muted-foreground">Discover and install integrations to extend Floyo</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadIntegrations()}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="automation">Automation</SelectItem>
            <SelectItem value="advertising">Advertising</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No integrations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {integration.icon_url && (
                      <img
                        src={integration.icon_url}
                        alt={integration.name}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div>
                      <CardTitle>{integration.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{integration.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{integration.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({integration.review_count} reviews)
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {integration.pricing}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {integration.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {integration.install_count.toLocaleString()} installs
                  </span>
                  <Button onClick={() => handleInstall(integration.id)} size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
