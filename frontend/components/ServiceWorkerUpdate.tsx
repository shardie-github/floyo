'use client'

import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate'
import { useNotifications } from './NotificationProvider'

export function ServiceWorkerUpdate() {
  const { updateAvailable, isUpdating, updateServiceWorker } = useServiceWorkerUpdate()
  const { addNotification } = useNotifications()

  if (!updateAvailable) {
    return null
  }

  const handleUpdate = async () => {
    addNotification({
      type: 'info',
      message: 'Updating application...',
      duration: 3000,
    })
    await updateServiceWorker()
  }

  return (
    <div className="fixed bottom-4 left-4 bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">Update Available</h3>
          <p className="mt-1 text-sm opacity-90">
            A new version of Floyo is available.
          </p>
          <div className="mt-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-white text-blue-600 text-sm font-medium rounded hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
