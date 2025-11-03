'use client'

import { Event } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface EventsListProps {
  events: Event[]
}

export function EventsList({ events }: EventsListProps) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No events recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow max-h-96 overflow-y-auto">
      <div className="divide-y divide-gray-200">
        {events.map((event) => (
          <div key={event.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-900 capitalize">
                  {event.event_type.replace('_', ' ')}
                </p>
                {event.file_path && (
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {event.file_path}
                  </p>
                )}
                {event.tool && (
                  <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {event.tool}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 ml-4">
                {formatDistanceToNow(new Date(event.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
