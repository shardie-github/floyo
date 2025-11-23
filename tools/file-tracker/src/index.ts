/**
 * Floyo File Tracking Client MVP
 * 
 * Tracks file create/modify/delete events and sends them to Floyo API.
 * Supports offline queue for reliability.
 */

import chokidar from 'chokidar';
import axios from 'axios';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface FileEvent {
  user_id: string;
  app: string;
  type: 'file_created' | 'file_modified' | 'file_deleted' | 'file_accessed';
  path: string;
  meta: {
    tool?: string;
    timestamp: string;
    [key: string]: unknown;
  };
}

interface Config {
  apiUrl: string;
  userId: string;
  watchPaths: string[];
  enabled: boolean;
  queuePath: string;
}

class FileTracker extends EventEmitter {
  private config: Config;
  private watcher: chokidar.FSWatcher | null = null;
  private eventQueue: FileEvent[] = [];
  private isProcessingQueue = false;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(config: Config) {
    super();
    this.config = config;
    this.loadQueue();
  }

  /**
   * Start tracking files
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('File tracking is disabled');
      return;
    }

    if (this.watcher) {
      console.log('File tracker already running');
      return;
    }

    console.log(`Starting file tracker for paths: ${this.config.watchPaths.join(', ')}`);

    // Create watcher
    this.watcher = chokidar.watch(this.config.watchPaths, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    // Set up event handlers
    this.watcher
      .on('add', (filePath) => this.handleEvent('file_created', filePath))
      .on('change', (filePath) => this.handleEvent('file_modified', filePath))
      .on('unlink', (filePath) => this.handleEvent('file_deleted', filePath))
      .on('error', (error) => {
        console.error('File watcher error:', error);
        this.emit('error', error);
      });

    // Start processing queue
    this.processQueue();

    console.log('File tracker started');
    this.emit('started');
  }

  /**
   * Stop tracking files
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    await this.saveQueue();
    console.log('File tracker stopped');
    this.emit('stopped');
  }

  /**
   * Pause tracking (events are queued but not sent)
   */
  pause(): void {
    this.config.enabled = false;
    console.log('File tracking paused');
    this.emit('paused');
  }

  /**
   * Resume tracking
   */
  resume(): void {
    this.config.enabled = true;
    console.log('File tracking resumed');
    this.processQueue();
    this.emit('resumed');
  }

  /**
   * Handle file system event
   */
  private async handleEvent(
    eventType: FileEvent['type'],
    filePath: string
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const event: FileEvent = {
      user_id: this.config.userId,
      app: 'file-tracker',
      type: eventType,
      path: filePath,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    // Add to queue
    this.eventQueue.push(event);
    await this.saveQueue();

    // Try to send immediately
    this.processQueue();
  }

  /**
   * Process event queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue[0];

      try {
        await this.sendEvent(event);
        // Remove from queue on success
        this.eventQueue.shift();
        await this.saveQueue();
      } catch (error) {
        console.error('Failed to send event:', error);
        // Keep in queue for retry
        // Use exponential backoff
        this.scheduleRetry();
        break;
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Send event to API
   */
  private async sendEvent(event: FileEvent): Promise<void> {
    const response = await axios.post(
      `${this.config.apiUrl}/api/telemetry/ingest`,
      event,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(): void {
    if (this.retryTimeout) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.eventQueue.length), 60000); // Max 60s

    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.processQueue();
    }, delay);
  }

  /**
   * Load queue from disk
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await fs.readFile(this.config.queuePath, 'utf-8');
      this.eventQueue = JSON.parse(queueData);
      console.log(`Loaded ${this.eventQueue.length} events from queue`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to load queue:', error);
      }
      this.eventQueue = [];
    }
  }

  /**
   * Save queue to disk
   */
  private async saveQueue(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.config.queuePath), { recursive: true });
      await fs.writeFile(
        this.config.queuePath,
        JSON.stringify(this.eventQueue, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }
}

// CLI interface
async function main() {
  const apiUrl = process.env.FLOYO_API_URL || 'http://localhost:8000';
  const userId = process.env.FLOYO_USER_ID || '';
  const watchPaths = (process.env.FLOYO_WATCH_PATHS || '.').split(',').map(p => p.trim());
  const enabled = process.env.FLOYO_ENABLED !== 'false';
  const queuePath = path.join(
    os.homedir(),
    '.floyo',
    'file-tracker-queue.json'
  );

  if (!userId) {
    console.error('Error: FLOYO_USER_ID environment variable is required');
    process.exit(1);
  }

  const config: Config = {
    apiUrl,
    userId,
    watchPaths,
    enabled,
    queuePath,
  };

  const tracker = new FileTracker(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await tracker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await tracker.stop();
    process.exit(0);
  });

  // Start tracking
  await tracker.start();

  // Keep process alive
  console.log('File tracker running. Press Ctrl+C to stop.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { FileTracker, FileEvent, Config };
