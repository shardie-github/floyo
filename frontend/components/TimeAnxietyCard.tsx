'use client';

import { useQuery } from '@tanstack/react-query';
// Using emoji icons instead of lucide-react

interface TimeMetrics {
  totalHoursTracked: number;
  potentialHoursSaved: number;
  efficiency: number;
  wastedTime: number;
  recommendations: string[];
}

export function TimeAnxietyCard() {
  const { data: metrics, isLoading } = useQuery<TimeMetrics>({
    queryKey: ['time-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/insights/time');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded" />;
  }

  if (!metrics) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-orange-200 dark:border-orange-800">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⏱️</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Time Analysis
        </h2>
      </div>

      {/* Wasted Time Alert */}
      {metrics.wastedTime > 2 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Potential Time Waste Detected
              </div>
              <div className="text-sm text-red-800 dark:text-red-200">
                You could save <strong>{metrics.wastedTime.toFixed(1)} hours</strong> per week by optimizing your workflow.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Tracked
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.totalHoursTracked.toFixed(1)}h
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Could Save
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {metrics.potentialHoursSaved.toFixed(1)}h
          </div>
        </div>
      </div>

      {/* Efficiency */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Efficiency Score</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(metrics.efficiency * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              metrics.efficiency >= 0.7 ? 'bg-green-600' :
              metrics.efficiency >= 0.5 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${metrics.efficiency * 100}%` }}
          />
        </div>
      </div>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📈</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Recommendations
            </h3>
          </div>
          <ul className="space-y-2">
            {metrics.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
