'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useI18nStore } from '@/lib/store';

/**
 * I18n Initializer Component
 * 
 * Initializes i18n on mount.
 * Should be placed in root layout.
 */
export function I18nInitializer() {
  const locale = useLocale();
  const { setLocale } = useI18nStore();
  
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  
  return null;
}
