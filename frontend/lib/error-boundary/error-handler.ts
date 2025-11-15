/**
 * Comprehensive Error Handling System
 * 
 * Provides centralized error handling, reporting, and recovery strategies.
 * Integrates with Sentry, error boundaries, and user-friendly error messages.
 */

import { env } from '../env';
import * as Sentry from '@sentry/nextjs';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  API = 'api',
  UI = 'ui',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  context?: ErrorContext;
  retryable?: boolean;
  userMessage?: string;
}

/**
 * Create an application error with context
 */
export function createAppError(
  message: string,
  options: {
    code?: string;
    statusCode?: number;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    context?: ErrorContext;
    retryable?: boolean;
    userMessage?: string;
    cause?: Error;
  } = {}
): AppError {
  const error = new Error(message) as AppError;
  error.name = 'AppError';
  error.code = options.code;
  error.statusCode = options.statusCode || 500;
  error.severity = options.severity || ErrorSeverity.MEDIUM;
  error.category = options.category || ErrorCategory.UNKNOWN;
  error.context = {
    timestamp: new Date().toISOString(),
    ...options.context,
  };
  error.retryable = options.retryable ?? false;
  error.userMessage = options.userMessage || message;
  
  if (options.cause) {
    error.cause = options.cause;
  }

  return error;
}

/**
 * Report error to monitoring service (Sentry)
 */
export function reportError(error: Error | AppError, context?: ErrorContext): void {
  // Add context to error if it's an AppError
  if ('context' in error && error.context) {
    context = { ...error.context, ...context };
  }

  // Report to Sentry if configured
  if (env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        app: context,
      },
      tags: {
        category: 'category' in error ? error.category : ErrorCategory.UNKNOWN,
        severity: 'severity' in error ? error.severity : ErrorSeverity.MEDIUM,
      },
      level: getSentryLevel('severity' in error ? error.severity : ErrorSeverity.MEDIUM),
    });
  }

  // Log to console in development
  if (env.NODE_ENV === 'development') {
    console.error('[Error Handler]', error, context);
  }
}

/**
 * Get Sentry level from error severity
 */
function getSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 'info';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.CRITICAL:
      return 'fatal';
    default:
      return 'error';
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if ('userMessage' in error && error.userMessage) {
    return error.userMessage;
  }

  // Map common error types to user-friendly messages
  if (error instanceof TypeError) {
    return 'An unexpected error occurred. Please try again.';
  }

  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (error instanceof AuthenticationError) {
    return 'Your session has expired. Please log in again.';
  }

  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.';
  }

  if (error instanceof ValidationError) {
    return error.message || 'Please check your input and try again.';
  }

  // Default message
  return 'Something went wrong. Please try again later.';
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: Error | AppError): boolean {
  if ('retryable' in error && error.retryable !== undefined) {
    return error.retryable;
  }

  // Network errors are typically retryable
  if (error instanceof NetworkError) {
    return true;
  }

  // 5xx errors are typically retryable
  if ('statusCode' in error && error.statusCode) {
    return error.statusCode >= 500 && error.statusCode < 600;
  }

  return false;
}

/**
 * Network error class
 */
export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR';
  statusCode = 0;
  severity = ErrorSeverity.HIGH;
  category = ErrorCategory.NETWORK;
  retryable = true;
  userMessage = 'Unable to connect to the server. Please check your internet connection.';

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends Error implements AppError {
  code = 'AUTHENTICATION_ERROR';
  statusCode = 401;
  severity = ErrorSeverity.MEDIUM;
  category = ErrorCategory.AUTHENTICATION;
  retryable = false;
  userMessage = 'Your session has expired. Please log in again.';

  constructor(message: string = 'Authentication failed', cause?: Error) {
    super(message);
    this.name = 'AuthenticationError';
    this.cause = cause;
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR';
  statusCode = 403;
  severity = ErrorSeverity.MEDIUM;
  category = ErrorCategory.AUTHORIZATION;
  retryable = false;
  userMessage = 'You do not have permission to perform this action.';

  constructor(message: string = 'Authorization failed', cause?: Error) {
    super(message);
    this.name = 'AuthorizationError';
    this.cause = cause;
  }
}

/**
 * Validation error class
 */
export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  severity = ErrorSeverity.LOW;
  category = ErrorCategory.VALIDATION;
  retryable = false;
  userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = 'ValidationError';
    this.userMessage = userMessage || message;
  }
}

/**
 * Database error class
 */
export class DatabaseError extends Error implements AppError {
  code = 'DATABASE_ERROR';
  statusCode = 500;
  severity = ErrorSeverity.HIGH;
  category = ErrorCategory.DATABASE;
  retryable = true;
  userMessage = 'A database error occurred. Please try again.';

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.cause = cause;
  }
}

/**
 * API error class
 */
export class APIError extends Error implements AppError {
  code: string;
  statusCode: number;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'API_ERROR',
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.severity = statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    this.retryable = retryable;
    this.userMessage = message;
  }
}

/**
 * Handle error with automatic reporting and user-friendly messaging
 */
export function handleError(error: Error | AppError, context?: ErrorContext): {
  message: string;
  code?: string;
  retryable: boolean;
  severity: ErrorSeverity;
} {
  // Report error
  reportError(error, context);

  // Return user-friendly information
  return {
    message: getUserFriendlyMessage(error),
    code: 'code' in error ? error.code : undefined,
    retryable: isRetryable(error),
    severity: 'severity' in error ? error.severity : ErrorSeverity.MEDIUM,
  };
}
