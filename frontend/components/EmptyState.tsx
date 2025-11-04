'use client';

import { ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'suggestions' | 'workflows' | 'events';
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  const handleAction = () => {
    trackEvent('empty_state_action', {
      variant,
      action_label: action?.label,
    });
    action?.onClick();
  };

  const handleSecondaryAction = () => {
    trackEvent('empty_state_action', {
      variant,
      action_label: secondaryAction?.label,
    });
    secondaryAction?.onClick();
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{description}</p>
      
      <div className="flex gap-3">
        {action && (
          <button
            onClick={handleAction}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={handleSecondaryAction}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
