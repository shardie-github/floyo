/**
 * Admin Layout with Basic Auth Protection
 * 
 * Protection methods:
 * - Vercel: Use Vercel Access Controls (recommended)
 *   See: docs/admin-access-control.md
 * - Alternative: Basic Auth via ADMIN_BASIC_AUTH secret
 *   Format: "username:password" (base64 encoded)
 */

import { headers } from 'next/headers';

async function checkAdminAccess(): Promise<boolean> {
  // On Vercel, use Access Controls (configured in dashboard)
  // This middleware is a fallback for non-Vercel deployments
  
  const adminAuth = process.env.ADMIN_BASIC_AUTH;
  
  if (!adminAuth) {
    // If no auth configured, allow access (for development)
    // In production, this should be restricted via Vercel Access Controls
    if (process.env.NODE_ENV === 'production') {
      console.warn('[admin] No ADMIN_BASIC_AUTH configured. Restrict access via Vercel Access Controls.');
    }
    return true; // Allow in dev, restrict via Vercel in prod
  }

  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const encoded = authHeader.split(' ')[1];
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');

  // Compare with ADMIN_BASIC_AUTH (format: "username:password")
  const expectedAuth = Buffer.from(adminAuth).toString('base64');
  const providedAuth = Buffer.from(`${username}:${password}`).toString('base64');

  return expectedAuth === providedAuth;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    // Return 401 with WWW-Authenticate header for Basic Auth
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Dashboard"',
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            System metrics and operations
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
