/**
 * Error Taxonomy - Domain error classes and error handling utilities
 * 
 * Provides structured error types for consistent error handling across the application.
 */

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  NETWORK = 'network',
  INTERNAL = 'internal',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public readonly context: ErrorContext = { timestamp: new Date().toISOString() },
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public readonly fields?: Record<string, string[]>,
    context?: Partial<ErrorContext>
  ) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, resourceId?: string, context?: Partial<ErrorContext>) {
    super(
      resourceId ? `${resource} with id ${resourceId} not found` : `${resource} not found`,
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.LOW,
      {
        timestamp: new Date().toISOString(),
        resource,
        resourceId,
        ...context,
      }
    );
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    context?: Partial<ErrorContext>
  ) {
    super(message, ErrorCategory.RATE_LIMIT, ErrorSeverity.MEDIUM, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    context?: Partial<ErrorContext>
  ) {
    super(message, ErrorCategory.EXTERNAL_SERVICE, ErrorSeverity.HIGH, {
      timestamp: new Date().toISOString(),
      resource: service,
      ...context,
    });
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.DATABASE, ErrorSeverity.HIGH, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

/**
 * Network errors
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network error', context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

/**
 * Internal errors (unexpected)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', context?: Partial<ErrorContext>) {
    super(message, ErrorCategory.INTERNAL, ErrorSeverity.CRITICAL, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An error occurred';
}

/**
 * Extract error category safely
 */
export function getErrorCategory(error: unknown): ErrorCategory {
  if (isAppError(error)) {
    return error.category;
  }
  return ErrorCategory.INTERNAL;
}

/**
 * Extract error severity safely
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isAppError(error)) {
    return error.severity;
  }
  return ErrorSeverity.MEDIUM;
}
