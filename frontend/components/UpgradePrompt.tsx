'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  trigger: 'limit' | 'feature' | 'engagement';
  currentUsage?: number;
  limit?: number;
  featureName?: string;
  onDismiss?: () => void;
}

export default function UpgradePrompt({
  trigger,
  currentUsage,
  limit,
  featureName,
  onDismiss,
}: UpgradePromptProps) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has dismissed this prompt
    const dismissedKey = `upgrade_prompt_dismissed_${trigger}`;
    const dismissed = localStorage.getItem(dismissedKey);
    if (dismissed) {
      setDismissed(true);
      return;
    }

    // Show prompt based on trigger
    if (trigger === 'limit' && currentUsage && limit && currentUsage >= limit * 0.8) {
      setShow(true);
    } else if (trigger === 'feature') {
      setShow(true);
    } else if (trigger === 'engagement') {
      // Show if user has high engagement but hasn't upgraded
      setShow(true);
    }
  }, [trigger, currentUsage, limit]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    const dismissedKey = `upgrade_prompt_dismissed_${trigger}`;
    localStorage.setItem(dismissedKey, 'true');
    onDismiss?.();
  };

  const handleUpgrade = () => {
    // Track upgrade prompt click
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [{
          event_type: 'upgrade_prompt_click',
          properties: { trigger, featureName },
        }],
      }),
    });

    router.push('/billing');
  };

  if (!show || dismissed) {
    return null;
  }

  const getMessage = () => {
    switch (trigger) {
      case 'limit':
        return `You've used ${currentUsage} of ${limit} ${featureName || 'items'}. Upgrade to Pro for unlimited access.`;
      case 'feature':
        return `Unlock ${featureName || 'this feature'} and more with Pro.`;
      case 'engagement':
        return 'You\'re getting great value from Floyo! Upgrade to Pro to unlock unlimited features.';
      default:
        return 'Upgrade to Pro to unlock more features.';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-blue-200 p-4 max-w-sm z-50">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">Upgrade to Pro</h3>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">{getMessage()}</p>
      <div className="flex gap-2">
        <button
          onClick={handleUpgrade}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Upgrade Now
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 text-sm"
        >
          Later
        </button>
      </div>
    </div>
  );
}
