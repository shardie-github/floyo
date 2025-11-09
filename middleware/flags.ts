/**
 * Feature Flag Middleware
 * 
 * Toggles features and experiments based on feature flag configuration.
 * Integrates with feature flag service (LaunchDarkly, Flagsmith, or custom).
 * 
 * Usage:
 *   import { getFlag, isEnabled } from '@/middleware/flags';
 *   
 *   if (isEnabled('onboarding_v2')) {
 *     // Show new onboarding flow
 *   }
 */

import flagsConfig from '../featureflags/flags.json';

type FlagKey = keyof typeof flagsConfig.flags;
type Environment = 'development' | 'staging' | 'production';

interface FlagConfig {
  key: string;
  name: string;
  description: string;
  type: 'experiment' | 'feature';
  experiment_slug?: string;
  default_value: boolean;
  rollout_percentage: number;
  target_audience: string;
  environments: Record<Environment, boolean>;
  metadata: {
    owner: string;
    created_at: string;
    expires_at?: string;
  };
}

interface UserContext {
  id?: string;
  email?: string;
  userType?: 'free' | 'paid' | 'enterprise';
  segment?: string;
}

// Feature flag service client (replace with your service)
class FeatureFlagService {
  private flags: Map<string, FlagConfig>;
  private environment: Environment;

  constructor(environment: Environment = 'production') {
    this.environment = environment;
    this.flags = new Map();
    
    // Load flags from config
    flagsConfig.flags.forEach((flag: FlagConfig) => {
      this.flags.set(flag.key, flag);
    });
  }

  /**
   * Check if a feature flag is enabled for a user
   */
  async isEnabled(
    flagKey: string,
    userContext?: UserContext
  ): Promise<boolean> {
    const flag = this.flags.get(flagKey);
    
    if (!flag) {
      console.warn(`Flag ${flagKey} not found`);
      return false;
    }

    // Check if flag is enabled in current environment
    if (!flag.environments[this.environment]) {
      return false;
    }

    // Check expiration
    if (flag.metadata.expires_at) {
      const expiresAt = new Date(flag.metadata.expires_at);
      if (new Date() > expiresAt) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rollout_percentage === 0) {
      return flag.default_value;
    }

    if (flag.rollout_percentage === 100) {
      return true;
    }

    // For experiments, use consistent hashing based on user ID
    if (userContext?.id) {
      const hash = this.hashUser(flagKey, userContext.id);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rollout_percentage;
    }

    // Fallback to default value
    return flag.default_value;
  }

  /**
   * Get flag configuration
   */
  getFlag(flagKey: string): FlagConfig | undefined {
    return this.flags.get(flagKey);
  }

  /**
   * Get all flags for a user
   */
  async getAllFlags(userContext?: UserContext): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    
    for (const flagKey of this.flags.keys()) {
      result[flagKey] = await this.isEnabled(flagKey, userContext);
    }
    
    return result;
  }

  /**
   * Consistent hash function for user-based rollouts
   */
  private hashUser(flagKey: string, userId: string): number {
    const str = `${flagKey}:${userId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update rollout percentage (for gradual rollouts)
   */
  updateRollout(flagKey: string, percentage: number): void {
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.rollout_percentage = Math.max(0, Math.min(100, percentage));
    }
  }
}

// Singleton instance
let flagService: FeatureFlagService | null = null;

function getFlagService(): FeatureFlagService {
  if (!flagService) {
    const env = (process.env.NODE_ENV || 'production') as Environment;
    flagService = new FeatureFlagService(env);
  }
  return flagService;
}

/**
 * Check if a feature flag is enabled
 */
export async function isEnabled(
  flagKey: string,
  userContext?: UserContext
): Promise<boolean> {
  return getFlagService().isEnabled(flagKey, userContext);
}

/**
 * Get flag configuration
 */
export function getFlag(flagKey: string): FlagConfig | undefined {
  return getFlagService().getFlag(flagKey);
}

/**
 * Get all flags for a user
 */
export async function getAllFlags(
  userContext?: UserContext
): Promise<Record<string, boolean>> {
  return getFlagService().getAllFlags(userContext);
}

/**
 * Update rollout percentage (admin function)
 */
export function updateRollout(flagKey: string, percentage: number): void {
  getFlagService().updateRollout(flagKey, percentage);
}

/**
 * React hook for feature flags (if using React)
 */
export function useFeatureFlag(flagKey: string, userContext?: UserContext) {
  // Implementation depends on your React setup
  // This is a placeholder
  return {
    enabled: false,
    loading: false,
    error: null,
  };
}

/**
 * Middleware for Express/Next.js
 */
export function featureFlagMiddleware(
  req: any,
  res: any,
  next: () => void
) {
  // Attach flag service to request
  req.flags = {
    isEnabled: (flagKey: string) => 
      getFlagService().isEnabled(flagKey, { id: req.user?.id }),
    getAllFlags: () => 
      getFlagService().getAllFlags({ id: req.user?.id }),
  };
  
  next();
}

export type { FlagConfig, UserContext };
