import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { shouldRouteToCanary } from '@/lib/flags';
import { getCriticalEnvStatus } from '@/lib/env-health';

/**
 * Extract user ID from JWT token in request.
 * 
 * This is a lightweight extraction for feature flagging/canary routing.
 * Full authentication validation happens in API routes.
 */
function getUserIdFromRequest(request: NextRequest): string | undefined {
  // Try to get from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode JWT without verification (for feature flags only)
      // Full verification happens in API routes
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64url').toString('utf-8')
        );
        return payload.sub || payload.user_id || payload.id;
      }
    } catch (error) {
      // Invalid token format - ignore for middleware purposes
      // Full validation happens in API routes
    }
  }
  
  // Check session cookie (if using cookie-based auth)
  const sessionCookie = request.cookies.get('session');
  if (sessionCookie?.value) {
    try {
      // Try to decode session token
      const parts = sessionCookie.value.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64url').toString('utf-8')
        );
        return payload.sub || payload.user_id || payload.id;
      }
    } catch (error) {
      // Invalid token format - ignore
    }
  }
  
  return undefined;
}

const CSP_MODE = (process.env.CSP_MODE || 'balanced') as 'strict' | 'balanced' | 'loose';
const REVALIDATE_SECONDS = parseInt(process.env.REVALIDATE_SECONDS || '60', 10);
const PREVIEW_REQUIRE_AUTH = process.env.PREVIEW_REQUIRE_AUTH !== 'false';

// CSP policies
const CSP_POLICIES = {
  strict: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
  },
  balanced: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'connect-src': ["'self'", 'https://api.vercel.app'],
  },
  loose: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https:'],
    'style-src': ["'self'", "'unsafe-inline'", 'https:'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https:', 'data:'],
    'connect-src': ["'self'", 'https:'],
  },
};

function getCSPHeader(): string {
  const policy = CSP_POLICIES[CSP_MODE];
  return Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Environment validation check (only in production)
  if (process.env.NODE_ENV === 'production' && !pathname.startsWith('/api/env')) {
    const envStatus = getCriticalEnvStatus();
    if (!envStatus.ok && pathname !== '/health') {
      // Log warning but don't block requests in middleware
      // Full validation happens in API routes and health checks
      if (process.env.NODE_ENV === 'development') {
        console.warn('Critical environment variables missing:', envStatus.missing);
      }
    }
  }

  // Canary routing for checkout module
  if (pathname.startsWith('/checkout') || pathname.startsWith('/api/checkout')) {
    try {
      const userId = getUserIdFromRequest(request);
      if (userId) {
        const routeToCanary = await shouldRouteToCanary(userId, 'checkout');
        if (routeToCanary && process.env.CANARY_PREVIEW_URL) {
          // Route to canary preview URL
          const canaryUrl = new URL(pathname, process.env.CANARY_PREVIEW_URL);
          canaryUrl.search = url.search;
          return NextResponse.rewrite(canaryUrl);
        }
      }
    } catch (error) {
      // Fail silently, continue with normal routing
      // Error logging handled by error tracking service in production
    }
  }

  // Preview protection
  const isPreview = url.host.includes('-git-') || 
                   url.host.includes('-vercel.app') || 
                   process.env.VERCEL_ENV === 'preview';

  if (isPreview && PREVIEW_REQUIRE_AUTH) {
    const adminAuth = process.env.ADMIN_BASIC_AUTH || '';
    const authHeader = request.headers.get('authorization');

    if (adminAuth && authHeader !== `Basic ${adminAuth}`) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Preview Access"',
        },
      });
    }
  }

  // Security headers
  const response = NextResponse.next();
  
  // CSP
  response.headers.set('Content-Security-Policy', getCSPHeader());
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (HTTP Strict Transport Security) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production' && request.url.startsWith('https://')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Permissions Policy (formerly Feature Policy)
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control for static assets
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/assets/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
