/**
 * Main Application Store (Zustand)
 * 
 * Centralized state management for the application.
 * Replaces Context API usage with Zustand for better performance and developer experience.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  // User state
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
  } | null;
  
  // UI state
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
  }>;
  
  // Tracking state
  trackingEnabled: boolean;
  lastEventTimestamp: Date | null;
  
  // Actions
  setUser: (user: AppState['user']) => void;
  setTheme: (theme: AppState['theme']) => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setTrackingEnabled: (enabled: boolean) => void;
  setLastEventTimestamp: (timestamp: Date) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  theme: 'system' as const,
  sidebarOpen: true,
  notifications: [],
  trackingEnabled: true,
  lastEventTimestamp: null,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        setUser: (user) => set({ user }),
        
        setTheme: (theme) => set({ theme }),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              ...state.notifications,
              {
                ...notification,
                id: crypto.randomUUID(),
                timestamp: new Date(),
              },
            ],
          })),
        
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
        
        setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),
        
        setLastEventTimestamp: (timestamp) => set({ lastEventTimestamp: timestamp }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'floyo-app-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          trackingEnabled: state.trackingEnabled,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
