/**
 * AI Agent Guardrails
 * Wraps LLM calls with safety checks
 */

import { z } from 'zod';

interface LLMCallOptions {
  timeout?: number;
  maxRetries?: number;
  schema?: z.ZodSchema;
  fallback?: () => any;
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

const circuitBreaker = new CircuitBreaker();

export async function safeLLMCall<T>(
  callFn: () => Promise<T>,
  options: LLMCallOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    maxRetries = 3,
    schema,
    fallback
  } = options;

  // Check circuit breaker
  if (circuitBreaker.isOpen()) {
    console.warn('Circuit breaker is open, using fallback');
    if (fallback) {
      return fallback();
    }
    throw new Error('Circuit breaker is open and no fallback provided');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Timeout wrapper
      const result = await Promise.race([
        callFn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('LLM call timeout')), timeout)
        )
      ]);

      // Schema validation
      if (schema) {
        const validated = schema.parse(result);
        circuitBreaker.recordSuccess();
        return validated;
      }

      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation errors
      if (error instanceof z.ZodError) {
        circuitBreaker.recordFailure();
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  circuitBreaker.recordFailure();
  
  if (fallback) {
    return fallback();
  }

  throw lastError || new Error('LLM call failed after retries');
}

// Offline fallback helper
export function createOfflineFallback<T>(defaultValue: T) {
  return async (): Promise<T> => {
    console.warn('Using offline fallback');
    return defaultValue;
  };
}
