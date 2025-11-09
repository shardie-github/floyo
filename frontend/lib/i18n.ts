// i18n configuration for next-intl
export const locales = ['en', 'ar', 'fa', 'he'] as const;
export const defaultLocale = 'en' as const;
export type Locale = typeof locales[number];
