'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { reportError, handleError, getUserFriendlyMessage, ErrorContext } from '@/lib/error-boundary/error-handler'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error info for display
    this.setState({ errorInfo })

    // Build error context
    const context: ErrorContext = {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    }

    // Report error using centralized error handler
    reportError(error, context)

    // Also report to Sentry if available
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const error = this.state.error
      const errorInfo = this.state.errorInfo
      const userMessage = error ? getUserFriendlyMessage(error) : 'An unexpected error occurred'
      const showDetails = this.props.showDetails ?? process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {userMessage}
            </p>

            {showDetails && error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error Details
                  </summary>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                    {error.toString()}
                    {error.stack && `\n\nStack:\n${error.stack}`}
                  </pre>
                  {errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto mt-2">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </details>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                  window.location.reload()
                }}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                  window.location.href = '/'
                }}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Go Home
              </button>
              {error && 'retryable' in error && error.retryable && (
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null })
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
