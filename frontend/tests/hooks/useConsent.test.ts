/**
 * useConsent Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useConsentStore } from '@/lib/store';
import { useConsent } from '@/hooks/useConsent';

jest.mock('@/lib/store');

describe('useConsent', () => {
  const mockSetConsent = jest.fn();
  const mockInitialize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useConsentStore as jest.Mock).mockReturnValue({
      consent: {
        analytics: false,
        marketing: false,
        functional: true,
      },
      status: 'pending',
      setConsent: mockSetConsent,
      hasInitialized: false,
      initialize: mockInitialize,
    });
  });

  it('returns consent from store', () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toEqual({
      analytics: false,
      marketing: false,
      functional: true,
    });
  });

  it('calls initialize if not initialized', () => {
    renderHook(() => useConsent());
    expect(mockInitialize).toHaveBeenCalled();
  });

  it('provides setConsent function', () => {
    const { result } = renderHook(() => useConsent());
    act(() => {
      result.current.setConsent({
        analytics: true,
        marketing: true,
        functional: true,
      });
    });
    expect(mockSetConsent).toHaveBeenCalledWith({
      analytics: true,
      marketing: true,
      functional: true,
    });
  });
});
