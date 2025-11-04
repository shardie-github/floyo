'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from './NotificationProvider'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, removeNotification } = useNotifications()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setUnreadCount(notifications.length)
  }, [notifications])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      // Arrow keys for navigation (if needed in future)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        // Could implement focus navigation here
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element when opened
      const firstButton = document.querySelector('[aria-label="Remove notification"]') as HTMLElement
      if (firstButton) {
        firstButton.focus()
      }
    }
  }, [isOpen, notifications])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 id="notification-center-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close notifications"
            tabIndex={0}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : notification.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : notification.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          notification.type === 'success'
                            ? 'text-green-800 dark:text-green-200'
                            : notification.type === 'error'
                            ? 'text-red-800 dark:text-red-200'
                            : notification.type === 'warning'
                            ? 'text-yellow-800 dark:text-yellow-200'
                            : 'text-blue-800 dark:text-blue-200'
                        }`}
                      >
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={`Remove notification: ${notification.message.slice(0, 30)}`}
                      tabIndex={0}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                notifications.forEach((n) => removeNotification(n.id))
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              tabIndex={0}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
