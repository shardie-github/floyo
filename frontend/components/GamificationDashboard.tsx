'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface UserStats {
  level: number;
  xp: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
  }>;
  streak: number;
  rank: number;
  percentile: number;
  efficiency: number;
  productivity: number;
}

export function GamificationDashboard() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['gamification-stats'],
    queryFn: async () => {
      const res = await fetch('/api/gamification/stats');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded" />;
  }

  if (!stats) return null;

  const xpForNextLevel = (stats.level + 1) ** 2 * 100;
  const xpProgress = ((stats.xp % (stats.level ** 2 * 100)) / (xpForNextLevel - stats.xp)) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Your Stats
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Level {stats.level} • Rank #{stats.rank}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {stats.percentile.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Percentile
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">XP Progress</span>
          <span className="text-gray-900 dark:text-gray-100 font-semibold">
            {stats.xp} / {xpForNextLevel} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Streak */}
      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🔥 {stats.streak} days
            </div>
          </div>
          {stats.streak >= 7 && (
            <div className="text-4xl">🏆</div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.badges.map((badge) => (
            <div
              key={badge.id}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center border-2 border-transparent hover:border-primary-500 transition-colors"
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {badge.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {badge.rarity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Productivity Score */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Efficiency
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {(stats.efficiency * 100).toFixed(0)}%
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Productivity
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.productivity.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
