'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { statsAPI, suggestionsAPI, patternsAPI, eventsAPI } from '@/lib/api'
import { SuggestionsList } from './SuggestionsList'
import { StatsCards } from './StatsCards'
import { PatternsList } from './PatternsList'
import { EventsList } from './EventsList'
import { useEffect } from 'react'

export function Dashboard() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: statsAPI.get,
  })

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => suggestionsAPI.list(10),
  })

  const { data: patterns } = useQuery({
    queryKey: ['patterns'],
    queryFn: patternsAPI.list,
  })

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsAPI.list(0, 50),
  })

  const generateSuggestionsMutation = useMutation({
    mutationFn: suggestionsAPI.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  // Set up WebSocket connection for realtime updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws`)
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      // Refresh relevant queries on updates
      if (message.type === 'event') {
        queryClient.invalidateQueries({ queryKey: ['events'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else if (message.type === 'suggestion') {
        queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [queryClient])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Floyo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Track your file usage patterns and discover integration opportunities
          </p>
        </div>

        {stats && <StatsCards stats={stats} />}

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Integration Suggestions
            </h3>
            <button
              onClick={() => generateSuggestionsMutation.mutate()}
              disabled={generateSuggestionsMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {generateSuggestionsMutation.isPending
                ? 'Generating...'
                : 'Generate Suggestions'}
            </button>
          </div>
          {suggestions && <SuggestionsList suggestions={suggestions} />}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Usage Patterns
            </h3>
            {patterns && <PatternsList patterns={patterns} />}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Events
            </h3>
            {events && <EventsList events={events} />}
          </div>
        </div>
      </main>
    </div>
  )
}
