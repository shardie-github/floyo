'use client'

import { useState } from 'react'

interface EventFiltersProps {
  onFilterChange: (filters: {
    event_type?: string
    tool?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => void
  currentFilters: {
    event_type?: string
    tool?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }
}

export function EventFilters({ onFilterChange, currentFilters }: EventFiltersProps) {
  const [search, setSearch] = useState(currentFilters.search || '')
  const [eventType, setEventType] = useState(currentFilters.event_type || '')
  const [tool, setTool] = useState(currentFilters.tool || '')
  const [sortBy, setSortBy] = useState(currentFilters.sort_by || 'timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(currentFilters.sort_order || 'desc')

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFilterChange({
      ...currentFilters,
      search: value || undefined,
    })
  }

  const handleEventTypeChange = (value: string) => {
    setEventType(value)
    onFilterChange({
      ...currentFilters,
      event_type: value || undefined,
    })
  }

  const handleToolChange = (value: string) => {
    setTool(value)
    onFilterChange({
      ...currentFilters,
      tool: value || undefined,
    })
  }

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field)
    setSortOrder(order)
    onFilterChange({
      ...currentFilters,
      sort_by: field,
      sort_order: order,
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search events..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => handleEventTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Types</option>
            <option value="file_open">File Open</option>
            <option value="file_create">File Create</option>
            <option value="file_modify">File Modify</option>
            <option value="file_delete">File Delete</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tool
          </label>
          <input
            type="text"
            value={tool}
            onChange={(e) => handleToolChange(e.target.value)}
            placeholder="Filter by tool..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sort by:
        </label>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value, sortOrder)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="timestamp">Timestamp</option>
          <option value="event_type">Event Type</option>
          <option value="tool">Tool</option>
        </select>
        <button
          onClick={() => handleSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          {sortOrder === 'asc' ? '?' : '?'}
        </button>
      </div>
    </div>
  )
}
