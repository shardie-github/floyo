/**
 * Restore command - Restore database from snapshot
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export async function restore(snapshotFile: string, options: { dryRun?: boolean }) {
  console.log('🔄 Restoring database from snapshot...\n');

  if (!fs.existsSync(snapshotFile)) {
    console.error(`❌ Snapshot file not found: ${snapshotFile}\n`);
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set\n');
    process.exit(1);
  }

  try {
    // Check for lock (pre-flight check)
    console.log('🔒 Checking for database locks...');
    try {
      execSync(`psql "${dbUrl}" -c "SELECT pg_advisory_lock(123456789);"`, { stdio: 'pipe' });
      execSync(`psql "${dbUrl}" -c "SELECT pg_advisory_unlock(123456789);"`, { stdio: 'pipe' });
      console.log('✅ No locks detected\n');
    } catch (error) {
      console.error('❌ Database is locked or inaccessible\n');
      process.exit(1);
    }

    let sqlFile = snapshotFile;

    // Decrypt if needed
    if (snapshotFile.endsWith('.encrypted')) {
      console.log('🔓 Decrypting snapshot...');
      const encryptionKey = process.env.SNAPSHOT_ENCRYPTION_KEY;
      if (!encryptionKey) {
        console.error('❌ SNAPSHOT_ENCRYPTION_KEY not set\n');
        process.exit(1);
      }

      const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
      const input = fs.createReadStream(snapshotFile);
      sqlFile = snapshotFile.replace('.encrypted', '');
      const output = fs.createWriteStream(sqlFile);

      input.pipe(decipher).pipe(output);

      await new Promise((resolve, reject) => {
        output.on('finish', resolve);
        output.on('error', reject);
      });

      console.log('✅ Decryption complete\n');
    }

    if (options.dryRun) {
      console.log('🔍 DRY RUN - Would restore database\n');
      console.log(`   Snapshot: ${snapshotFile}`);
      console.log(`   Target: ${dbUrl}\n`);
      return;
    }

    // Restore database
    console.log('📥 Restoring database...');
    execSync(`psql "${dbUrl}" < "${sqlFile}"`, { stdio: 'inherit' });

    // Clean up decrypted file if it was encrypted
    if (snapshotFile.endsWith('.encrypted')) {
      fs.unlinkSync(sqlFile);
    }

    console.log('✅ Database restored successfully\n');
  } catch (error) {
    console.error(`❌ Restore failed: ${error.message}\n`);
    process.exit(1);
  }
}
