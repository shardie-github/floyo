'use client'

import { useState } from 'react'

interface ProgressBarProps {
  progress: number // 0-100
  label?: string
  showPercentage?: boolean
}

export function ProgressBar({ progress, label, showPercentage = true }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  progress?: number
  showSpinner?: boolean
}

export function LoadingState({ message = 'Loading...', progress, showSpinner = true }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {showSpinner && (
        <div className="mb-4" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
          <span className="sr-only">Loading...</span>
        </div>
      )}
      {progress !== undefined && (
        <div className="w-full max-w-md mb-4">
          <ProgressBar progress={progress} />
        </div>
      )}
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  )
}

interface LoadingButtonProps {
  onClick: () => void | Promise<void>
  loading: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function LoadingButton({ onClick, loading, children, disabled, className = '' }: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onClick()
    } finally {
      setIsLoading(false)
    }
  }

  const isLoadingState = loading || isLoading

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoadingState}
      className={`${className} ${isLoadingState ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-busy={isLoadingState}
    >
      {isLoadingState ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
