'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, Zap, Lightbulb } from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'integration' | 'workflow' | 'optimization' | 'insight';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  reasoning?: string;
}

export function AIRecommendations() {
  const { data, isLoading } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/ai/recommendations');
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const recommendations = data?.recommendations || [];

  if (recommendations.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'integration':
        return <Sparkles className="w-5 h-5" />;
      case 'workflow':
        return <Zap className="w-5 h-5" />;
      case 'optimization':
        return <TrendingUp className="w-5 h-5" />;
      case 'insight':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          AI Recommendations
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({recommendations.length})
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 5).map((rec) => (
          <div
            key={rec.id}
            className={`border-l-4 rounded p-4 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-primary-600 dark:text-primary-400">
                {getIcon(rec.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {rec.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {rec.description}
                </p>
                {rec.reasoning && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic mb-2">
                    💡 {rec.reasoning}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence: {Math.round(rec.confidence * 100)}%
                  </div>
                  {rec.actionUrl && (
                    <a
                      href={rec.actionUrl}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
