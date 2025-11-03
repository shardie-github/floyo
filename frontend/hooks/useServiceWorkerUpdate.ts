import { useState, useEffect } from 'react'

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    let refreshing = false

    // Check for service worker updates
    const checkForUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready

        // Listen for update found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              setUpdateAvailable(true)
            }
          })
        })

        // Check for existing updates
        await registration.update()
      } catch (error) {
        console.error('Error checking for service worker update:', error)
      }
    }

    // Listen for controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })

    checkForUpdate()

    // Check periodically
    const interval = setInterval(checkForUpdate, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const updateServiceWorker = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    try {
      setIsUpdating(true)
      const registration = await navigator.serviceWorker.ready

      if (registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      // The controllerchange event will trigger a reload
    } catch (error) {
      console.error('Error updating service worker:', error)
      setIsUpdating(false)
    }
  }

  return { updateAvailable, isUpdating, updateServiceWorker }
}
