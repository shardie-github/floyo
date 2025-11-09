'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
// Using simple X icon instead of lucide-react

interface Insight {
  id: string;
  type: 'fomo' | 'achievement' | 'comparison' | 'efficiency' | 'security' | 'opportunity';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  cta?: {
    text: string;
    action: string;
  };
  expiresAt?: string;
  icon: string;
}

const urgencyColors = {
  high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
};

const typeIcons: Record<string, string> = {
  fomo: '⏰',
  achievement: '🎯',
  comparison: '📊',
  efficiency: '⚡',
  security: '🔒',
  opportunity: '💡',
};

export function InsightsPanel() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ['insights'],
    queryFn: async () => {
      const res = await fetch('/api/insights');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />;
  }

  const visibleInsights = insights?.filter(i => !dismissed.has(i.id)) || [];

  if (visibleInsights.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleInsights.slice(0, 3).map((insight) => {
        const isExpired = insight.expiresAt && new Date(insight.expiresAt) < new Date();
        if (isExpired) return null;

        return (
          <div
            key={insight.id}
            className={`relative p-4 rounded-lg border-2 ${urgencyColors[insight.urgency]} transition-all hover:shadow-lg`}
          >
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(insight.id))}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-3">
              <div className="text-2xl">{insight.icon || typeIcons[insight.type]}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {insight.message}
                </p>
                {insight.cta && (
                  <a
                    href={insight.cta.action}
                    className="inline-block px-3 py-1 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                  >
                    {insight.cta.text}
                  </a>
                )}
                {insight.expiresAt && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Expires {new Date(insight.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
