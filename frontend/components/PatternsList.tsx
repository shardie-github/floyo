'use client'

import { Pattern } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface PatternsListProps {
  patterns: Pattern[]
}

export function PatternsList({ patterns }: PatternsListProps) {
  if (patterns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No patterns detected yet.</p>
      </div>
    )
  }

  const sortedPatterns = [...patterns].sort((a, b) => b.count - a.count)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="divide-y divide-gray-200">
        {sortedPatterns.map((pattern) => (
          <div key={pattern.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">
                  {pattern.file_extension || '(no extension)'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Used {pattern.count} time{pattern.count !== 1 ? 's' : ''}
                </p>
                {pattern.last_used && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last used{' '}
                    {formatDistanceToNow(new Date(pattern.last_used), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
              {pattern.tools && pattern.tools.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pattern.tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
