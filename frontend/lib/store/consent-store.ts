/**
 * Consent Store (Zustand)
 * 
 * Manages user privacy consent preferences.
 * Replaces ConsentProvider Context.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Consent = {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
};

export type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'customized';

interface ConsentState {
  consent: Consent;
  status: ConsentStatus;
  hasInitialized: boolean;
  setConsent: (consent: Consent) => void;
  initialize: () => void;
}

const defaultConsent: Consent = {
  analytics: false,
  marketing: false,
  functional: true,
};

const getConsentStatus = (consent: Consent, initialized: boolean): ConsentStatus => {
  if (!initialized) return 'pending';
  if (consent.analytics && consent.marketing) return 'accepted';
  if (!consent.analytics && !consent.marketing) return 'rejected';
  return 'customized';
};

export const useConsentStore = create<ConsentState>()(
  devtools(
    persist(
      (set, get) => ({
        consent: defaultConsent,
        status: 'pending',
        hasInitialized: false,
        
        setConsent: (consent) => {
          const status = getConsentStatus(consent, true);
          set({ consent, status });
          
          // Dispatch event for integrations
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('consentChanged', { detail: consent })
            );
          }
        },
        
        initialize: () => {
          const { consent } = get();
          const status = getConsentStatus(consent, true);
          set({ hasInitialized: true, status });
        },
      }),
      {
        name: 'privacy_choices_v2',
        partialize: (state) => ({ consent: state.consent }),
      }
    ),
    { name: 'ConsentStore' }
  )
);

// Listen for storage changes from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'privacy_choices_v2' && e.newValue) {
      try {
        const consent = JSON.parse(e.newValue) as Consent;
        useConsentStore.getState().setConsent(consent);
      } catch (error) {
        console.warn('Failed to parse consent from storage event', error);
      }
    }
  });
}
