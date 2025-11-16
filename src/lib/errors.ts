/**
 * Error Taxonomy & Utilities
 * Centralized error handling with categorization and context tracking
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  INTERNAL = 'internal',
  RESOURCE = 'resource',
  CONFIGURATION = 'configuration',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  category: ErrorCategory;
  severity: ErrorSeverity;
  component: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly component: string;
  public readonly userId?: string;
  public readonly requestId?: string;
  public readonly metadata?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    context: ErrorContext,
    cause?: Error
  ) {
    super(message, { cause });
    this.name = 'AppError';
    this.category = context.category;
    this.severity = context.severity;
    this.component = context.component;
    this.userId = context.userId;
    this.requestId = context.requestId;
    this.metadata = context.metadata;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      component: this.component,
      userId: this.userId,
      requestId: this.requestId,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    component: string,
    field?: string,
    metadata?: Record<string, any>
  ) {
    super(message, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      component,
      metadata: { field, ...metadata },
    });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string,
    component: string,
    metadata?: Record<string, any>
  ) {
    super(message, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      component,
      metadata,
    });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string,
    component: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    super(message, {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.HIGH,
      component,
      userId,
      metadata,
    });
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    component: string,
    metadata?: Record<string, any>
  ) {
    super(message, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      component,
      metadata,
    });
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    component: string,
    metadata?: Record<string, any>
  ) {
    super(message, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      component,
      metadata,
    });
    this.name = 'DatabaseError';
  }
}

/**
 * Format error for user-facing display
 */
export function formatUserError(error: Error | AppError): string {
  if (error instanceof AppError) {
    // Map error categories to user-friendly messages
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return error.message || 'Please check your input and try again.';
      case ErrorCategory.AUTHENTICATION:
        return 'Please sign in to continue.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorCategory.DATABASE:
        return 'A database error occurred. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Fallback for generic errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error with context
 */
export function logError(error: Error | AppError, context?: Record<string, any>): void {
  const errorData = error instanceof AppError
    ? error.toJSON()
    : {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service (Sentry, etc.)
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (sentryDsn) {
      // Non-blocking error reporting
      fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...errorData, ...context }),
      }).catch(() => {
        // Fail silently to avoid disrupting application flow
      });
    }
    
    // Also log to console in production for debugging
    if (process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS === 'true') {
      console.error('Error logged:', { ...errorData, ...context });
    }
  } else {
    // Development: log to console with full details
    console.error('Error:', errorData, context);
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return (
      error.category === ErrorCategory.NETWORK ||
      error.category === ErrorCategory.EXTERNAL_API ||
      (error.category === ErrorCategory.DATABASE && error.severity !== ErrorSeverity.CRITICAL)
    );
  }
  return false;
}
