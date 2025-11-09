'use client';

import { useQuery } from '@tanstack/react-query';
// Using emoji icon instead of lucide-react

export function StreakCounter() {
  const { data: streak, isLoading } = useQuery<number>({
    queryKey: ['streak'],
    queryFn: async () => {
      const res = await fetch('/api/gamification/stats');
      const data = await res.json();
      return data.streak || 0;
    },
  });

  if (isLoading || !streak || streak === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4 z-40">
      <span className="text-xl animate-pulse">🔥</span>
      <span className="font-bold">{streak} day streak</span>
      {streak >= 7 && <span className="text-xs">🔥</span>}
    </div>
  );
}
