/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse and DoS attacks.
 * Uses in-memory store (upgrade to Redis for production).
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetAt < now) {
          delete this.store[key];
        }
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const key = identifier;
    const entry = this.store[key];

    if (!entry || entry.resetAt < now) {
      // Create new window
      this.store[key] = {
        count: 1,
        resetAt: now + windowMs,
      };
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Get rate limit info without incrementing
   */
  getInfo(identifier: string, limit: number, windowMs: number): {
    remaining: number;
    resetAt: number;
  } {
    const entry = this.store[identifier];
    if (!entry || entry.resetAt < Date.now()) {
      return {
        remaining: limit,
        resetAt: Date.now() + windowMs,
      };
    }
    return {
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.resetAt,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configuration per endpoint
 */
export const RATE_LIMITS = {
  '/api/privacy/export': { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  '/api/privacy/telemetry': { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
  '/api/metrics': { limit: 60, windowMs: 60 * 1000 }, // 60 per minute
  '/api/gamification/stats': { limit: 30, windowMs: 60 * 1000 }, // 30 per minute
  '/api/insights': { limit: 20, windowMs: 60 * 1000 }, // 20 per minute
  default: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute default
};

/**
 * Get rate limit config for endpoint
 */
function getRateLimitConfig(pathname: string) {
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  return RATE_LIMITS.default;
}

/**
 * Create rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get user ID first
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // In production, extract user ID from JWT
    return `user:${authHeader.substring(0, 20)}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limit middleware
 */
export function rateLimit(request: Request): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  headers: Headers;
} {
  const url = new URL(request.url);
  const config = getRateLimitConfig(url.pathname);
  const identifier = getRateLimitIdentifier(request);

  const result = rateLimiter.check(identifier, config.limit, config.windowMs);

  const headers = new Headers();
  headers.set('X-RateLimit-Limit', config.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

  if (!result.allowed) {
    headers.set('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000).toString());
  }

  return {
    ...result,
    headers,
  };
}
