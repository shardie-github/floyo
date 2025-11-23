/**
 * Store Exports
 * 
 * Centralized exports for all Zustand stores.
 */

export { useAppStore } from './app-store';
export { useDashboardStore } from './dashboard-store';
export { useNotificationStore } from './notification-store';
export { useThemeStore } from './theme-store';
export { useI18nStore } from './i18n-store';
export { useConsentStore } from './consent-store';
export { useOnboardingStore } from './onboarding-store';

// Re-export types
export type { AppState } from './app-store';
export type { DashboardState } from './dashboard-store';
export type { Notification } from './notification-store';
export type { Theme, ResolvedTheme } from './theme-store';
export type { Consent, ConsentStatus } from './consent-store';
export type { OnboardingStep } from './onboarding-store';
