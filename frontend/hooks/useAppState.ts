/**
 * App State Hook
 * 
 * Convenience hook for accessing app store.
 * Replaces Context API usage.
 */

import { useAppStore } from '@/lib/store/app-store';

/**
 * Hook to access app state and actions.
 */
export function useAppState() {
  const store = useAppStore();
  
  return {
    // State
    user: store.user,
    theme: store.theme,
    sidebarOpen: store.sidebarOpen,
    notifications: store.notifications,
    trackingEnabled: store.trackingEnabled,
    lastEventTimestamp: store.lastEventTimestamp,
    
    // Actions
    setUser: store.setUser,
    setTheme: store.setTheme,
    setSidebarOpen: store.setSidebarOpen,
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    setTrackingEnabled: store.setTrackingEnabled,
    setLastEventTimestamp: store.setLastEventTimestamp,
    reset: store.reset,
  };
}
