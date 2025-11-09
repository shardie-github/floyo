/**
 * Caching Layer
 * 
 * In-memory cache with TTL support.
 * Upgrade to Redis for production multi-instance deployments.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt < now) {
          this.store.delete(key);
        }
      }
    }, 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get or set with async factory
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
export const cache = new Cache();

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  gamificationStats: (userId: string) => `gamification:stats:${userId}`,
  insights: (userId: string) => `insights:${userId}`,
  comparison: (userId: string) => `comparison:${userId}`,
  privacyScore: (userId: string) => `privacy:score:${userId}`,
  timeMetrics: (userId: string) => `time:metrics:${userId}`,
  flags: () => 'flags:all',
  metrics: (hours: number) => `metrics:${hours}h`,
};

/**
 * Cache TTLs (in milliseconds)
 */
export const CACHE_TTL = {
  short: 60 * 1000, // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes
  long: 15 * 60 * 1000, // 15 minutes
  veryLong: 60 * 60 * 1000, // 1 hour
};
