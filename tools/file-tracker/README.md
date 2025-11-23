# Floyo File Tracking Client

MVP file tracking client that monitors file system events and sends them to the Floyo API.

## Features

- ✅ Tracks file create/modify/delete events
- ✅ Offline queue for reliability
- ✅ Exponential backoff retry
- ✅ Pause/resume functionality
- ✅ Cross-platform support (Windows/Mac/Linux)

## Installation

```bash
cd tools/file-tracker
npm install
npm run build
```

## Usage

### Environment Variables

```bash
export FLOYO_API_URL="http://localhost:8000"  # Floyo API URL
export FLOYO_USER_ID="your-user-id"          # Your Floyo user ID
export FLOYO_WATCH_PATHS="./src,./lib"       # Comma-separated paths to watch
export FLOYO_ENABLED="true"                   # Enable/disable tracking
```

### Run

```bash
npm start
# or
npm run dev  # For development
```

### Programmatic Usage

```typescript
import { FileTracker } from './src/index';

const tracker = new FileTracker({
  apiUrl: 'http://localhost:8000',
  userId: 'your-user-id',
  watchPaths: ['./src', './lib'],
  enabled: true,
  queuePath: './queue.json',
});

await tracker.start();

// Pause tracking
tracker.pause();

// Resume tracking
tracker.resume();

// Stop tracking
await tracker.stop();
```

## Queue

Events are stored in `~/.floyo/file-tracker-queue.json` when offline or when API is unavailable. Events are automatically retried with exponential backoff.

## Privacy

- All tracking is local
- User can pause/resume at any time
- Events only sent to user's Floyo account
- No data shared with third parties
