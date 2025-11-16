'use client';

import { ReactNode } from 'react';
import { Plus, FileText, Workflow, Users, Settings, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  type?: 'default' | 'workflow' | 'event' | 'team' | 'integration' | 'search';
}

const iconMap = {
  default: <FileText className="w-12 h-12 text-gray-400" />,
  workflow: <Workflow className="w-12 h-12 text-gray-400" />,
  event: <FileText className="w-12 h-12 text-gray-400" />,
  team: <Users className="w-12 h-12 text-gray-400" />,
  integration: <Settings className="w-12 h-12 text-gray-400" />,
  search: <Search className="w-12 h-12 text-gray-400" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  type = 'default',
}: EmptyStateProps) {
  const displayIcon = icon || iconMap[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">{displayIcon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <div className="flex gap-3">
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
