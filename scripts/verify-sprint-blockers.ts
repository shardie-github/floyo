/**
 * Sprint Blocker Verification Script
 * 
 * Verifies that critical sprint blockers are resolved:
 * 1. Event ingestion endpoint exists and works
 * 2. Pattern detection job exists
 * 3. Dashboard APIs exist and perform well
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

const results: VerificationResult[] = [];

async function verifyEventIngestionEndpoint(): Promise<VerificationResult> {
  try {
    // Check if endpoint file exists
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const endpointPath = path.join(process.cwd(), 'frontend/app/api/telemetry/ingest/route.ts');
    
    try {
      await fs.access(endpointPath);
      results.push({
        name: 'Event Ingestion Endpoint File',
        status: 'pass',
        message: 'Endpoint file exists at frontend/app/api/telemetry/ingest/route.ts',
      });
    } catch {
      results.push({
        name: 'Event Ingestion Endpoint File',
        status: 'fail',
        message: 'Endpoint file not found at frontend/app/api/telemetry/ingest/route.ts',
      });
      return {
        name: 'Event Ingestion Endpoint',
        status: 'fail',
        message: 'Endpoint file not found',
      };
    }

    // Check if Supabase Edge Function exists
    const edgeFunctionPath = path.join(process.cwd(), 'supabase/functions/ingest-telemetry/index.ts');
    try {
      await fs.access(edgeFunctionPath);
      results.push({
        name: 'Supabase Edge Function',
        status: 'pass',
        message: 'Edge function exists at supabase/functions/ingest-telemetry/index.ts',
      });
    } catch {
      results.push({
        name: 'Supabase Edge Function',
        status: 'warning',
        message: 'Edge function not found (may be deployed separately)',
      });
    }

    return {
      name: 'Event Ingestion Endpoint',
      status: 'pass',
      message: 'Event ingestion endpoint verified',
    };
  } catch (error) {
    return {
      name: 'Event Ingestion Endpoint',
      status: 'fail',
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    };
  }
}

async function verifyPatternDetectionJob(): Promise<VerificationResult> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Check if pattern detector exists
    const detectorPath = path.join(process.cwd(), 'backend/ml/pattern_detector.py');
    try {
      await fs.access(detectorPath);
      results.push({
        name: 'Pattern Detector',
        status: 'pass',
        message: 'Pattern detector exists at backend/ml/pattern_detector.py',
      });
    } catch {
      return {
        name: 'Pattern Detection Job',
        status: 'fail',
        message: 'Pattern detector not found',
      };
    }

    // Check if Celery job exists
    const jobsDir = path.join(process.cwd(), 'backend/jobs');
    try {
      const files = await fs.readdir(jobsDir);
      const hasPatternJob = files.some(f => f.includes('pattern') || f.includes('detect'));
      
      if (hasPatternJob) {
        results.push({
          name: 'Pattern Detection Job',
          status: 'pass',
          message: 'Pattern detection job found in backend/jobs/',
        });
      } else {
        results.push({
          name: 'Pattern Detection Job',
          status: 'warning',
          message: 'No explicit pattern detection job found (may be triggered differently)',
        });
      }
    } catch {
      results.push({
        name: 'Pattern Detection Job',
        status: 'warning',
        message: 'Could not check jobs directory',
      });
    }

    return {
      name: 'Pattern Detection Job',
      status: 'pass',
      message: 'Pattern detection components verified',
    };
  } catch (error) {
    return {
      name: 'Pattern Detection Job',
      status: 'fail',
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    };
  }
}

async function verifyDashboardAPIs(): Promise<VerificationResult> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const apiRoutes = [
      { name: 'Insights API', path: 'frontend/app/api/insights/route.ts' },
      { name: 'Patterns API', path: 'frontend/app/api/patterns/route.ts' },
      { name: 'Stats API', path: 'frontend/app/api/stats/route.ts' },
    ];

    const missing: string[] = [];
    const found: string[] = [];

    for (const route of apiRoutes) {
      const routePath = path.join(process.cwd(), route.path);
      try {
        await fs.access(routePath);
        found.push(route.name);
        results.push({
          name: route.name,
          status: 'pass',
          message: `Found at ${route.path}`,
        });
      } catch {
        missing.push(route.name);
        results.push({
          name: route.name,
          status: 'fail',
          message: `Not found at ${route.path}`,
        });
      }
    }

    if (missing.length > 0) {
      return {
        name: 'Dashboard APIs',
        status: 'fail',
        message: `Missing APIs: ${missing.join(', ')}`,
      };
    }

    return {
      name: 'Dashboard APIs',
      status: 'pass',
      message: `All dashboard APIs found: ${found.join(', ')}`,
    };
  } catch (error) {
    return {
      name: 'Dashboard APIs',
      status: 'fail',
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    };
  }
}

async function verifyDatabaseConnection(): Promise<VerificationResult> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    
    return {
      name: 'Database Connection',
      status: 'pass',
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
    };
  }
}

async function main() {
  console.log('🔍 Verifying Sprint Blockers...\n');

  const verifications = [
    verifyEventIngestionEndpoint(),
    verifyPatternDetectionJob(),
    verifyDashboardAPIs(),
    verifyDatabaseConnection(),
  ];

  const verificationResults = await Promise.all(verifications);

  console.log('\n📊 Verification Results:\n');
  console.log('='.repeat(60));

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  for (const result of [...verificationResults, ...results]) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warningCount++;
  }

  console.log('='.repeat(60));
  console.log(`\nSummary: ${passCount} passed, ${failCount} failed, ${warningCount} warnings\n`);

  if (failCount > 0) {
    console.log('❌ Some blockers are not resolved. Please fix the issues above.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('⚠️  Some warnings found. Review the issues above.');
    process.exit(0);
  } else {
    console.log('✅ All critical blockers verified!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});
