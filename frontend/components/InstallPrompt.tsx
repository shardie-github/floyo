'use client'

import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useState, useEffect } from 'react'
import { useNotifications } from './NotificationProvider'

export function InstallPrompt() {
  const { installPrompt, isInstalled, canInstall, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const [showDelayed, setShowDelayed] = useState(false)
  const { addNotification } = useNotifications()

  useEffect(() => {
    // Check if user previously dismissed
    if (typeof window !== 'undefined') {
      const wasDismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissTime = localStorage.getItem('pwa-install-dismissed-time')
      
      if (wasDismissed === 'true') {
        // Show again after 7 days
        if (dismissTime) {
          const daysSinceDismiss = (Date.now() - parseInt(dismissTime)) / (1000 * 60 * 60 * 24)
          if (daysSinceDismiss < 7) {
            setDismissed(true)
            return
          }
        } else {
          setDismissed(true)
          return
        }
      }
    }

    // Delay showing prompt for better UX (don't show immediately)
    const timer = setTimeout(() => {
      setShowDelayed(true)
    }, 3000) // Show after 3 seconds

    return () => clearTimeout(timer)
  }, [])

  if (isInstalled || !canInstall || dismissed || !showDelayed) {
    return null
  }

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      addNotification({
        type: 'success',
        message: 'Floyo installed successfully! You can now use it offline.',
        duration: 5000,
      })
      setDismissed(true)
    } else {
      addNotification({
        type: 'info',
        message: 'Installation cancelled',
      })
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', 'true')
      localStorage.setItem('pwa-install-dismissed-time', String(Date.now()))
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm border border-gray-200 dark:border-gray-700 z-50 animate-slide-up">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900">
            <svg 
              className="h-6 w-6 text-primary-600 dark:text-primary-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Install Floyo
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add Floyo to your home screen for quick access, offline support, and a native app experience.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:ring-offset-gray-800 transition-colors"
              aria-label="Install Floyo app"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:ring-offset-gray-800 transition-colors"
              aria-label="Dismiss install prompt"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label="Close install prompt"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
