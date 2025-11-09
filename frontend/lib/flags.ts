/**
 * Feature Flags System
 * 
 * Manages feature flags including canary deployments.
 */

interface CanaryConfig {
  enabled: boolean;
  trafficPercentage: number; // 0-100
  stopLossThresholds: {
    errorRate: number; // 0-1
    p95LatencyMs: number;
    rollbackOnBreach: boolean;
  };
  shadowTraffic: boolean;
  channels: {
    web: 'preview' | 'production';
    mobile: 'preview' | 'production';
  };
}

interface FeatureFlags {
  canary?: {
    [module: string]: CanaryConfig;
  };
}

let cachedFlags: FeatureFlags | null = null;
let flagsCacheTime = 0;
const FLAGS_CACHE_TTL = 60000; // 1 minute

/**
 * Load feature flags (with caching)
 */
async function loadFeatureFlags(): Promise<FeatureFlags> {
  const now = Date.now();
  if (cachedFlags && now - flagsCacheTime < FLAGS_CACHE_TTL) {
    return cachedFlags;
  }

  try {
    // In production, load from API or config file
    if (process.env.NODE_ENV === 'production') {
      const response = await fetch('/api/flags', { cache: 'no-store' });
      if (response.ok) {
        cachedFlags = await response.json();
        flagsCacheTime = now;
        return cachedFlags!;
      }
    }

    // Fallback to default config
    cachedFlags = {
      canary: {
        checkout: {
          enabled: process.env.CANARY_CHECKOUT_ENABLED === 'true',
          trafficPercentage: parseInt(process.env.CANARY_CHECKOUT_TRAFFIC || '10', 10),
          stopLossThresholds: {
            errorRate: 0.05,
            p95LatencyMs: 500,
            rollbackOnBreach: true,
          },
          shadowTraffic: false,
          channels: {
            web: 'preview',
            mobile: 'preview',
          },
        },
      },
    };
    flagsCacheTime = now;
    return cachedFlags;
  } catch {
    // Return default on error
    return {
      canary: {},
    };
  }
}

/**
 * Get feature flags
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  return loadFeatureFlags();
}

/**
 * Check if canary is enabled for a module
 */
export async function isCanaryEnabled(module: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags.canary?.[module]?.enabled === true;
}

/**
 * Hash user ID for consistent canary routing
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if user should be routed to canary
 */
export async function shouldRouteToCanary(userId: string, module: string): Promise<boolean> {
  if (!(await isCanaryEnabled(module))) {
    return false;
  }

  const flags = await getFeatureFlags();
  const config = flags.canary?.[module];
  if (!config) {
    return false;
  }

  const hash = hashUserId(userId);
  return (hash % 100) < config.trafficPercentage;
}

/**
 * Get canary channel for mobile
 */
export async function getCanaryChannel(module: string): Promise<'preview' | 'production'> {
  const flags = await getFeatureFlags();
  return flags.canary?.[module]?.channels.mobile || 'production';
}
