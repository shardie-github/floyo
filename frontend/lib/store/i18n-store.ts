/**
 * I18n Store (Zustand)
 * 
 * Manages internationalization state.
 * Works alongside next-intl for RTL support.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { isRTL } from '@/lib/i18n';

interface I18nState {
  locale: string;
  isRTL: boolean;
  setLocale: (locale: string) => void;
}

const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export const useI18nStore = create<I18nState>()(
  devtools(
    persist(
      (set) => ({
        locale: 'en',
        isRTL: false,
        
        setLocale: (locale: string) => {
          const rtl = isRTL(locale) || RTL_LOCALES.includes(locale);
          set({ locale, isRTL: rtl });
          
          // Update document attributes
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
            document.documentElement.setAttribute('lang', locale);
          }
        },
      }),
      {
        name: 'floyo-i18n-store',
        partialize: (state) => ({ locale: state.locale }),
      }
    ),
    { name: 'I18nStore' }
  )
);
