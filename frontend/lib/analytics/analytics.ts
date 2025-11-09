/**
 * Analytics Service
 * 
 * Comprehensive analytics tracking for user behavior, conversions, and engagement.
 * Taps into: "I want to understand my users"
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

  constructor() {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30 * 1000);
  }

  /**
   * Track event
   */
  track(event: AnalyticsEvent): void {
    this.events.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    // Flush immediately for important events
    if (event.name.startsWith('conversion_') || event.name.startsWith('error_')) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  pageView(path: string, properties?: Record<string, unknown>): void {
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

// Setup unload flush
if (typeof window !== 'undefined') {
  analytics.setupUnloadFlush();
}
