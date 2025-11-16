/**
 * Authentication Utilities
 * 
 * Helper functions for authentication and authorization in API routes.
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Extract user ID from request
 * 
 * Supports:
 * - Authorization header (Bearer token)
 * - Session cookie
 */
export async function getUserId(request: NextRequest): Promise<string | undefined> {
  // Try authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode JWT (base64 decode payload)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );
        return payload.sub || payload.user_id || payload.id;
      }
    } catch (error) {
      // Invalid token format, continue to try session cookie
    }
  }

  // Try session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (sessionToken) {
    try {
      // Validate session token (decode and check expiration)
      const parts = sessionToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );
        // Check expiration
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          return payload.sub || payload.user_id || payload.id;
        }
      }
    } catch (error) {
      // Invalid session token
    }
  }

  return undefined;
}

/**
 * Check MFA elevation for sensitive operations
 */
export async function checkMfaElevation(
  userId: string,
  sessionToken: string | null
): Promise<boolean> {
  if (!sessionToken) {
    return false;
  }

  try {
    // Validate MFA session token
    const parts = sessionToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      // Check expiration and MFA claim
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        return payload.mfa_verified === true || payload.mfa === true;
      }
    }
  } catch (error) {
    // Invalid token
    return false;
  }

  return false;
}
