/**
 * Redis Caching Layer
 * 
 * Provides caching for:
 * - API responses
 * - Database queries
 * - Computed values
 */

import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0'
    redisClient = createClient({ url: redisUrl })
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })
    
    redisClient.connect().catch(console.error)
  }
  
  return redisClient
}

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  key: string
}

/**
 * Cache a value in Redis
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = 3600 // Default 1 hour
): Promise<void> {
  try {
    const client = getRedisClient()
    const serialized = JSON.stringify(value)
    await client.setEx(key, ttl, serialized)
  } catch (error) {
    console.error('Cache set error:', error)
    // Fail silently - caching is non-critical
  }
}

/**
 * Get a cached value from Redis
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient()
    const cached = await client.get(key)
    if (!cached) return null
    return JSON.parse(cached) as T
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Delete a cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const client = getRedisClient()
    await client.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Cache with automatic key generation
 */
export async function cached<T>(
  fn: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const cached = await cacheGet<T>(options.key)
  if (cached !== null) {
    return cached
  }
  
  const result = await fn()
  await cacheSet(options.key, result, options.ttl)
  return result
}

/**
 * Invalidate cache by pattern
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient()
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
  } catch (error) {
    console.error('Cache invalidate error:', error)
  }
}
