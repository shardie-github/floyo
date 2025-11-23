/**
 * useTheme Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from '@/lib/store';
import { useTheme } from '@/hooks/useTheme';

jest.mock('@/lib/store');

describe('useTheme', () => {
  const mockSetTheme = jest.fn();
  const mockInitializeTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useThemeStore as jest.Mock).mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
      initializeTheme: mockInitializeTheme,
    });
  });

  it('returns theme from store', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('calls initializeTheme on mount', () => {
    renderHook(() => useTheme());
    expect(mockInitializeTheme).toHaveBeenCalled();
  });

  it('provides setTheme function', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});
