'use client';

import { useQuery } from '@tanstack/react-query';
// Using emoji icons instead of lucide-react

interface Milestone {
  id: string;
  name: string;
  progress: number;
  target: number;
  reward: {
    xp: number;
    badge?: string;
  };
}

export function ProgressMilestone() {
  const { data: achievements } = useQuery<Milestone[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch('/api/gamification/achievements');
      return res.json();
    },
  });

  const closestAchievement = achievements?.find(a => a.progress < a.target)
    ?.sort((a, b) => {
      const aProgress = a.progress / a.target;
      const bProgress = b.progress / b.target;
      return bProgress - aProgress;
    })[0];

  if (!closestAchievement || closestAchievement.progress / closestAchievement.target < 0.7) {
    return null;
  }

  const progressPercent = (closestAchievement.progress / closestAchievement.target) * 100;
  const remaining = closestAchievement.target - closestAchievement.progress;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🎯</span>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Almost There!
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {closestAchievement.name}: {remaining} more to go
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {progressPercent.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{closestAchievement.progress} / {closestAchievement.target}</span>
        <span className="flex items-center gap-1">
          <span className="text-sm">📈</span>
          +{closestAchievement.reward.xp} XP reward
        </span>
      </div>
    </div>
  );
}
