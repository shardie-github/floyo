/**
 * Test E2E command - Run end-to-end tests
 */

import { execSync } from 'child_process';

export async function testE2E(options: {
  headed?: boolean;
  workers?: string;
}) {
  console.log('🧪 Running end-to-end tests...\n');

  const args = ['playwright', 'test'];
  
  if (options.headed) {
    args.push('--headed');
  }
  
  if (options.workers) {
    args.push('--workers', options.workers);
  }

  try {
    execSync(args.join(' '), { stdio: 'inherit' });
    console.log('\n✅ E2E tests passed\n');
  } catch (error) {
    console.error('\n❌ E2E tests failed\n');
    process.exit(1);
  }
}
