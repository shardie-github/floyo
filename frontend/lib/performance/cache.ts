/**
 * Performance Cache Utilities
 * 
 * Provides caching strategies for API calls, computed values, and static data.
 * Includes TTL management, cache invalidation, and memory-efficient storage.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  keyPrefix?: string // Prefix for cache keys
}

class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private maxSize: number
  private defaultTTL: number
  private keyPrefix: string

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // 5 minutes default
    this.keyPrefix = options.keyPrefix || ''
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const fullKey = this.getFullKey(key)
    const entry = this.cache.get(fullKey)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey)
      return null
    }

    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const fullKey = this.getFullKey(key)
    const expiresAt = Date.now() + (ttl || this.defaultTTL)

    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
      this.evictOldest()
    }

    this.cache.set(fullKey, {
      value,
      expiresAt,
      createdAt: Date.now(),
    })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    const fullKey = this.getFullKey(key)
    this.cache.delete(fullKey)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.clearExpired()
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
    }
  }

  private getFullKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

/**
 * Global cache instances
 */
export const apiCache = new MemoryCache<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  keyPrefix: 'api',
})

export const computedCache = new MemoryCache<any>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
  keyPrefix: 'computed',
})

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: CacheOptions
): T {
  const cache = new MemoryCache(options || { ttl: 5 * 60 * 1000 })

  return (async (...args: any[]) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)

    if (cached !== null) {
      return cached
    }

    const result = await fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Cache with TTL helper
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = apiCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const result = await fn()
  apiCache.set(key, result, ttl)
  return result
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern: string): void {
  // Simple implementation - clear all if pattern matches prefix
  if (pattern.includes('*')) {
    apiCache.clear()
  } else {
    apiCache.delete(pattern)
  }
}
