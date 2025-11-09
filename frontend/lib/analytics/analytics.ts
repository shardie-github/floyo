/**
 * Analytics Service
 * 
 * Comprehensive analytics tracking for user behavior, conversions, and engagement.
 * Integrates with PostHog for production analytics.
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp?: string;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private posthog: any = null;
  private userId: string | null = null;
  private initialized = false;

  constructor() {
    // Initialize PostHog if available
    if (typeof window !== 'undefined') {
      this.initPostHog();
    }

    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30 * 1000);
  }

  /**
   * Initialize PostHog integration
   */
  private initPostHog(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // PostHog is loaded via PostHogProvider component
      // We'll access it via window.posthog if available
      if ((window as any).posthog) {
        this.posthog = (window as any).posthog;
        this.initialized = true;
      }
    } catch (error) {
      console.warn('PostHog not available:', error);
    }
  }

  /**
   * Initialize analytics (called by provider)
   */
  init(): void {
    this.initPostHog();
  }

  /**
   * Identify user
   */
  identify(userId: string, properties?: Record<string, unknown>): void {
    this.userId = userId;
    
    if (this.posthog) {
      this.posthog.identify(userId, properties);
    }

    // Also track in our backend
    this.track({
      name: 'user_identified',
      userId,
      properties,
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, unknown>): void {
    if (this.posthog && this.userId) {
      this.posthog.setPersonProperties(properties);
    }

    // Track in backend
    this.track({
      name: 'user_properties_set',
      userId: this.userId || undefined,
      properties,
    });
  }

  /**
   * Track event
   */
  track(event: AnalyticsEvent): void {
    const eventData = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      userId: event.userId || this.userId || undefined,
    };

    // Track in PostHog
    if (this.posthog) {
      this.posthog.capture(event.name, {
        ...eventData.properties,
        timestamp: eventData.timestamp,
      });
    }

    // Also queue for backend
    this.events.push(eventData);

    // Flush immediately for important events
    if (
      event.name.startsWith('conversion_') ||
      event.name.startsWith('error_') ||
      event.name === 'user_activated' ||
      event.name === 'workflow_created' ||
      event.name === 'subscription_created'
    ) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  pageView(path: string, properties?: Record<string, unknown>): void {
    if (this.posthog) {
      this.posthog.capture('$pageview', {
        $current_url: path,
        ...properties,
      });
    }

    this.track({
      name: 'page_view',
      properties: {
        path,
        ...properties,
      },
    });
  }

  /**
   * Track conversion
   */
  conversion(type: string, value?: number, properties?: Record<string, unknown>): void {
    this.track({
      name: `conversion_${type}`,
      properties: {
        value,
        ...properties,
      },
    });
  }

  /**
   * Track activation (first workflow created)
   */
  trackActivation(activationType: string, properties?: Record<string, unknown>): void {
    this.track({
      name: 'user_activated',
      properties: {
        activation_type: activationType,
        activated_at: new Date().toISOString(),
        ...properties,
      },
    });

    // Set user property
    this.setUserProperties({
      activated: true,
      activated_at: new Date().toISOString(),
      activation_type: activationType,
    });
  }

  /**
   * Track engagement
   */
  engagement(action: string, properties?: Record<string, unknown>): void {
    this.track({
      name: `engagement_${action}`,
      properties,
    });
  }

  /**
   * Track error
   */
  error(error: Error, context?: Record<string, unknown>): void {
    this.track({
      name: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        ...context,
      },
    });
  }

  /**
   * Track retention cohort
   */
  trackRetentionCohort(cohortDay: number, properties?: Record<string, unknown>): void {
    this.track({
      name: `retention_cohort_${cohortDay}`,
      properties: {
        cohort_day: cohortDay,
        ...properties,
      },
    });
  }

  /**
   * Flush events to backend
   */
  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error) {
      // Re-add events if flush failed
      this.events.unshift(...eventsToSend);
      console.error('Failed to flush analytics:', error);
    }
  }

  /**
   * Flush on page unload
   */
  setupUnloadFlush(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable delivery
      if (this.events.length > 0) {
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({ events: this.events })
        );
      }
    });
  }

  destroy() {
    clearInterval(this.flushInterval);
    this.flush();
  }
}

export const analytics = new AnalyticsService();

// Helper function for tracking events
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  analytics.track({ name, properties });
}

// Setup unload flush
if (typeof window !== 'undefined') {
  analytics.setupUnloadFlush();
}
