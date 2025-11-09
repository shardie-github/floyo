/**
 * Privacy Service
 * 
 * Business logic for privacy-related operations (export, telemetry, consent).
 */

import prisma from '@/lib/db/prisma';
import { ValidationError, AuthorizationError } from '@/src/lib/errors';

export interface ExportData {
  exportedAt: string;
  userId: string;
  preferences: unknown;
  apps: unknown[];
  signals: unknown[];
  events: unknown[];
  transparencyLog: unknown[];
}

export class PrivacyService {
  /**
   * Export user privacy data
   */
  async exportUserData(userId: string, format: 'json' | 'csv'): Promise<ExportData> {
    const [prefs, apps, signals, events, logs] = await Promise.all([
      prisma.privacyPrefs.findUnique({ where: { userId } }),
      prisma.appAllowlist.findMany({ where: { userId } }),
      prisma.signalToggle.findMany({ where: { userId } }),
      prisma.telemetryEvent.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.privacyTransparencyLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      userId,
      preferences: prefs,
      apps,
      signals,
      events,
      transparencyLog: logs,
    };
  }

  /**
   * Check if user has monitoring enabled
   */
  async checkMonitoringEnabled(userId: string): Promise<boolean> {
    const prefs = await prisma.privacyPrefs.findUnique({
      where: { userId },
    });

    return !!(prefs?.monitoringEnabled && prefs?.consentGiven);
  }

  /**
   * Check if app is allowed for user
   */
  async isAppAllowed(userId: string, appId: string): Promise<boolean> {
    const allowedApp = await prisma.appAllowlist.findUnique({
      where: {
        userId_appId: {
          userId,
          appId,
        },
      },
    });

    return !!(allowedApp?.enabled && allowedApp.scope !== 'none');
  }

  /**
   * Check if signal is enabled for user
   */
  async isSignalEnabled(userId: string, signalKey: string): Promise<boolean> {
    const signalToggle = await prisma.signalToggle.findUnique({
      where: {
        userId_signalKey: {
          userId,
          signalKey,
        },
      },
    });

    return signalToggle?.enabled ?? true; // Default to enabled if not set
  }

  /**
   * Get sampling rate for signal
   */
  async getSamplingRate(userId: string, signalKey: string): Promise<number> {
    const signalToggle = await prisma.signalToggle.findUnique({
      where: {
        userId_signalKey: {
          userId,
          signalKey,
        },
      },
    });

    return signalToggle?.samplingRate ?? 1.0;
  }

  /**
   * Log transparency action
   */
  async logTransparencyAction(
    userId: string,
    action: string,
    resource?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await prisma.privacyTransparencyLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: metadata || {},
      },
    });
  }
}
