/**
 * useI18n Hook
 * 
 * Migration hook for backward compatibility.
 * Wraps Zustand i18n store and next-intl.
 */

import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useI18nStore } from '@/lib/store';

export function useI18n() {
  const locale = useLocale();
  const t = useTranslations();
  const { isRTL, setLocale } = useI18nStore();
  
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  
  return {
    locale,
    isRTL,
    t,
  };
}
