/**
 * A/B Testing Utilities
 * 
 * Conversion rate optimization with A/B testing support.
 */

import { useConsentStore } from '@/lib/store';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  active: boolean;
}

/**
 * Get user's variant for an A/B test
 */
export function getABTestVariant(testId: string, userId?: string): string {
  // Use consistent hashing based on test ID and user ID
  const seed = `${testId}-${userId || 'anonymous'}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Normalize to 0-100
  const normalized = Math.abs(hash) % 100;
  
  // Return variant based on weight distribution
  // This is a simplified version - in production, use proper test configuration
  return normalized < 50 ? 'control' : 'variant';
}

/**
 * Track conversion event
 */
export function trackConversion(eventName: string, properties?: Record<string, any>) {
  const { consent } = useConsentStore.getState();
  
  if (!consent.analytics) {
    return;
  }
  
  // Track conversion event
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(eventName, {
      ...properties,
      conversion: true,
    });
  }
}

/**
 * Track funnel step
 */
export function trackFunnelStep(step: string, stepNumber: number, properties?: Record<string, any>) {
  trackConversion('funnel_step', {
    step,
    step_number: stepNumber,
    ...properties,
  });
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(conversions: number, visitors: number): number {
  if (visitors === 0) return 0;
  return (conversions / visitors) * 100;
}
