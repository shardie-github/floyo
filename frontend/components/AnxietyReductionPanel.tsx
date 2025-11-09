'use client';

import { useQuery } from '@tanstack/react-query';
// Using emoji icons instead of lucide-react

interface PrivacyScore {
  score: number;
  factors: Array<{
    name: string;
    status: 'good' | 'warning' | 'critical';
    message: string;
  }>;
}

export function AnxietyReductionPanel() {
  const { data: privacyScore, isLoading } = useQuery<PrivacyScore>({
    queryKey: ['privacy-score'],
    queryFn: async () => {
      const res = await fetch('/api/privacy/score');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded" />;
  }

  if (!privacyScore) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    return <Lock className="w-6 h-6 text-red-600" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Privacy Score
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your data security status
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor(privacyScore.score)}`}>
            {privacyScore.score}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">/ 100</div>
        </div>
      </div>

      {/* Score Visualization */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${
              privacyScore.score >= 80 ? 'bg-green-600' :
              privacyScore.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${privacyScore.score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-3">
        {privacyScore.factors.map((factor, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            {factor.status === 'good' ? (
              <span className="text-xl">✅</span>
            ) : factor.status === 'warning' ? (
              <span className="text-xl">⚠️</span>
            ) : (
              <span className="text-xl">🔒</span>
            )}
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {factor.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {factor.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {privacyScore.score < 80 && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 <strong>Tip:</strong> Improve your privacy score by enabling MFA and reviewing your data retention settings.
          </p>
          <a
            href="/settings/privacy"
            className="inline-block mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:underline"
          >
            Go to Privacy Settings →
          </a>
        </div>
      )}
    </div>
  );
}
