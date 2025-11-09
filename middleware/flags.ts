/**
 * Feature Flag Middleware
 * Description: Toggle handler for feature flags and experiments
 * Usage: Import and use in API routes, server components, or client components
 */

import flagsData from '../featureflags/flags.json';

interface FlagVariant {
  name: string;
  value: boolean;
  traffic_percentage: number;
}

interface FlagRule {
  condition: string;
  variant: string;
}

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  type: string;
  experiment_slug?: string;
  default_value: boolean;
  variants: FlagVariant[];
  rules?: FlagRule[];
  status: 'active' | 'draft' | 'archived';
}

type UserContext = {
  user_id?: string | number;
  order_id?: string | number;
  email?: string;
  [key: string]: unknown;
};

/**
 * Hash function for consistent user assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Evaluate a condition rule
 */
function evaluateCondition(condition: string, context: UserContext): boolean {
  // Simple condition evaluator (in production, use a proper expression evaluator)
  // Supports: user_id % 2 == 0, order_id % 2 == 1, etc.
  
  try {
    // Replace context variables
    let evalCondition = condition;
    for (const [key, value] of Object.entries(context)) {
      evalCondition = evalCondition.replace(new RegExp(key, 'g'), String(value));
    }
    
    // Evaluate (simplified - in production, use a safer evaluator)
    // eslint-disable-next-line no-eval
    return eval(evalCondition);
  } catch {
    return false;
  }
}

/**
 * Get feature flag value for a user
 */
export function getFeatureFlag(
  flagKey: string,
  context: UserContext = {}
): boolean {
  const flag = (flagsData.flags as FeatureFlag[]).find((f) => f.key === flagKey);
  
  if (!flag) {
    console.warn(`Feature flag "${flagKey}" not found`);
    return false;
  }
  
  if (flag.status !== 'active') {
    return flag.default_value;
  }
  
  // If no rules, use default value
  if (!flag.rules || flag.rules.length === 0) {
    return flag.default_value;
  }
  
  // Evaluate rules in order
  for (const rule of flag.rules) {
    if (evaluateCondition(rule.condition, context)) {
      const variant = flag.variants.find((v) => v.name === rule.variant);
      return variant?.value ?? flag.default_value;
    }
  }
  
  // Fallback to default value
  return flag.default_value;
}

/**
 * Get experiment variant for a user
 */
export function getExperimentVariant(
  experimentSlug: string,
  context: UserContext = {}
): string | null {
  const flag = (flagsData.flags as FeatureFlag[]).find(
    (f) => f.experiment_slug === experimentSlug && f.status === 'active'
  );
  
  if (!flag) {
    return null;
  }
  
  // Use deterministic assignment based on user_id or order_id
  const identifier = context.user_id || context.order_id || 'default';
  const hash = hashString(String(identifier));
  const bucket = hash % 100;
  
  let cumulative = 0;
  for (const variant of flag.variants) {
    cumulative += variant.traffic_percentage;
    if (bucket < cumulative) {
      return variant.name;
    }
  }
  
  return flag.variants[0]?.name ?? null;
}

/**
 * Check if experiment is enabled for a user
 */
export function isExperimentEnabled(
  experimentSlug: string,
  context: UserContext = {}
): boolean {
  const variant = getExperimentVariant(experimentSlug, context);
  if (!variant) {
    return false;
  }
  
  const flag = (flagsData.flags as FeatureFlag[]).find(
    (f) => f.experiment_slug === experimentSlug
  );
  
  if (!flag) {
    return false;
  }
  
  const variantConfig = flag.variants.find((v) => v.name === variant);
  return variantConfig?.value ?? false;
}

/**
 * Get all active experiments for a user
 */
export function getActiveExperiments(context: UserContext = {}): string[] {
  return (flagsData.flags as FeatureFlag[])
    .filter((f) => f.status === 'active' && f.type === 'experiment')
    .filter((f) => isExperimentEnabled(f.experiment_slug || '', context))
    .map((f) => f.experiment_slug || '')
    .filter(Boolean);
}

/**
 * Example usage in API route or server component
 */
export function exampleUsage() {
  const context: UserContext = {
    user_id: 12345,
    order_id: 67890,
    email: 'user@example.com',
  };
  
  // Check if feature flag is enabled
  const isEnabled = getFeatureFlag('post_purchase_upsell', context);
  
  // Get experiment variant
  const variant = getExperimentVariant('post-purchase-upsell', context);
  
  // Check if experiment is enabled
  const experimentEnabled = isExperimentEnabled('post-purchase-upsell', context);
  
  // Get all active experiments
  const activeExperiments = getActiveExperiments(context);
  
  return {
    isEnabled,
    variant,
    experimentEnabled,
    activeExperiments,
  };
}

export default {
  getFeatureFlag,
  getExperimentVariant,
  isExperimentEnabled,
  getActiveExperiments,
};
