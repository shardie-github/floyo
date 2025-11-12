/**
 * Retry Utility Library
 * Exponential backoff with jitter for resilient operations
 */

import { logger } from './logger.js';

export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
    description?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitter: true,
    description: 'Operation',
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const exponentialDelay = options.baseDelayMs * Math.pow(2, attempt);
    const delay = Math.min(exponentialDelay, options.maxDelayMs);

    if (options.jitter) {
        // Add random jitter (±25%)
        const jitterAmount = delay * 0.25 * (Math.random() * 2 - 1);
        return Math.max(0, delay + jitterAmount);
    }

    return delay;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < opts.maxRetries) {
                const delay = calculateDelay(attempt, opts);
                logger.warn(
                    `${opts.description} failed (attempt ${attempt + 1}/${opts.maxRetries + 1}), retrying in ${delay.toFixed(0)}ms...`,
                    { error: lastError.message }
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                logger.error(
                    `${opts.description} failed after ${opts.maxRetries + 1} attempts`,
                    { error: lastError }
                );
            }
        }
    }

    throw lastError || new Error(`${opts.description} failed`);
}

/**
 * Retry with custom condition check
 */
export async function retryUntil<T>(
    fn: () => Promise<T>,
    condition: (result: T) => boolean,
    options: RetryOptions & { timeoutMs?: number } = {}
): Promise<T> {
    const timeoutMs = options.timeoutMs || 60000;
    const startTime = Date.now();
    const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };

    while (Date.now() - startTime < timeoutMs) {
        try {
            const result = await fn();
            if (condition(result)) {
                return result;
            }
        } catch (error) {
            // Continue retrying
        }

        const delay = calculateDelay(0, opts);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error(`${opts.description} timed out after ${timeoutMs}ms`);
}
