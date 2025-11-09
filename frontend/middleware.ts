import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { shouldRouteToCanary } from '@/lib/flags';

// Simple user ID extraction for middleware (doesn't require full auth)
function getUserIdFromRequest(request: NextRequest): string | undefined {
  // Try to get from cookie or header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // In production, decode JWT token here
    // For now, return undefined (canary will work for authenticated users via API routes)
    return undefined;
  }
  // Check cookie
  const sessionCookie = request.cookies.get('session');
  if (sessionCookie?.value) {
    // In production, decode session token here
    return undefined;
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Canary routing error:', error);
      }
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
