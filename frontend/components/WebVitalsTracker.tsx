'use client'

import { useEffect } from 'react'
import { trackWebVitals } from '@/lib/webVitals'

export function WebVitalsTracker() {
  useEffect(() => {
    trackWebVitals()
  }, [])

  return null
}
