/**
 * useNotifications Hook
 * 
 * Migration hook for backward compatibility.
 * Wraps Zustand notification store.
 */

import { useNotificationStore } from '@/lib/store';

export function useNotifications() {
  const { notifications, addNotification, removeNotification, clearAll } = useNotificationStore();
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}
