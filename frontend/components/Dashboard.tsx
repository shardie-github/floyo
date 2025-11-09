'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { statsAPI, suggestionsAPI, patternsAPI, eventsAPI, sampleDataAPI } from '@/lib/api'
// Dynamic imports for heavy components to reduce initial bundle size
import dynamic from 'next/dynamic'

const SuggestionsList = dynamic(() => import('./SuggestionsList').then(m => ({ default: m.SuggestionsList })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />,
})
const StatsCards = dynamic(() => import('./StatsCards').then(m => ({ default: m.StatsCards })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded" />,
})
const PatternsList = dynamic(() => import('./PatternsList').then(m => ({ default: m.PatternsList })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />,
})
const EventsList = dynamic(() => import('./EventsList').then(m => ({ default: m.EventsList })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />,
})
const PatternChart = dynamic(() => import('./PatternChart').then(m => ({ default: m.PatternChart })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded" />,
})
const EventTimeline = dynamic(() => import('./EventTimeline').then(m => ({ default: m.EventTimeline })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded" />,
})

import { DarkModeToggle } from './DarkModeToggle'
import { EventFilters } from './EventFilters'
import { Pagination } from './Pagination'
import { EmptyState } from './EmptyState'
import { NotificationCenter } from './NotificationCenter'
import { useNotifications } from './NotificationProvider'
import { GamificationDashboard } from './GamificationDashboard'
import { InsightsPanel } from './InsightsPanel'
import { ComparisonCard } from './ComparisonCard'
import { AnxietyReductionPanel } from './AnxietyReductionPanel'
import { TimeAnxietyCard } from './TimeAnxietyCard'
import { AchievementUnlockModal } from './AchievementUnlockModal'
import { StreakCounter } from './StreakCounter'
import { FOMOAlert } from './FOMOAlert'
import { ProgressMilestone } from './ProgressMilestone'
import { SearchBar } from './SearchBar'
import { OnboardingWizard } from './OnboardingWizard'
import { KeyboardShortcutsHelp, useKeyboardShortcuts } from './KeyboardShortcuts'
import { ProductTour, defaultTourSteps } from './ProductTour'
import { InstallPrompt } from './InstallPrompt'
import { ServiceWorkerUpdate } from './ServiceWorkerUpdate'
import { OfflineIndicator } from './OfflineIndicator'
import { ProgressBar } from './LoadingStates'
import { LoadingSkeleton } from './LoadingSkeleton'
import { getErrorMessage } from '@/lib/errorMessages'

