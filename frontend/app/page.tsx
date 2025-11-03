'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, lazy, Suspense } from 'react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// Lazy load components for code splitting
const LoginForm = lazy(() => import('@/components/LoginForm').then(m => ({ default: m.LoginForm })))
const Dashboard = lazy(() => import('@/components/Dashboard').then(m => ({ default: m.Dashboard })))

export default function Home() {
  const { user, loading, checkAuth } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {!user ? <LoginForm /> : <Dashboard />}
    </Suspense>
  )
}
