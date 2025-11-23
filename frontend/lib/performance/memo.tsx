/**
 * Performance Utilities
 * 
 * React.memo wrappers and performance optimization helpers.
 */

import React from 'react';

/**
 * Memo wrapper with display name for better debugging
 */
export function memoWithDisplayName<P extends object>(
  Component: React.ComponentType<P>,
  displayName: string,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = React.memo(Component, areEqual);
  MemoizedComponent.displayName = displayName;
  return MemoizedComponent;
}

/**
 * Shallow comparison for React.memo
 */
export function shallowEqual<T extends object>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i] as keyof T;
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
}