export function Dashboard() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [sampleDataProgress, setSampleDataProgress] = useState<number | null>(null)
  const [isGeneratingSampleData, setIsGeneratingSampleData] = useState(false)
  
  const [eventFilters, setEventFilters] = useState<{
    tool?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }>({})
  const [eventSkip, setEventSkip] = useState(0)
  const [patternSkip, setPatternSkip] = useState(0)
  const eventLimit = 20
  const patternLimit = 20

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: statsAPI.get,
  })

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['suggestions', 0, 10],
    queryFn: () => suggestionsAPI.list(0, 10),
  })

  const { data: patternsData, isLoading: patternsLoading } = useQuery({
    queryKey: ['patterns', patternSkip, patternLimit],
    queryFn: () => patternsAPI.list(patternSkip, patternLimit),
  })

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', eventSkip, eventLimit, eventFilters],
    queryFn: () => eventsAPI.list(eventSkip, eventLimit, eventFilters),
  })

  // Memoize mutation callbacks
  const handleGenerateSuccess = useCallback(async () => {
    const { safeInvalidateQueries } = await import('@/lib/race-condition-guards')
    safeInvalidateQueries(queryClient, ['suggestions'], { debounceMs: 100 })
    safeInvalidateQueries(queryClient, ['stats'], { debounceMs: 100 })
  }, [queryClient])

  const generateSuggestionsMutation = useMutation({
    mutationFn: suggestionsAPI.generate,
    onSuccess: handleGenerateSuccess,
  })
  
  // Memoize event handlers
  const handleNotificationToggle = useCallback(() => {
    setShowNotificationCenter(prev => !prev)
  }, [])
  
  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  // Memoize derived data to prevent unnecessary re-renders
  const suggestions = useMemo(() => suggestionsData?.items || [], [suggestionsData?.items])
  const patterns = useMemo(() => patternsData?.items || [], [patternsData?.items])
  const events = useMemo(() => eventsData?.items || [], [eventsData?.items])
  
  // Memoize loading states
  const isLoading = useMemo(() => 
    statsLoading || suggestionsLoading || patternsLoading || eventsLoading,
    [statsLoading, suggestionsLoading, patternsLoading, eventsLoading]
  )

  // Memoize WebSocket message handler
  const handleWebSocketMessage = useCallback((message: Record<string, unknown>) => {
    if (message.type === 'event') {
      const { safeInvalidateQueries } = require('@/lib/race-condition-guards')
      safeInvalidateQueries(queryClient, ['events'], { debounceMs: 100 })
      safeInvalidateQueries(queryClient, ['stats'], { debounceMs: 100 })
    } else if (message.type === 'suggestion') {
      const { safeInvalidateQueries } = require('@/lib/race-condition-guards')
      safeInvalidateQueries(queryClient, ['suggestions'], { debounceMs: 100 })
    }
  }, [queryClient])

  // Set up WebSocket connection for realtime updates with race condition protection
  useEffect(() => {
    // Import WebSocketManager dynamically to avoid SSR issues
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    let wsManager: { disconnect: () => void } | null = null;
    
    import('@/lib/race-condition-guards').then(({ WebSocketManager }) => {
      wsManager = new WebSocketManager(
        WS_URL,
        {
          maxReconnectAttempts: 5,
          baseReconnectDelay: 1000,
          onMessage: handleWebSocketMessage,
          onError: (error) => {
            if (process.env.NODE_ENV === 'development') {
              console.error('WebSocket error:', error)
            }
          },
        }
      )
      
      wsManager.connect()
    }).catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to initialize WebSocket:', error)
      }
    })

    return () => {
      if (wsManager) {
        wsManager.disconnect()
      }
    }
  }, [handleWebSocketMessage])

  const [unlockedAchievement, setUnlockedAchievement] = useState<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xp: number;
  } | null>(null);

  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: 'Open search',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
        searchInput?.focus();
      },
    },
    {
      key: 'g',
      ctrl: true,
      description: 'Go to dashboard',
      action: () => {
        window.location.href = '/dashboard';
      },
    },
    {
      key: '?',
      description: 'Show shortcuts',
      action: () => setShowShortcuts(!showShortcuts),
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <OfflineIndicator />
      <StreakCounter />
      <FOMOAlert />
      <AchievementUnlockModal 
        achievement={unlockedAchievement} 
        onClose={() => setUnlockedAchievement(null)} 
      />
      <OnboardingWizard />
      {showShortcuts && <KeyboardShortcutsHelp />}
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Floyo</h1>
            </div>
            <div className="flex items-center space-x-4 flex-1 max-w-md mx-4">
              <SearchBar />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNotificationToggle}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                aria-label="Notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <DarkModeToggle />
              <span className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-tour="dashboard">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your file usage patterns and discover integration opportunities
          </p>
        </div>

        {/* Progress Milestone - Achievement Progress */}
        <div className="mb-6">
          <ProgressMilestone />
        </div>

        {/* Insights Panel - FOMO, Urgency, Personalization */}
        <div className="mb-8">
          <InsightsPanel />
        </div>

        {/* Gamification & Comparison Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GamificationDashboard />
          <ComparisonCard />
        </div>

        {/* Anxiety Reduction & Time Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnxietyReductionPanel />
          <TimeAnxietyCard />
        </div>

        {statsLoading ? (
          <LoadingSkeleton />
        ) : stats ? (
          <StatsCards stats={stats} />
        ) : null}

        {/* Charts Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {patterns.length > 0 && <PatternChart patterns={patterns} />}
          {events.length > 0 && <EventTimeline events={events} />}
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Integration Suggestions
            </h3>
            <button
              onClick={() => generateSuggestionsMutation.mutate()}
              disabled={generateSuggestionsMutation.isPending}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Generate integration suggestions"
            >
              {generateSuggestionsMutation.isPending
                ? 'Generating...'
                : 'Generate Suggestions'}
            </button>
          </div>
          {suggestionsLoading ? (
            <LoadingSkeleton />
          ) : suggestions.length > 0 ? (
            <SuggestionsList suggestions={suggestions} />
          ) : (
            <>
              <EmptyState
                variant="suggestions"
                title="No suggestions yet"
                description="Start tracking your file usage to get personalized integration suggestions."
                action={{
                  label: "Generate Suggestions",
                  onClick: () => generateSuggestionsMutation.mutate()
                }}
                secondaryAction={{
                  label: "Try Sample Data",
                  onClick: async () => {
                    setIsGeneratingSampleData(true)
                    setSampleDataProgress(0)
                    try {
                      // Simulate progress
                      const progressInterval = setInterval(() => {
                        setSampleDataProgress((prev) => {
                          if (prev === null || prev >= 90) {
                            clearInterval(progressInterval)
                            return prev
                          }
                          return prev + 10
                        })
                      }, 200)

                      const result = await sampleDataAPI.generate()
                      clearInterval(progressInterval)
                      setSampleDataProgress(100)

                      if (result.success) {
                        addNotification({
                          type: 'success',
                          message: `Generated ${result.events_generated} events, ${result.patterns_generated} patterns, and ${result.suggestions_generated} suggestions!`,
                        })
                        queryClient.invalidateQueries({ queryKey: ['suggestions'] })
                        queryClient.invalidateQueries({ queryKey: ['events'] })
                        queryClient.invalidateQueries({ queryKey: ['patterns'] })
                      }
                      setTimeout(() => {
                        setSampleDataProgress(null)
                        setIsGeneratingSampleData(false)
                      }, 1000)
                    } catch (error) {
                      const errorMsg = getErrorMessage(error)
                      addNotification({
                        type: 'error',
                        message: errorMsg.message,
                      })
                      setSampleDataProgress(null)
                      setIsGeneratingSampleData(false)
                    }
                  }
                }}
              />
              {sampleDataProgress !== null && (
                <div className="mt-4">
                  <ProgressBar progress={sampleDataProgress} label="Generating sample data..." />
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Usage Patterns
          </h3>
          {patternsLoading ? (
            <LoadingSkeleton />
          ) : patterns.length > 0 ? (
            <>
              <PatternsList patterns={patterns} />
              {patternsData && patternsData.has_more && (
                <div className="mt-4">
                  <Pagination
                    skip={patternSkip}
                    limit={patternLimit}
                    total={patternsData.total}
                    onPageChange={setPatternSkip}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              variant="workflows"
              title="No patterns detected"
              description="Patterns will appear here as you use files and tools."
              action={{
                label: "Try Sample Data",
                onClick: async () => {
                  setIsGeneratingSampleData(true)
                  setSampleDataProgress(0)
                  try {
                    const progressInterval = setInterval(() => {
                      setSampleDataProgress((prev) => {
                        if (prev === null || prev >= 90) {
                          clearInterval(progressInterval)
                          return prev
                        }
                        return prev + 10
                      })
                    }, 200)

                    const result = await sampleDataAPI.generate()
                    clearInterval(progressInterval)
                    setSampleDataProgress(100)

                    if (result.success) {
                      addNotification({
                        type: 'success',
                        message: `Generated ${result.events_generated} events, ${result.patterns_generated} patterns!`,
                      })
                      queryClient.invalidateQueries({ queryKey: ['patterns'] })
                      queryClient.invalidateQueries({ queryKey: ['events'] })
                    }
                    setTimeout(() => {
                      setSampleDataProgress(null)
                      setIsGeneratingSampleData(false)
                    }, 1000)
                  } catch (error) {
                    const errorMsg = getErrorMessage(error)
                    addNotification({
                      type: 'error',
                      message: errorMsg.message,
                    })
                    setSampleDataProgress(null)
                    setIsGeneratingSampleData(false)
                  }
                }
              }}
            />
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Events
          </h3>
          <EventFilters onFilterChange={setEventFilters} currentFilters={eventFilters} />
          <div className="mt-4">
            {eventsLoading ? (
              <LoadingSkeleton />
            ) : events.length > 0 ? (
              <>
                <EventsList events={events} />
                {eventsData && eventsData.has_more && (
                  <div className="mt-4">
                    <Pagination
                      skip={eventSkip}
                      limit={eventLimit}
                      total={eventsData.total}
                      onPageChange={setEventSkip}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <EmptyState
                  variant="events"
                  title="No events yet"
                  description="Events will appear here as you track file operations."
                  action={{
                    label: "Try Sample Data",
                    onClick: async () => {
                      setIsGeneratingSampleData(true)
                      setSampleDataProgress(0)
                      try {
                        const progressInterval = setInterval(() => {
                          setSampleDataProgress((prev) => {
                            if (prev === null || prev >= 90) {
                              clearInterval(progressInterval)
                              return prev
                            }
                            return prev + 10
                          })
                        }, 200)

                        const result = await sampleDataAPI.generate()
                        clearInterval(progressInterval)
                        setSampleDataProgress(100)

                        if (result.success) {
                          addNotification({
                            type: 'success',
                            message: `Generated ${result.events_generated} events, ${result.patterns_generated} patterns!`,
                          })
                          queryClient.invalidateQueries({ queryKey: ['events'] })
                          queryClient.invalidateQueries({ queryKey: ['patterns'] })
                        }
                        setTimeout(() => {
                          setSampleDataProgress(null)
                          setIsGeneratingSampleData(false)
                        }, 1000)
                      } catch (error) {
                        const errorMsg = getErrorMessage(error)
                        addNotification({
                          type: 'error',
                          message: errorMsg.message,
                        })
                        setSampleDataProgress(null)
                        setIsGeneratingSampleData(false)
                      }
                    }
                  }}
                />
                {sampleDataProgress !== null && (
                  <div className="mt-4">
                    <ProgressBar progress={sampleDataProgress} label="Generating sample data..." />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* Product Tour */}
      <ProductTour steps={defaultTourSteps} run={!localStorage.getItem('has_completed_product_tour')} />
      <InstallPrompt />
      <ServiceWorkerUpdate />
      
      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
      
      {/* Onboarding Flow for New Users */}
      {user && !localStorage.getItem('has_completed_onboarding') && (
        <OnboardingFlow
          steps={[
            {
              id: 'welcome',
              title: 'Welcome to Floyo!',
              description: 'Track your file usage patterns and discover integration opportunities.',
              component: <div>Let's get started!</div>
            },
            {
              id: 'dashboard',
              title: 'Dashboard Overview',
              description: 'Your dashboard shows events, patterns, and suggestions.',
              component: <div>Explore your data here.</div>
            },
            {
              id: 'suggestions',
              title: 'Integration Suggestions',
              description: 'Get personalized suggestions based on your workflow.',
              component: <div>Check out the suggestions!</div>
            }
          ]}
          onComplete={() => {
            localStorage.setItem('has_completed_onboarding', 'true')
          }}
        />
      )}
    </div>
  )
}
