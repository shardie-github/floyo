'use client'

import { useState, useEffect } from 'react'
import { onOnlineStatusChange } from '@/lib/offline'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const unsubscribe = onOnlineStatusChange((online) => {
      setIsOnline(online)
      // Show indicator when going offline
      if (!online) {
        setShowIndicator(true)
      } else {
        // Hide after a delay when coming back online
        setTimeout(() => setShowIndicator(false), 2000)
      }
    })

    return unsubscribe
  }, [])

  if (!showIndicator && isOnline) {
    return null
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showIndicator && !isOnline
          ? 'translate-y-0'
          : '-translate-y-full'
      }`}
    >
      <div
        className={`${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-yellow-600 text-white'
        } px-4 py-2 text-center text-sm font-medium`}
      >
        {isOnline ? (
          <span className="flex items-center justify-center">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Back online - Syncing data...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            You're offline - Your actions are being queued
          </span>
        )}
      </div>
    </div>
  )
}
