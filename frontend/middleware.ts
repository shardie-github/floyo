import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';

const ADMIN_PATHS = [/^\/admin(\/.*)?$/];
const CSP_MODE = (process.env.CSP_MODE || 'balanced') as 'strict' | 'balanced' | 'loose';
const REVALIDATE_SECONDS = parseInt(process.env.REVALIDATE_SECONDS || '60', 10);
const PREVIEW_REQUIRE_AUTH = process.env.PREVIEW_REQUIRE_AUTH !== 'false';

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Apply i18n middleware first and get response
  const intlResponse = intlMiddleware(req);
  
  // Get response (intlMiddleware returns NextResponse or void)
  const res = intlResponse instanceof NextResponse 
    ? intlResponse.clone() 
    : NextResponse.next();
  
  // Security headers
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content-Security-Policy based on CSP_MODE
  let csp: string;
  if (CSP_MODE === 'strict') {
    csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'"
    ].join('; ');
  } else if (CSP_MODE === 'balanced') {
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'"
    ].join('; ');
  } else { // loose
    csp = [
      "default-src 'self' *",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
      "style-src 'self' 'unsafe-inline' *",
      "img-src 'self' data: *",
      "font-src 'self' data: *",
      "connect-src 'self' *",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'"
    ].join('; ');
  }
  res.headers.set('Content-Security-Policy', csp);
  
  // Preview protection & admin basic auth
  const isPreview = url.host.includes('-git-') || url.host.includes('-vercel.app') || process.env.VERCEL_ENV === 'preview';
  const needsAdminGuard = ADMIN_PATHS.some(rx => rx.test(url.pathname));
  
  if (needsAdminGuard) {
    const authHeader = req.headers.get('authorization') || '';
    const adminAuth = process.env.ADMIN_BASIC_AUTH || '';
    
    if (adminAuth) {
      // Admin auth is configured - require Basic Auth
      if (!authHeader.startsWith('Basic ')) {
        return new NextResponse('Unauthorized', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin"',
            ...Object.fromEntries(res.headers.entries()),
          },
        });
      }
      
      // Verify credentials
      try {
        const encoded = authHeader.split(' ')[1];
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        const [username, password] = decoded.split(':');
        const providedAuth = `${username}:${password}`;
        
        if (providedAuth !== adminAuth) {
          return new NextResponse('Unauthorized', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="Admin"',
              ...Object.fromEntries(res.headers.entries()),
            },
          });
        }
      } catch (e) {
        return new NextResponse('Unauthorized', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin"',
            ...Object.fromEntries(res.headers.entries()),
          },
        });
      }
    } else if (isPreview && PREVIEW_REQUIRE_AUTH) {
      // No admin auth configured but preview requires protection
      return new NextResponse('Protected in preview', {
        status: 401,
        headers: Object.fromEntries(res.headers.entries()),
      });
    }
  }
  
  // Add tiny preview banner header (frontend can render if present)
  if (isPreview) {
    res.headers.set('X-Preview-Env', 'true');
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
