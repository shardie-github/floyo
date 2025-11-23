/**
 * State Management Integration Tests
 * 
 * Tests Zustand stores working together.
 */

import { renderHook, act } from '@testing-library/react';
import { useAppStore, useNotificationStore, useThemeStore } from '@/lib/store';

describe('State Management Integration', () => {
  beforeEach(() => {
    // Reset stores
    useAppStore.getState().reset();
    useNotificationStore.getState().clearAll();
  });

  it('should update theme and persist', () => {
    const { result } = renderHook(() => useThemeStore());
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should add notification and remove it', () => {
    const { result } = renderHook(() => useNotificationStore());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Test',
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      result.current.removeNotification(result.current.notifications[0].id);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('should update app state and notifications together', () => {
    const appHook = renderHook(() => useAppStore());
    const notificationHook = renderHook(() => useNotificationStore());
    
    act(() => {
      appHook.result.current.setTrackingEnabled(true);
      notificationHook.result.current.addNotification({
        type: 'info',
        message: 'Tracking enabled',
      });
    });
    
    expect(appHook.result.current.trackingEnabled).toBe(true);
    expect(notificationHook.result.current.notifications).toHaveLength(1);
  });
});
