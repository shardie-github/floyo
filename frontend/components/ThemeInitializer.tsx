'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

/**
 * Theme Initializer Component
 * 
 * Initializes theme on mount.
 * Should be placed in root layout.
 */
export function ThemeInitializer() {
  const { initializeTheme } = useThemeStore();
  
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);
  
  return null;
}
