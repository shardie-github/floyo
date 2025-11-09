/**
 * Centralized API error handler
 * 
 * Provides standardized error responses for API routes.
 */

import { NextResponse } from 'next/server';
import {
  AppError,
  isAppError,
  getErrorMessage,
  getErrorCategory,
  getErrorSeverity,
  ErrorCategory,
  ErrorSeverity,
} from '@/src/lib/errors';

export interface ErrorResponse {
  error: {
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    code?: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

/**
 * Map error to HTTP status code
 */
function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        return 401;
      case ErrorCategory.AUTHORIZATION:
        return 403;
      case ErrorCategory.VALIDATION:
        return 400;
      case ErrorCategory.NOT_FOUND:
        return 404;
      case ErrorCategory.RATE_LIMIT:
        return 429;
      case ErrorCategory.EXTERNAL_SERVICE:
      case ErrorCategory.DATABASE:
        return 502;
      case ErrorCategory.NETWORK:
        return 503;
      case ErrorCategory.INTERNAL:
      default:
        return 500;
    }
  }
  return 500;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: unknown, includeStack = false): NextResponse<ErrorResponse> {
  const message = getErrorMessage(error);
  const category = getErrorCategory(error);
  const severity = getErrorSeverity(error);
  const statusCode = getStatusCode(error);

  const errorResponse: ErrorResponse = {
    error: {
      message,
      category,
      severity,
      ...(isAppError(error) && error.context.resource && {
        code: `${category}_${error.context.resource}`,
      }),
      ...(isAppError(error) && error.context.metadata && {
        details: error.context.metadata,
      }),
    },
    timestamp: new Date().toISOString(),
  };

  // Log error for monitoring
  if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
    console.error('[API Error]', {
      message,
      category,
      severity,
      error: isAppError(error) ? error.toJSON() : error,
      ...(includeStack && { stack: error instanceof Error ? error.stack : undefined }),
    });
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Wrap async route handler with error handling
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, process.env.NODE_ENV === 'development');
    }
  };
}
