/**
 * Internationalization provider component.
 * Handles RTL support and language switching.
 */

'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isRTL } from '../lib/i18n';

interface I18nContextType {
  locale: string;
  isRTL: boolean;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = useTranslations();
  const rtl = isRTL(locale as any);

  useEffect(() => {
    // Set document direction for RTL support
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale, rtl]);

  return (
    <I18nContext.Provider value={{ locale, isRTL: rtl, t }}>
      <div dir={rtl ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
