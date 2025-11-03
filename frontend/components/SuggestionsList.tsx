'use client'

import { Suggestion } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface SuggestionsListProps {
  suggestions: Suggestion[]
}

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          No suggestions yet. Start using files to generate suggestions!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {suggestion.suggested_integration}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{suggestion.trigger}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                {Math.round(suggestion.confidence * 100)}% confidence
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(suggestion.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {suggestion.reasoning && (
            <p className="text-sm text-gray-700 mt-2">{suggestion.reasoning}</p>
          )}

          {suggestion.tools_involved && suggestion.tools_involved.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestion.tools_involved.map((tool, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}

          {suggestion.sample_code && (
            <details className="mt-4">
              <summary className="text-sm font-medium text-primary-600 cursor-pointer hover:text-primary-700">
                View Sample Code
              </summary>
              <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                <code>{suggestion.sample_code}</code>
              </pre>
            </details>
          )}

          {suggestion.actual_files && suggestion.actual_files.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-1">Related files:</p>
              <ul className="text-xs text-gray-500 list-disc list-inside">
                {suggestion.actual_files.slice(0, 3).map((file, idx) => (
                  <li key={idx}>{file}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
