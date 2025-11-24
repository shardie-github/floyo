/**
 * Performance Optimizations
 * 
 * Utilities and configurations for optimizing React performance.
 */

import React, { ComponentType } from 'react';
import { memoWithDisplayName, shallowEqual } from './memo';

/**
 * Optimize component with React.memo and display name
 */
export function optimizeComponent<P extends object>(
  Component: ComponentType<P>,
  displayName: string,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memoWithDisplayName(Component, displayName, areEqual || shallowEqual);
}

/**
 * Lazy load component with Suspense boundary
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return React.lazy(importFunc);
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
