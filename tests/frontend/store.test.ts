/**
 * Tests for Zustand Stores
 */

import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '@/lib/store/app-store';
import { useDashboardStore } from '@/lib/store/dashboard-store';

describe('AppStore', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAppStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.theme).toBe('system');
    expect(result.current.sidebarOpen).toBe(true);
    expect(result.current.trackingEnabled).toBe(true);
  });
  
  it('should update user', () => {
    const { result } = renderHook(() => useAppStore());
    
    act(() => {
      result.current.setUser({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
    
    expect(result.current.user?.id).toBe('user-1');
    expect(result.current.user?.email).toBe('test@example.com');
  });
  
  it('should add and remove notifications', () => {
    const { result } = renderHook(() => useAppStore());
    
    act(() => {
      result.current.addNotification({
        message: 'Test notification',
        type: 'info',
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Test notification');
    
    const notificationId = result.current.notifications[0].id;
    
    act(() => {
      result.current.removeNotification(notificationId);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });
});

describe('DashboardStore', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    expect(result.current.insights).toEqual([]);
    expect(result.current.patterns).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.loading).toBe(false);
  });
  
  it('should update insights', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    const insights = [
      {
        id: '1',
        type: 'pattern',
        title: 'Test Insight',
        description: 'Test description',
        priority: 'high' as const,
      },
    ];
    
    act(() => {
      result.current.setInsights(insights);
    });
    
    expect(result.current.insights).toEqual(insights);
  });
  
  it('should handle loading state', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.loading).toBe(true);
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.loading).toBe(false);
  });
});
