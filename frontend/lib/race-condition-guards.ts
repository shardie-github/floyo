/**
 * Race Condition Guards
 * Utilities to prevent race conditions in concurrent operations
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Debounce function to prevent rapid successive calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function execution rate
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Mutex for async operations to prevent concurrent execution
 */
export class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve(() => this.release());
      } else {
        this.queue.push(() => {
          this.locked = true;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

/**
 * Request deduplication - prevents duplicate concurrent requests
 */
class RequestDeduplicator {
  private pending = new Map<string, Promise<unknown>>();

  async dedupe<T>(
    key: string,
    request: () => Promise<T>
  ): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = request().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(key?: string): void {
    if (key) {
      this.pending.delete(key);
    } else {
      this.pending.clear();
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Safe query invalidation - prevents race conditions in React Query
 */
export function safeInvalidateQueries(
  queryClient: QueryClient,
  queryKey: string[],
  options?: { debounceMs?: number }
): void {
  const debounceMs = options?.debounceMs ?? 100;
  
  // Use debounce to prevent rapid successive invalidations
  const debouncedInvalidate = debounce(() => {
    queryClient.invalidateQueries({ queryKey });
  }, debounceMs);
  
  debouncedInvalidate();
}

/**
 * WebSocket connection manager to prevent multiple connections
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private mutex = new Mutex();

  constructor(
    private url: string,
    private options: {
      maxReconnectAttempts?: number;
      baseReconnectDelay?: number;
      onMessage?: (data: Record<string, unknown>) => void;
      onError?: (error: Event) => void;
    } = {}
  ) {}

  async connect(): Promise<void> {
    const release = await this.mutex.acquire();
    
    try {
      if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
        return;
      }

      this.isConnecting = true;
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        release();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.options.onMessage?.(message);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to parse WebSocket message:', error);
          }
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        this.options.onError?.(error);
        release();
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        release();
        this.scheduleReconnect();
      };
    } catch (error) {
      this.isConnecting = false;
      release();
      throw error;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts ?? 5)) {
      return;
    }

    this.reconnectAttempts++;
    const delay =
      (this.options.baseReconnectDelay ?? 1000) *
      Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
