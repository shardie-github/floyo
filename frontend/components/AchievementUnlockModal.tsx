'use client';

import { useEffect, useState } from 'react';
// Using emoji icons instead of lucide-react

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp: number;
}

const rarityColors = {
  common: 'border-gray-400 bg-gray-50',
  rare: 'border-blue-400 bg-blue-50',
  epic: 'border-purple-400 bg-purple-50',
  legendary: 'border-yellow-400 bg-yellow-50',
};

export function AchievementUnlockModal({ achievement, onClose }: { achievement: Achievement | null; onClose: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShow(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement || !show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 ${rarityColors[achievement.rarity]} animate-in zoom-in-95`}>
        <button
          onClick={() => {
            setShow(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
        </button>

        <div className="text-center">
          {/* Sparkle Effect */}
          <div className="relative mb-4">
            <div className="text-6xl mx-auto animate-pulse flex items-center justify-center">
              ✨
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">{achievement.icon}</div>
            </div>
          </div>

          <div className="mb-2">
            <div className="inline-block px-3 py-1 text-xs font-semibold bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full mb-2">
              {achievement.rarity.toUpperCase()} ACHIEVEMENT
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Achievement Unlocked!
          </h2>

          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {achievement.name}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {achievement.description}
          </p>

          <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400">
            <span className="text-xl">🏆</span>
            <span className="font-semibold">+{achievement.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
