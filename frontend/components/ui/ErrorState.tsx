'use client';

import { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  error?: Error;
  retry?: () => void;
  icon?: ReactNode;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  error,
  retry,
  icon,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-4xl text-red-500">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2 text-red-600">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      {error && (
        <details className="mb-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Error details</summary>
          <pre className="mt-2 text-left overflow-auto max-w-md">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
