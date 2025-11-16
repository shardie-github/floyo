'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
          <p className="text-gray-600 mb-8">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Try Again
          </button>
          <div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Go Home
            </Link>
          </div>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-sm font-mono text-red-600">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
