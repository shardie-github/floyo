/**
 * useNotifications Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useNotificationStore } from '@/lib/store';
import { useNotifications } from '@/hooks/useNotifications';

jest.mock('@/lib/store');

describe('useNotifications', () => {
  const mockAddNotification = jest.fn();
  const mockRemoveNotification = jest.fn();
  const mockClearAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotificationStore as jest.Mock).mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: mockRemoveNotification,
      clearAll: mockClearAll,
    });
  });

  it('returns notifications from store', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
  });

  it('provides addNotification function', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Test',
      });
    });
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'success',
      message: 'Test',
    });
  });

  it('provides removeNotification function', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => {
      result.current.removeNotification('test-id');
    });
    expect(mockRemoveNotification).toHaveBeenCalledWith('test-id');
  });

  it('provides clearAll function', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => {
      result.current.clearAll();
    });
    expect(mockClearAll).toHaveBeenCalled();
  });
});
