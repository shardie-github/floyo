'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { NotificationProvider } from '@/components/NotificationProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initBackgroundSync } from '@/lib/backgroundSync'
import { initOfflineDB } from '@/lib/offline'

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize offline services
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initOfflineDB().catch(console.error)
      initBackgroundSync()
    }
  }, [])

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 2 times for other errors
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        staleTime: 30000, // Consider data stale after 30 seconds
      },
      mutations: {
        retry: 1, // Retry mutations once on network errors
      },
    },
  }))

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
