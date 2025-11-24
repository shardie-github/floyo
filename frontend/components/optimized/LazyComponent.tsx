/**
 * Lazy Component Wrapper
 * 
 * Utility for lazy loading components with Suspense fallback.
 */

'use client';

import React, { Suspense, ComponentType, lazy } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LazyComponentProps {
  fallback?: React.ReactNode;
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: React.ComponentPropsWithoutRef<T> & LazyComponentProps) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
