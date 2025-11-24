/**
 * Theme Store (Zustand)
 * 
 * Manages application theme (light/dark/system).
 * Replaces ThemeProvider Context.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

const applyTheme = (theme: ResolvedTheme) => {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'system',
        resolvedTheme: 'light',
        
        setTheme: (theme) => {
          const resolved = resolveTheme(theme);
          set({ theme, resolvedTheme: resolved });
          applyTheme(resolved);
          
          // Listen for system theme changes if using system theme
          if (theme === 'system' && typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => {
              const newResolved = getSystemTheme();
              set({ resolvedTheme: newResolved });
              applyTheme(newResolved);
            };
            mediaQuery.addEventListener('change', handler);
          }
        },
        
        initializeTheme: () => {
          const { theme } = get();
          const resolved = resolveTheme(theme);
          set({ resolvedTheme: resolved });
          applyTheme(resolved);
          
          // Set up system theme listener if needed
          if (theme === 'system' && typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => {
              const newResolved = getSystemTheme();
              set({ resolvedTheme: newResolved });
              applyTheme(newResolved);
            };
            mediaQuery.addEventListener('change', handler);
          }
        },
      }),
      {
        name: 'floyo-theme-store',
        partialize: (state) => ({ theme: state.theme }),
      }
    ),
    { name: 'ThemeStore' }
  )
);
