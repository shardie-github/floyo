/**
 * Cookie and Indirect Input Tracker
 * 
 * Tracks cookies, referrers, UTM parameters, and other indirect inputs
 * to inform workflow model building.
 */

interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

interface IndirectInputData {
  cookies: CookieData[];
  referrers: Array<{
    url: string;
    domain: string;
    timestamp: number;
  }>;
  utm_params: Record<string, string>;
  query_params: Record<string, string>;
  localStorage_keys: string[];
  sessionStorage_keys: string[];
  timestamp: number;
}

class CookieTracker {
  private trackedData: IndirectInputData[] = [];
  private isTracking: boolean = false;

  /**
   * Start tracking cookies and indirect inputs
   */
  startTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    // Track initial state
    this.captureIndirectInputs();

    // Track changes periodically
    setInterval(() => {
      this.captureIndirectInputs();
    }, 30000); // Every 30 seconds

    // Track on navigation
    window.addEventListener('beforeunload', () => {
      this.captureIndirectInputs();
      this.flushData();
    });
  }

  /**
   * Stop tracking
   */
  stopTracking(): void {
    this.isTracking = false;
  }

  /**
   * Capture all indirect inputs
   */
  captureIndirectInputs(): IndirectInputData {
    const data: IndirectInputData = {
      cookies: this.captureCookies(),
      referrers: this.captureReferrers(),
      utm_params: this.captureUTMParams(),
      query_params: this.captureQueryParams(),
      localStorage_keys: this.captureLocalStorageKeys(),
      sessionStorage_keys: this.captureSessionStorageKeys(),
      timestamp: Date.now(),
    };

    this.trackedData.push(data);

    // Keep only last 100 captures
    if (this.trackedData.length > 100) {
      this.trackedData.shift();
    }

    return data;
  }

  /**
   * Capture cookies
   */
  private captureCookies(): CookieData[] {
    const cookies: CookieData[] = [];

    if (typeof document === 'undefined') {
      return cookies;
    }

    const cookieString = document.cookie;
    if (!cookieString) {
      return cookies;
    }

    const cookiePairs = cookieString.split(';');

    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split('=');
      if (name && value) {
        // Try to get cookie attributes (limited by browser security)
        cookies.push({
          name: decodeURIComponent(name),
          value: decodeURIComponent(value),
          domain: window.location.hostname,
          path: '/',
          secure: window.location.protocol === 'https:',
          httpOnly: false, // Cannot detect httpOnly from JavaScript
          sameSite: undefined, // Cannot detect sameSite from JavaScript
        });
      }
    }

    return cookies;
  }

  /**
   * Capture referrers
   */
  private captureReferrers(): Array<{ url: string; domain: string; timestamp: number }> {
    const referrers: Array<{ url: string; domain: string; timestamp: number }> = [];

    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        referrers.push({
          url: document.referrer,
          domain: referrerUrl.hostname,
          timestamp: Date.now(),
        });
      } catch (e) {
        // Invalid URL
      }
    }

    return referrers;
  }

  /**
   * Capture UTM parameters
   */
  private captureUTMParams(): Record<string, string> {
    const utmParams: Record<string, string> = {};

    if (typeof window === 'undefined') {
      return utmParams;
    }

    const urlParams = new URLSearchParams(window.location.search);

    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith('utm_')) {
        utmParams[key] = value;
      }
    }

    return utmParams;
  }

  /**
   * Capture query parameters
   */
  private captureQueryParams(): Record<string, string> {
    const queryParams: Record<string, string> = {};

    if (typeof window === 'undefined') {
      return queryParams;
    }

    const urlParams = new URLSearchParams(window.location.search);

    for (const [key, value] of urlParams.entries()) {
      queryParams[key] = value;
    }

    return queryParams;
  }

  /**
   * Capture localStorage keys (without values for privacy)
   */
  private captureLocalStorageKeys(): string[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      return Object.keys(localStorage);
    } catch (e) {
      return [];
    }
  }

  /**
   * Capture sessionStorage keys (without values for privacy)
   */
  private captureSessionStorageKeys(): string[] {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return [];
    }

    try {
      return Object.keys(sessionStorage);
    } catch (e) {
      return [];
    }
  }

  /**
   * Get tracked data
   */
  getTrackedData(): IndirectInputData[] {
    return [...this.trackedData];
  }

  /**
   * Flush data to server
   */
  async flushData(): Promise<void> {
    if (this.trackedData.length === 0) return;

    const dataToSend = [...this.trackedData];
    this.trackedData = [];

    try {
      await fetch('/api/telemetry/indirect-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: dataToSend,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send indirect input data:', error);
      // Re-add data if send failed
      this.trackedData.unshift(...dataToSend);
    }
  }
}

// Singleton instance
let trackerInstance: CookieTracker | null = null;

export function getCookieTracker(): CookieTracker {
  if (!trackerInstance) {
    trackerInstance = new CookieTracker();
  }
  return trackerInstance;
}

export function startCookieTracking(): void {
  const tracker = getCookieTracker();
  tracker.startTracking();
}

export type { CookieData, IndirectInputData };
