/**
 * useTheme Hook
 * 
 * Migration hook for backward compatibility.
 * Wraps Zustand theme store.
 */

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

export function useTheme() {
  const { theme, resolvedTheme, setTheme, initializeTheme } = useThemeStore();
  
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);
  
  return {
    theme,
    setTheme,
    resolvedTheme,
  };
}
