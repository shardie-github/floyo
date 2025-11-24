/**
 * Notification Store (Zustand)
 * 
 * Manages application-wide notifications/toasts.
 * Replaces NotificationProvider Context.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: Date;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification) => {
        const id = crypto.randomUUID();
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date(),
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
        
        // Auto-remove after duration
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },
      
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'NotificationStore' }
  )
);
