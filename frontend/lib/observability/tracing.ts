/**
 * OpenTelemetry Tracing Setup
 * 
 * Provides distributed tracing capabilities for the application.
 * Integrates with OpenTelemetry for observability.
 */

import { env } from '../env';

/**
 * Trace context interface
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

/**
 * Span interface for manual instrumentation
 */
export interface Span {
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(status: { code: number; message?: string }): void;
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void;
  end(): void;
}

/**
 * Tracer interface
 */
export interface Tracer {
  startSpan(name: string, options?: { parent?: TraceContext }): Span;
  getActiveSpan(): Span | null;
  getTraceContext(): TraceContext | null;
}

/**
 * Simple in-memory tracer implementation
 * In production, replace with OpenTelemetry SDK
 */
class SimpleTracer implements Tracer {
  private activeSpan: Span | null = null;
  private traceId: string | null = null;
  private spanId: string | null = null;

  startSpan(name: string, options?: { parent?: TraceContext }): Span {
    const traceId = options?.parent?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    
    this.traceId = traceId;
    this.spanId = spanId;

    const span: Span = {
      setAttribute: (key: string, value: string | number | boolean) => {
        if (env.NODE_ENV === 'development') {
          // Using console.debug for trace logs (acceptable in dev)
          console.debug(`[Trace] ${name} attribute: ${key} = ${value}`);
        }
      },
      setStatus: (status: { code: number; message?: string }) => {
        if (env.NODE_ENV === 'development') {
          console.debug(`[Trace] ${name} status:`, status);
        }
      },
      addEvent: (eventName: string, attributes?: Record<string, string | number | boolean>) => {
        if (env.NODE_ENV === 'development') {
          console.debug(`[Trace] ${name} event: ${eventName}`, attributes);
        }
      },
      end: () => {
        if (env.NODE_ENV === 'development') {
          console.debug(`[Trace] ${name} ended`);
        }
        if (this.activeSpan === span) {
          this.activeSpan = null;
        }
      },
    };

    this.activeSpan = span;
    return span;
  }

  getActiveSpan(): Span | null {
    return this.activeSpan;
  }

  getTraceContext(): TraceContext | null {
    if (!this.traceId || !this.spanId) {
      return null;
    }
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      sampled: true,
    };
  }

  private generateTraceId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateSpanId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Global tracer instance
let tracer: Tracer | null = null;

/**
 * Initialize tracing
 * Call this at app startup
 */
export function initTracing(): void {
  if (tracer) {
    return;
  }

  // In production, initialize OpenTelemetry SDK here
  // For now, use simple tracer
  tracer = new SimpleTracer();

  if (env.NODE_ENV === 'development') {
    console.debug('[Tracing] Initialized');
  }
}

/**
 * Get the global tracer instance
 */
export function getTracer(): Tracer {
  if (!tracer) {
    initTracing();
  }
  return tracer!;
}

/**
 * Create a span for async operations
 */
export async function trace<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: { parent?: TraceContext }
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name, options);

  try {
    const result = await fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' }); // ERROR
    span.addEvent('error', {
      'error.message': error instanceof Error ? error.message : 'Unknown error',
      'error.type': error instanceof Error ? error.constructor.name : 'Unknown',
    });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a span for sync operations
 */
export function traceSync<T>(
  name: string,
  fn: (span: Span) => T,
  options?: { parent?: TraceContext }
): T {
  const tracer = getTracer();
  const span = tracer.startSpan(name, options);

  try {
    const result = fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' }); // ERROR
    span.addEvent('error', {
      'error.message': error instanceof Error ? error.message : 'Unknown error',
      'error.type': error instanceof Error ? error.constructor.name : 'Unknown',
    });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Get current trace context
 */
export function getTraceContext(): TraceContext | null {
  return getTracer().getTraceContext();
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initTracing();
}
