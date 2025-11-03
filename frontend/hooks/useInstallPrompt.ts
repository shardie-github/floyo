import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches
    
    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setInstallPrompt(promptEvent)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if app can be installed (for browsers that don't fire the event)
    const checkCanInstall = () => {
      // This is a heuristic - if service worker is registered, app might be installable
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          // App is likely installable if service worker is active
          if (!isStandalone && !isInWebAppiOS) {
            setCanInstall(true)
          }
        })
      }
    }

    checkCanInstall()

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const promptInstall = async (): Promise<boolean> => {
    if (!installPrompt) {
      // Fallback for browsers without beforeinstallprompt
      // Show instructions
      if (typeof window !== 'undefined') {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isAndroid = /Android/.test(navigator.userAgent)
        
        if (isIOS) {
          alert('To install: Tap the share button and select "Add to Home Screen"')
        } else if (isAndroid) {
          alert('To install: Tap the menu (?) and select "Install app" or "Add to Home screen"')
        } else {
          alert('To install: Use your browser\'s menu to add this site to your home screen')
        }
      }
      return false
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setInstallPrompt(null)
        setIsInstalled(true)
        setCanInstall(false)
        return true
      }

      return false
    } catch (error) {
      console.error('Error prompting install:', error)
      return false
    }
  }

  return { 
    installPrompt, 
    isInstalled, 
    canInstall: canInstall || installPrompt !== null,
    promptInstall 
  }
}
