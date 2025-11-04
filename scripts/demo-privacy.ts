/**
 * Privacy Demo Script
 * Seeds fake user, enables monitoring, creates events, exports, deletes
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function demo() {
  console.log('🔐 Privacy-First Monitoring Demo\n');

  const demoUserId = 'demo-user-' + Date.now();

  try {
    // Step 1: Create privacy prefs
    console.log('1. Creating privacy preferences...');
    const prefs = await prisma.privacyPrefs.create({
      data: {
        userId: demoUserId,
        consentGiven: true,
        monitoringEnabled: true,
        dataRetentionDays: 14,
        mfaRequired: true,
        lastReviewedAt: new Date(),
      },
    });
    console.log('   ✅ Created privacy prefs\n');

    // Step 2: Enable app with metadata-only scope
    console.log('2. Enabling app monitoring...');
    const app = await prisma.appAllowlist.create({
      data: {
        userId: demoUserId,
        appId: 'vscode',
        appName: 'VS Code',
        enabled: true,
        scope: 'metadata_only',
      },
    });
    console.log(`   ✅ Enabled ${app.appName} (${app.scope})\n`);

    // Step 3: Enable signal toggle
    console.log('3. Enabling telemetry signal...');
    const signal = await prisma.signalToggle.create({
      data: {
        userId: demoUserId,
        signalKey: 'focus_switches',
        enabled: true,
        samplingRate: 1.0,
      },
    });
    console.log(`   ✅ Enabled signal: ${signal.signalKey}\n`);

    // Step 4: Create synthetic telemetry events
    console.log('4. Creating synthetic telemetry events...');
    const events = [];
    for (let i = 0; i < 5; i++) {
      const event = await prisma.telemetryEvent.create({
        data: {
          userId: demoUserId,
          appId: 'vscode',
          eventType: 'focus_switch',
          durationMs: 1000 + i * 100,
          metadataRedactedJson: {
            timestamp: new Date().toISOString(),
            window_title: 'example.ts',
            // Note: No passwords or sensitive data
          },
        },
      });
      events.push(event);
    }
    console.log(`   ✅ Created ${events.length} events\n`);

    // Step 5: Log transparency actions
    console.log('5. Recording transparency log entries...');
    await prisma.privacyTransparencyLog.create({
      data: {
        userId: demoUserId,
        action: 'consent_given',
        resource: 'privacy_prefs',
        resourceId: prefs.id,
      },
    });
    await prisma.privacyTransparencyLog.create({
      data: {
        userId: demoUserId,
        action: 'app_enabled',
        resource: 'app_allowlist',
        resourceId: app.id,
      },
    });
    console.log('   ✅ Logged transparency actions\n');

    // Step 6: Export data
    console.log('6. Simulating data export...');
    const exportToken = crypto.randomBytes(32).toString('hex');
    await prisma.privacyTransparencyLog.create({
      data: {
        userId: demoUserId,
        action: 'export_requested',
        resource: 'data_export',
        resourceId: exportToken,
        metadata: {
          format: 'json',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      },
    });
    console.log(`   ✅ Export token: ${exportToken}\n`);

    // Step 7: Show transparency log
    console.log('7. Transparency Log:');
    const logs = await prisma.privacyTransparencyLog.findMany({
      where: { userId: demoUserId },
      orderBy: { timestamp: 'desc' },
    });
    logs.forEach((log) => {
      console.log(`   - ${log.action} at ${log.timestamp.toISOString()}`);
    });
    console.log();

    // Step 8: Delete data
    console.log('8. Deleting demo data...');
    await prisma.telemetryEvent.deleteMany({ where: { userId: demoUserId } });
    await prisma.signalToggle.deleteMany({ where: { userId: demoUserId } });
    await prisma.appAllowlist.deleteMany({ where: { userId: demoUserId } });
    await prisma.privacyPrefs.deleteMany({ where: { userId: demoUserId } });
    await prisma.privacyTransparencyLog.deleteMany({ where: { userId: demoUserId } });
    console.log('   ✅ Deleted all demo data\n');

    console.log('✅ Demo completed successfully!');
  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run demo
demo().catch(console.error);
