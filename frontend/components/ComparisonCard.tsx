'use client';

import { useQuery } from '@tanstack/react-query';

interface ComparisonData {
  yourStats: {
    filesTracked: number;
    efficiency: number;
    productivity: number;
  };
  averageStats: {
    filesTracked: number;
    efficiency: number;
    productivity: number;
  };
  percentile: number;
  message: string;
}

export function ComparisonCard() {
  const { data: comparison, isLoading } = useQuery<ComparisonData>({
    queryKey: ['comparison'],
    queryFn: async () => {
      const res = await fetch('/api/insights/comparison');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded" />;
  }

  if (!comparison) return null;

  const isAboveAverage = comparison.percentile >= 50;
  const filesDiff = comparison.yourStats.filesTracked - comparison.averageStats.filesTracked;
  const efficiencyDiff = comparison.yourStats.efficiency - comparison.averageStats.efficiency;

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg shadow-lg p-6 border-2 border-primary-200 dark:border-primary-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          How You Compare
        </h2>
        <div className={`text-2xl font-bold ${isAboveAverage ? 'text-green-600' : 'text-gray-600'}`}>
          {comparison.percentile.toFixed(0)}%
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-6">{comparison.message}</p>

      <div className="space-y-4">
        {/* Files Tracked */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Files Tracked</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              You: {comparison.yourStats.filesTracked} • Avg: {comparison.averageStats.filesTracked.toFixed(0)}
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${Math.min((comparison.yourStats.filesTracked / Math.max(comparison.averageStats.filesTracked, 1)) * 100, 100)}%` }}
              />
            </div>
            {filesDiff !== 0 && (
              <span className={`text-xs font-semibold ${filesDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {filesDiff > 0 ? '+' : ''}{filesDiff.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Efficiency */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Efficiency</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              You: {(comparison.yourStats.efficiency * 100).toFixed(0)}% • Avg: {(comparison.averageStats.efficiency * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${comparison.yourStats.efficiency * 100}%` }}
              />
            </div>
            {efficiencyDiff !== 0 && (
              <span className={`text-xs font-semibold ${efficiencyDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {efficiencyDiff > 0 ? '+' : ''}{(efficiencyDiff * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Productivity Score */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Productivity Score</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {comparison.yourStats.productivity.toFixed(0)}/100
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {comparison.yourStats.productivity >= 80 ? 'Excellent' : 
                 comparison.yourStats.productivity >= 60 ? 'Good' : 
                 comparison.yourStats.productivity >= 40 ? 'Average' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
