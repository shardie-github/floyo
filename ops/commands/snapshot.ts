/**
 * Snapshot command - Create encrypted database snapshot
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export async function snapshot(options: {
  subset?: string;
  encrypt?: boolean;
}) {
  console.log('📸 Creating database snapshot...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotDir = path.join(process.cwd(), 'ops', 'snapshots');
  fs.mkdirSync(snapshotDir, { recursive: true });

  const snapshotFile = path.join(snapshotDir, `snapshot-${timestamp}.sql`);
  const encryptedFile = snapshotFile + '.encrypted';

  try {
    // Extract DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set');
    }

    // Parse tables if subset specified
    const tables = options.subset ? options.subset.split(',').map(t => t.trim()) : null;

    // Create snapshot using pg_dump (for PostgreSQL)
    let dumpCommand = `pg_dump "${dbUrl}"`;
    if (tables) {
      dumpCommand += ` -t ${tables.join(' -t ')}`;
    }
    dumpCommand += ` > "${snapshotFile}"`;

    execSync(dumpCommand, { stdio: 'inherit' });

    console.log(`✅ Snapshot created: ${snapshotFile}\n`);

    // Encrypt if requested
    if (options.encrypt) {
      const encryptionKey = process.env.SNAPSHOT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
      
      const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
      const input = fs.createReadStream(snapshotFile);
      const output = fs.createWriteStream(encryptedFile);
      
      input.pipe(cipher).pipe(output);
      
      await new Promise((resolve, reject) => {
        output.on('finish', resolve);
        output.on('error', reject);
      });

      // Remove unencrypted file
      fs.unlinkSync(snapshotFile);
      
      console.log(`✅ Encrypted snapshot: ${encryptedFile}\n`);
      console.log(`⚠️  Encryption key: ${encryptionKey}\n`);
      console.log('   Store this key securely!\n');
    }

    // Create metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      tables: tables || 'all',
      encrypted: options.encrypt || false,
      file: options.encrypt ? encryptedFile : snapshotFile,
      size: fs.statSync(options.encrypt ? encryptedFile : snapshotFile).size,
    };

    const metadataFile = (options.encrypt ? encryptedFile : snapshotFile).replace(/\.(sql|encrypted)$/, '.json');
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    console.log('✅ Snapshot metadata saved\n');
  } catch (error) {
    console.error(`❌ Snapshot failed: ${error.message}\n`);
    process.exit(1);
  }
}
