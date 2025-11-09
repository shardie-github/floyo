'use client';

import { useQuery } from '@tanstack/react-query';
// Using emoji icons instead of lucide-react
import { useState } from 'react';

interface FOMOAlert {
  id: string;
  title: string;
  message: string;
  expiresAt: string;
  cta: {
    text: string;
    action: string;
  };
}

export function FOMOAlert() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: alerts } = useQuery<FOMOAlert[]>({
    queryKey: ['fomo-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/insights');
      const insights = await res.json();
      return insights.filter((i: { type: string; expiresAt?: string }) => 
        i.type === 'fomo' && i.expiresAt
      );
    },
    refetchInterval: 60000,
  });

  const activeAlert = alerts?.find(a => 
    !dismissed.has(a.id) && 
    new Date(a.expiresAt) > new Date()
  );

  if (!activeAlert) return null;

  const hoursUntilExpiry = Math.floor(
    (new Date(activeAlert.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
  );

  return (
    <div className="fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg shadow-xl p-4 max-w-sm z-50 animate-in slide-in-from-right">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-red-900 dark:text-red-100">
              {activeAlert.title}
            </h3>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(activeAlert.id))}
              className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            {activeAlert.message}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <span className="text-sm">⏰</span>
              <span>{hoursUntilExpiry}h left</span>
            </div>
            <a
              href={activeAlert.cta.action}
              className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {activeAlert.cta.text}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
