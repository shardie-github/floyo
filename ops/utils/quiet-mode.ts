/**
 * Quiet Mode - Degrade non-critical features during incidents
 */

import { PrismaClient } from '@prisma/client';
import { isQuietMode } from './env';

const prisma = new PrismaClient();

export interface QuietModeConfig {
  enabled: boolean;
  disableAnalytics: boolean;
  disableNonEssentialAPIs: boolean;
  disableWebhooks: boolean;
  enableMaintenanceBanner: boolean;
  reduceCaching: boolean;
}

let quietModeConfig: QuietModeConfig = {
  enabled: isQuietMode(),
  disableAnalytics: false,
  disableNonEssentialAPIs: false,
  disableWebhooks: false,
  enableMaintenanceBanner: true,
  reduceCaching: false
};

export function getQuietModeConfig(): QuietModeConfig {
  return quietModeConfig;
}

export function enableQuietMode(config?: Partial<QuietModeConfig>): void {
  quietModeConfig = {
    enabled: true,
    disableAnalytics: true,
    disableNonEssentialAPIs: true,
    disableWebhooks: true,
    enableMaintenanceBanner: true,
    reduceCaching: true,
    ...config
  };
}

export function disableQuietMode(): void {
  quietModeConfig.enabled = false;
}

export function shouldSkipAnalytics(): boolean {
  return quietModeConfig.enabled && quietModeConfig.disableAnalytics;
}

export function shouldSkipNonEssentialAPIs(): boolean {
  return quietModeConfig.enabled && quietModeConfig.disableNonEssentialAPIs;
}

export function shouldSkipWebhooks(): boolean {
  return quietModeConfig.enabled && quietModeConfig.disableWebhooks;
}

export function shouldShowMaintenanceBanner(): boolean {
  return quietModeConfig.enabled && quietModeConfig.enableMaintenanceBanner;
}

export function getMaintenanceBannerMessage(): string {
  return 'System is operating in quiet mode. Some features may be temporarily unavailable.';
}

// Test coverage
export function testQuietMode(): void {
  enableQuietMode();
  console.assert(shouldSkipAnalytics(), 'Analytics should be skipped');
  console.assert(shouldSkipNonEssentialAPIs(), 'Non-essential APIs should be skipped');
  console.assert(shouldShowMaintenanceBanner(), 'Maintenance banner should be shown');
  
  disableQuietMode();
  console.assert(!shouldSkipAnalytics(), 'Analytics should not be skipped');
  console.assert(!shouldSkipNonEssentialAPIs(), 'Non-essential APIs should not be skipped');
}
