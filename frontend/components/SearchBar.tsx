'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  type: 'file' | 'event' | 'pattern';
  id: string;
  title: string;
  description: string;
  relevance: number;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      const data = await res.json();
      return data.results || [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: suggestions } = useQuery<string[]>({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 1) return [];
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
      const data = await res.json();
      return data.suggestions || [];
    },
    enabled: debouncedQuery.length >= 1 && debouncedQuery.length < 2,
  });

  const handleSelect = useCallback((result: SearchResult) => {
    // Navigate to result
    if (result.type === 'event') {
      window.location.href = `/dashboard?event=${result.id}`;
    } else if (result.type === 'pattern') {
      window.location.href = `/dashboard?pattern=${result.id}`;
    }
    setIsOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    setIsOpen(query.length > 0 && (results?.length || suggestions?.length));
  }, [query, results, suggestions]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search files, events, patterns..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        {isLoading && (
          <span className="absolute right-3 top-2.5 text-gray-400 animate-spin">⏳</span>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (results?.length || suggestions?.length) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {suggestions && suggestions.length > 0 && query.length < 2 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
                Suggestions
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {results && results.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
                Results ({results.length})
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {result.type === 'event' ? '📄' : result.type === 'pattern' ? '🔍' : '📊'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {result.description}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(result.relevance * 100)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && query.length >= 2 && (!results || results.length === 0) && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
