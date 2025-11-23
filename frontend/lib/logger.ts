/**
 * Frontend Logger Utility
 * 
 * Provides structured logging for the frontend application.
 * Replaces console.log with proper logging service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
    };

    // In development, use console for better debugging
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn :
                           level === 'debug' ? console.debug : 
                           console.log;
      
      consoleMethod(`[${level.toUpperCase()}]`, message, context || '');
    }

    // In production, send to logging service (Sentry, Logtail, etc.)
    if (!this.isDevelopment) {
      // Send to Sentry if available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;
        if (level === 'error') {
          Sentry.captureException(new Error(message), { extra: context });
        } else {
          Sentry.captureMessage(message, { level, extra: context });
        }
      }
      
      // Send to API logging endpoint if available
      if (typeof fetch !== 'undefined') {
        fetch('/api/logging', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry),
        }).catch(() => {
          // Silently fail - logging should never break the app
        });
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    this.log('error', error instanceof Error ? error.message : String(error), errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export Logger class for testing
export { Logger };
