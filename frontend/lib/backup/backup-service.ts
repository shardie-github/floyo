/**
 * Backup Service
 * 
 * Automated backup and restore procedures.
 * Taps into: "I want to know my data is safe"
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  checksum: string;
  encrypted: boolean;
  tables?: string[];
}

export class BackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'ops', 'snapshots');
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  /**
   * Create backup
   */
  async createBackup(options: {
    tables?: string[];
    encrypt?: boolean;
  } = {}): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;
    const backupFile = path.join(this.backupDir, `${backupId}.sql`);
    const metadataFile = path.join(this.backupDir, `${backupId}.metadata.json`);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set');
    }

    // Create backup
    let dumpCommand = `pg_dump "${dbUrl}"`;
    if (options.tables && options.tables.length > 0) {
      dumpCommand += ` -t ${options.tables.join(' -t ')}`;
    }
    dumpCommand += ` > "${backupFile}"`;

    execSync(dumpCommand, { stdio: 'inherit' });

    // Calculate checksum
    const fileContent = fs.readFileSync(backupFile);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    const size = fileContent.length;

    // Encrypt if requested
    let encrypted = false;
    if (options.encrypt) {
      const encryptionKey = process.env.SNAPSHOT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
      const encryptedFile = backupFile + '.encrypted';
      
      const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
      const input = fs.createReadStream(backupFile);
      const output = fs.createWriteStream(encryptedFile);
      
      input.pipe(cipher).pipe(output);
      
      // Remove unencrypted file
      fs.unlinkSync(backupFile);
      encrypted = true;
    }

    // Create metadata
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date().toISOString(),
      size,
      checksum,
      encrypted,
      tables: options.tables,
    };

    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  /**
   * List backups
   */
  listBackups(): BackupMetadata[] {
    const backups: BackupMetadata[] = [];

    const files = fs.readdirSync(this.backupDir);
    files.forEach(file => {
      if (file.endsWith('.metadata.json')) {
        const metadataPath = path.join(this.backupDir, file);
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        backups.push(metadata);
      }
    });

    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get latest backup
   */
  getLatestBackup(): BackupMetadata | null {
    const backups = this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Verify backup integrity
   */
  verifyBackup(backupId: string): boolean {
    const metadataFile = path.join(this.backupDir, `${backupId}.metadata.json`);
    if (!fs.existsSync(metadataFile)) {
      return false;
    }

    const metadata: BackupMetadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    const backupFile = path.join(
      this.backupDir,
      `${backupId}.sql${metadata.encrypted ? '.encrypted' : ''}`
    );

    if (!fs.existsSync(backupFile)) {
      return false;
    }

    // Verify checksum
    const fileContent = fs.readFileSync(backupFile);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');

    return checksum === metadata.checksum;
  }
}
