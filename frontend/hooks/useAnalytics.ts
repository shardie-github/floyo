/**
 * React hook for analytics tracking
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics, trackEvent, AnalyticsEvent } from '@/lib/analytics';

export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    analytics.page(pathname);
  }, [pathname]);

  return {
    track: trackEvent,
    identify: analytics.identify.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
  };
}

/**
 * Hook to track activation events
 */
export function useActivationTracking() {
  const trackActivation = (activationType: string, properties?: Record<string, any>) => {
    // Get user ID from auth context or local storage
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    if (userId) {
      analytics.track('user_activated', {
        activation_type: activationType,
        user_id: userId,
        ...properties,
      });

      // Mark user as activated
      analytics.setUserProperties({ activated: true, activated_at: new Date().toISOString() });
    }
  };

  return { trackActivation };
}

/**
 * Track onboarding progress
 */
export function useOnboardingTracking() {
  const trackOnboardingStart = () => {
    analytics.track('onboarding_started');
  };

  const trackOnboardingComplete = () => {
    analytics.track('onboarding_completed');
  };

  const trackTutorialStep = (step: number, stepName: string) => {
    analytics.track('tutorial_step_completed', {
      step,
      step_name: stepName,
    });
  };

  return {
    trackOnboardingStart,
    trackOnboardingComplete,
    trackTutorialStep,
  };
}
