'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { statsAPI, suggestionsAPI, patternsAPI, eventsAPI } from '@/lib/api'
import { SuggestionsList } from './SuggestionsList'
import { StatsCards } from './StatsCards'
import { PatternsList } from './PatternsList'
import { EventsList } from './EventsList'
import { DarkModeToggle } from './DarkModeToggle'
import { EventFilters } from './EventFilters'
import { Pagination } from './Pagination'
import { PatternChart } from './PatternChart'
import { EventTimeline } from './EventTimeline'
import { LoadingSkeleton } from './LoadingSkeleton'
import { InstallPrompt } from './InstallPrompt'
import { OfflineIndicator } from './OfflineIndicator'
import { ServiceWorkerUpdate } from './ServiceWorkerUpdate'
import { useEffect, useState } from 'react'

export function Dashboard() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  
  const [eventFilters, setEventFilters] = useState<{
    event_type?: string
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

  const generateSuggestionsMutation = useMutation({
    mutationFn: suggestionsAPI.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const suggestions = suggestionsData?.items || []
  const patterns = patternsData?.items || []
  const events = eventsData?.items || []

  // Set up WebSocket connection for realtime updates with reconnection logic
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const baseReconnectDelay = 1000 // 1 second
    
    const connect = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          reconnectAttempts = 0 // Reset on successful connection
        }
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            // Refresh relevant queries on updates
            if (message.type === 'event') {
              queryClient.invalidateQueries({ queryKey: ['events'] })
              queryClient.invalidateQueries({ queryKey: ['stats'] })
            } else if (message.type === 'suggestion') {
              queryClient.invalidateQueries({ queryKey: ['suggestions'] })
            }
          } catch (error) {
            // Silently handle parse errors
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to parse WebSocket message:', error)
            }
          }
        }

        ws.onerror = (error) => {
          // Silently handle WebSocket errors - connection will retry automatically
          if (process.env.NODE_ENV === 'development') {
            console.error('WebSocket error:', error)
          }
        }

        ws.onclose = () => {
          // Attempt reconnection if not manually closed
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts - 1)
            reconnectTimeout = setTimeout(() => {
              connect()
            }, delay)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('WebSocket connection error:', error)
        }
      }
    }
    
    connect()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [queryClient])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <OfflineIndicator />
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Floyo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <span className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your file usage patterns and discover integration opportunities
          </p>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No suggestions yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start tracking your file usage to get personalized integration suggestions.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => generateSuggestionsMutation.mutate()}
                  disabled={generateSuggestionsMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Generate Suggestions
                </button>
              </div>
            </div>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No patterns detected</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Patterns will appear here as you use files and tools.
              </p>
            </div>
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No events recorded</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Events will appear here as you work with files.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <InstallPrompt />
      <ServiceWorkerUpdate />
    </div>
  )
}
