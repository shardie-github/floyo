'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analytics } from '@/lib/analytics/analytics';

interface FileEvent {
  filePath: string;
  eventType: 'created' | 'modified' | 'accessed' | 'deleted';
  timestamp: string;
  tool?: string;
}

export function FileTracker() {
  const [tracking, setTracking] = useState(false);
  const [events, setEvents] = useState<FileEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if file tracking is enabled
    const trackingEnabled = localStorage.getItem('file_tracking_enabled') === 'true';
    setTracking(trackingEnabled);
    
    if (trackingEnabled) {
      startTracking();
    }
  }, []);

  const startTracking = () => {
    try {
      // Track file events from browser (if available)
      // This is a simplified version - in production, you'd use a browser extension
      // or desktop app for actual file system tracking
      
      // For now, we'll track manual file events
      setTracking(true);
      localStorage.setItem('file_tracking_enabled', 'true');
      
      // Track first event
      analytics.trackActivationEvent('first_event_tracked', {
        tracking_method: 'browser',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    }
  };

  const stopTracking = () => {
    setTracking(false);
    localStorage.setItem('file_tracking_enabled', 'false');
  };

  const trackManualEvent = async (filePath: string, eventType: FileEvent['eventType']) => {
    try {
      const event: FileEvent = {
        filePath,
        eventType,
        timestamp: new Date().toISOString(),
        tool: 'manual',
      };

      // Send to backend
      const response = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          events: [{
            file_path: filePath,
            event_type: eventType,
            tool: 'manual',
            timestamp: event.timestamp,
          }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track event');
      }

      setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track event');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Tracking</CardTitle>
        <CardDescription>Track your file usage patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tracking Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tracking Status</p>
              <p className="text-sm text-muted-foreground">
                {tracking ? 'Active' : 'Inactive'}
              </p>
            </div>
            {tracking ? (
              <button
                onClick={stopTracking}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Tracking
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Start Tracking
              </button>
            )}
          </div>

          {/* Manual Event Tracking */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Manual Event Tracking</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="File path (e.g., /src/components/Button.tsx)"
                className="flex-1 px-3 py-2 border rounded"
                id="file-path-input"
              />
              <select
                className="px-3 py-2 border rounded"
                id="event-type-select"
                defaultValue="accessed"
              >
                <option value="created">Created</option>
                <option value="modified">Modified</option>
                <option value="accessed">Accessed</option>
                <option value="deleted">Deleted</option>
              </select>
              <button
                onClick={() => {
                  const input = document.getElementById('file-path-input') as HTMLInputElement;
                  const select = document.getElementById('event-type-select') as HTMLSelectElement;
                  if (input?.value) {
                    trackManualEvent(input.value, select.value as FileEvent['eventType']);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Track
              </button>
            </div>
          </div>

          {/* Recent Events */}
          {events.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Recent Events ({events.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.map((event, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded">
                    <span className="font-medium">{event.eventType}</span>: {event.filePath}
                    <span className="text-muted-foreground ml-2">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {/* Info */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              💡 For automatic tracking, install the Floyo browser extension or desktop app.
              Manual tracking is available for testing and demos.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
