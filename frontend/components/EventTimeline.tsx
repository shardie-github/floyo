'use client'

import { Event } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface EventTimelineProps {
  events: Event[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  const chartData = useMemo(() => {
    // Group events by hour
    const hourlyCounts: Record<string, number> = {}
    
    events.forEach((event) => {
      const date = new Date(event.timestamp)
      const hourKey = `${date.getHours()}:00`
      hourlyCounts[hourKey] = (hourlyCounts[hourKey] || 0) + 1
    })

    return Object.entries(hourlyCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
      .slice(-24) // Last 24 hours
  }, [events])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Event Activity Timeline
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="hour"
            stroke="#6b7280"
            className="dark:text-gray-400"
          />
          <YAxis
            stroke="#6b7280"
            className="dark:text-gray-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#0284c7"
            strokeWidth={2}
            name="Events"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
