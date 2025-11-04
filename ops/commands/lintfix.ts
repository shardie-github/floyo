/**
 * Lintfix command - Fix linting issues automatically
 */

import { execSync } from 'child_process';

export async function lintfix() {
  console.log('🔧 Fixing linting issues...\n');

  try {
    execSync('npm run lint -- --fix', { stdio: 'inherit' });
    console.log('\n✅ Linting issues fixed\n');
  } catch (error) {
    console.error('\n❌ Failed to fix linting issues\n');
    process.exit(1);
  }
}
