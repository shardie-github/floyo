'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

/**
 * Mobile-optimized container that adapts to screen size
 */
export function MobileContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile()
  
  return (
    <div className={`${isMobile ? 'px-2' : 'px-4'} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Touch-friendly button for mobile
 */
export function TouchButton({ 
  children, 
  onClick, 
  className = '',
  disabled = false 
}: { 
  children: React.ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        min-h-[44px] min-w-[44px] px-4 py-2
        touch-manipulation
        active:scale-95 transition-transform
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  )
}

/**
 * Swipeable container for mobile gestures
 */
export function SwipeableContainer({ 
  children,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}) {
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`touch-pan-y ${className}`}
    >
      {children}
    </div>
  )
}
