'use client';

import { useEffect } from 'react';

/**
 * Telemetry Beacon Component
 * Automatically collects and sends performance metrics to /api/telemetry
 * Lightweight, non-blocking, and privacy-respecting
 */
export function TelemetryBeacon() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Respect user privacy - check for opt-out
    const optOut = localStorage.getItem('telemetry_opt_out') === 'true';
    if (optOut) return;

    // Collect metrics after page load
    const collectMetrics = () => {
      try {
        // Get navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!navigation) return;

        // Get resource timing
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        // Get Web Vitals if available
        const getLCP = () => {
          return new Promise<number | null>((resolve) => {
            if ('PerformanceObserver' in window) {
              try {
                const observer = new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  const lastEntry = entries[entries.length - 1] as any;
                  resolve(lastEntry?.renderTime || lastEntry?.loadTime || null);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                // Resolve after 5 seconds if no LCP
                setTimeout(() => {
                  observer.disconnect();
                  resolve(null);
                }, 5000);
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        };

        const getCLS = () => {
          return new Promise<number | null>((resolve) => {
            if ('PerformanceObserver' in window) {
              try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (!(entry as any).hadRecentInput) {
                      clsValue += (entry as any).value;
                    }
                  }
                });
                observer.observe({ entryTypes: ['layout-shift'] });
                // Resolve after 5 seconds
                setTimeout(() => {
                  observer.disconnect();
                  resolve(clsValue);
                }, 5000);
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        };

        // Collect all metrics
        Promise.all([getLCP(), getCLS()]).then(([lcp, cls]) => {
          const metric = {
            url: window.location.pathname,
            ttfb: navigation.responseStart - navigation.requestStart,
            lcp: lcp,
            cls: cls,
            fid: null, // FID requires user interaction
            errors: 0, // Could be enhanced with error tracking
            userAgent: navigator.userAgent,
            connectionType: (navigator as any).connection?.effectiveType || null,
            navigationTiming: {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
            },
            resourceTiming: resources.slice(0, 20).map((r) => ({
              name: r.name,
              duration: r.duration,
              size: (r as any).transferSize || 0,
            })),
            timestamp: Date.now(),
          };

          // Send via sendBeacon (non-blocking, works even if page is unloading)
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              '/api/telemetry',
              JSON.stringify(metric)
            );
          } else {
            // Fallback to fetch if sendBeacon not available
            fetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metric),
              keepalive: true,
            }).catch(() => {
              // Silently fail - telemetry should never break the app
            });
          }
        });
      } catch (error) {
        // Silently fail - telemetry should never break the app
        console.debug('Telemetry collection failed:', error);
      }
    };

    // Collect metrics after a delay to capture LCP/CLS
    const timeout = setTimeout(collectMetrics, 3000);

    // Also collect on page unload
    window.addEventListener('beforeunload', collectMetrics);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('beforeunload', collectMetrics);
    };
  }, []);

  return null; // This component doesn't render anything
}
