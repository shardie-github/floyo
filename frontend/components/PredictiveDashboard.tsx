'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, AlertTriangle, Lightbulb, Clock } from 'lucide-react';

interface Prediction {
  id: string;
  type: 'usage' | 'performance' | 'trend' | 'anomaly';
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  recommendations?: string[];
}

export function PredictiveDashboard() {
  const { data, isLoading } = useQuery<{ predictions: Prediction[] }>({
    queryKey: ['predictive-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/ai/predictions');
      return res.json();
    },
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const predictions = data?.predictions || [];

  if (predictions.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'usage':
        return <TrendingUp className="w-5 h-5" />;
      case 'performance':
        return <AlertTriangle className="w-5 h-5" />;
      case 'trend':
        return <Lightbulb className="w-5 h-5" />;
      case 'anomaly':
        return <Clock className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Predictive Analytics
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({predictions.length})
        </span>
      </div>

      <div className="space-y-4">
        {predictions.map((pred) => (
          <div
            key={pred.id}
            className={`border-l-4 rounded p-4 ${getImpactColor(pred.impact)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-primary-600 dark:text-primary-400">
                {getIcon(pred.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {pred.title}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-white/50 dark:bg-gray-800/50 rounded">
                    {pred.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {pred.prediction}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Confidence: {Math.round(pred.confidence * 100)}%</span>
                  <span>•</span>
                  <span>{pred.timeframe}</span>
                </div>
                {pred.recommendations && pred.recommendations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Recommendations:
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {pred.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
