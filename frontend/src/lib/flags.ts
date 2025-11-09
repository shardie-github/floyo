/**
 * Feature Flags Utility
 * Reads flags from config/flags.json with environment awareness
 */

import flagsConfig from '../../../config/flags.json';

type Environment = 'development' | 'staging' | 'production';

interface FlagConfig {
  enabled: boolean;
  env: 'development' | 'staging' | 'production';
  description?: string;
}

interface FlagsConfig {
  flags: Record<string, FlagConfig>;
  defaults: {
    enabled: boolean;
    env: 'development' | 'staging' | 'production';
  };
}

function getCurrentEnv(): Environment {
  if (typeof window === 'undefined') {
    // Server-side
    return (process.env.NODE_ENV as Environment) || 'development';
  }
  // Client-side
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV;
  return (env as Environment) || 'development';
}

/**
 * Check if a feature flag is enabled
 * @param flagName - Name of the flag
 * @returns true if flag is enabled for current environment
 */
export function isFlagEnabled(flagName: string): boolean {
  const config = flagsConfig as FlagsConfig;
  const flag = config.flags[flagName];

  if (!flag) {
    return config.defaults.enabled;
  }

  const currentEnv = getCurrentEnv();
  const flagEnv = flag.env;

  // Flag must be enabled AND match current environment
  if (!flag.enabled) {
    return false;
  }

  // Environment matching logic
  if (flagEnv === 'production') {
    return currentEnv === 'production';
  } else if (flagEnv === 'staging') {
    return currentEnv === 'staging' || currentEnv === 'development';
  } else {
    // development
    return currentEnv === 'development';
  }
}

/**
 * Get all enabled flags for current environment
 */
export function getEnabledFlags(): string[] {
  const config = flagsConfig as FlagsConfig;
  return Object.keys(config.flags).filter((name) => isFlagEnabled(name));
}

/**
 * Get flag metadata
 */
export function getFlagMetadata(flagName: string): FlagConfig | null {
  const config = flagsConfig as FlagsConfig;
  return config.flags[flagName] || null;
}

/**
 * List all flags with their status
 */
export function getAllFlags(): Record<string, { enabled: boolean; env: string; description?: string }> {
  const config = flagsConfig as FlagsConfig;
  const result: Record<string, { enabled: boolean; env: string; description?: string }> = {};

  Object.entries(config.flags).forEach(([name, flag]) => {
    result[name] = {
      enabled: isFlagEnabled(name),
      env: flag.env,
      description: flag.description,
    };
  });

  return result;
}
