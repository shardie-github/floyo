/**
 * useConsent Hook
 * 
 * Migration hook for backward compatibility.
 * Wraps Zustand consent store.
 */

import { useEffect } from 'react';
import { useConsentStore } from '@/lib/store';

export function useConsent() {
  const { consent, status, setConsent, hasInitialized, initialize } = useConsentStore();
  
  useEffect(() => {
    if (!hasInitialized) {
      initialize();
    }
  }, [hasInitialized, initialize]);
  
  return {
    consent,
    status,
    setConsent,
    hasInitialized,
  };
}
