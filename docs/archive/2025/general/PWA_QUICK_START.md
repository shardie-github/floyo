> Archived on 2025-11-12. Superseded by: (see docs/final index)

# PWA Quick Start Implementation Guide

## ?? Getting Floyo Installable in 1 Day

This guide will help you implement the critical P0 and P1 items to make Floyo installable.

---

## Step 1: Install Next.js PWA Package (5 minutes)

```bash
cd frontend
npm install next-pwa
```

---

## Step 2: Generate App Icons (15 minutes)

You need these icon files in `frontend/public/`:

### Required Icons:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `apple-touch-icon.png` (180x180px)
- `favicon.ico` (16x16, 32x32, or multi-size)

### Quick Solution:
1. Create or download a logo/icon
2. Use an online tool: https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
3. Generate all required sizes
4. Place them in `frontend/public/`

### Or Use a Tool:
```bash
# Install icon generator
npm install -g pwa-asset-generator

# Generate from a source image (512x512 recommended)
pwa-asset-generator logo.png public/ --icon-only
```

---

## Step 3: Update Next.js Config (10 minutes)

Update `frontend/next.config.js`:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev for easier testing
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 48,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.location.origin === url.origin
        if (!isSameOrigin) return false
        const pathname = url.pathname
        // Exclude /api
        if (pathname.startsWith('/api/')) return false
        return true
      },
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
```

---

## Step 4: Update Layout with Manifest & Meta Tags (10 minutes)

Update `frontend/app/layout.tsx`:

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Floyo - File Usage Pattern Tracker',
  description: 'Track file usage patterns and get integration suggestions',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Floyo',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Floyo',
    title: 'Floyo - File Usage Pattern Tracker',
    description: 'Track file usage patterns and get integration suggestions',
  },
  twitter: {
    card: 'summary',
    title: 'Floyo - File Usage Pattern Tracker',
    description: 'Track file usage patterns and get integration suggestions',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Floyo" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Note**: Next.js App Router automatically handles the `<head>` tag, but you can also use Next.js metadata API fully.

---

## Step 5: Improve Manifest (5 minutes)

Update `frontend/public/manifest.json`:

```json
{
  "name": "Floyo - File Usage Pattern Tracker",
  "short_name": "Floyo",
  "description": "Track your file usage patterns and discover integration opportunities",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["productivity", "developer"],
  "screenshots": [],
  "shortcuts": [
    {
      "name": "Dashboard",
      "url": "/",
      "description": "View your dashboard",
      "icons": [
        {
          "src": "/icon-192.png",
          "sizes": "192x192"
        }
      ]
    },
    {
      "name": "Events",
      "url": "/?tab=events",
      "description": "View recent events",
      "icons": [
        {
          "src": "/icon-192.png",
          "sizes": "192x192"
        }
      ]
    }
  ]
}
```

---

## Step 6: Create Install Prompt Hook (15 minutes)

Create `frontend/hooks/useInstallPrompt.ts`:

```typescript
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const promptInstall = async (): Promise<boolean> => {
    if (!installPrompt) return false

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
      return true
    }

    return false
  }

  return { installPrompt, isInstalled, promptInstall }
}
```

---

## Step 7: Create Install Button Component (10 minutes)

Create `frontend/components/InstallPrompt.tsx`:

```tsx
'use client'

import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useState } from 'react'
import { useNotifications } from './NotificationProvider'

export function InstallPrompt() {
  const { installPrompt, isInstalled, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const { addNotification } = useNotifications()

  if (isInstalled || !installPrompt || dismissed) {
    return null
  }

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      addNotification({
        type: 'success',
        message: 'Floyo installed successfully!',
      })
    }
    setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store dismissal in localStorage to remember preference
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Check if user previously dismissed
  if (typeof window !== 'undefined') {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed === 'true' && dismissed) {
      return null
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Install Floyo
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add Floyo to your home screen for quick access and offline support.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
```

---

## Step 8: Add Install Prompt to Dashboard (2 minutes)

Update `frontend/components/Dashboard.tsx`:

```tsx
import { InstallPrompt } from './InstallPrompt'

// ... existing imports

export function Dashboard() {
  // ... existing code

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* ... existing code */}
      <InstallPrompt />
    </div>
  )
}
```

---

## Step 9: Create Offline Fallback Page (10 minutes)

Create `frontend/public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Floyo - Offline</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f3f4f6;
      color: #1f2937;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Offline</h1>
    <p>Floyo needs an internet connection to sync your data.</p>
    <button onclick="window.location.reload()">Retry</button>
  </div>
</body>
</html>
```

Update service worker caching strategy to use this offline page.

---

## Step 10: Test Installation (15 minutes)

1. **Build the app:**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

2. **Open Chrome DevTools:**
   - Go to Application tab
   - Check Service Workers (should be registered)
   - Check Manifest (should show all info)
   - Test offline mode

3. **Test Installation:**
   - Look for install prompt or use browser menu
   - Install the app
   - Launch from home screen/app icon
   - Test offline functionality

4. **Run Lighthouse:**
   - Open Chrome DevTools > Lighthouse
   - Select "Progressive Web App"
   - Run audit
   - Fix any issues (aim for 90+ score)

---

## Step 11: Add to .gitignore (1 minute)

Add to `frontend/.gitignore`:

```
public/sw.js
public/workbox-*.js
public/fallback-*.js
```

These are generated files.

---

## Summary

After completing these steps, you'll have:
? Service worker registered
? Icons (need to create)
? Manifest integrated
? Install prompt
? Offline support (basic)
? Platform meta tags

**Time Estimate**: 2-3 hours for implementation

**Still Needed**:
- Create actual icon files
- HTTPS setup (for production)
- More comprehensive offline handling
- Push notifications (optional)

---

## Quick Icon Generation

If you don't have icons yet, create a simple one:

```bash
# Using ImageMagick (if installed)
convert -size 512x512 xc:transparent -fill '#3b82f6' -draw 'circle 256,256 256,100' -font Arial -pointsize 200 -fill white -gravity center -annotate +0+0 'F' icon-512.png

# Or use online tools:
# - https://realfavicongenerator.net/
# - https://www.pwabuilder.com/imageGenerator
# - https://favicon.io/
```

Then resize for all needed sizes:
- 192x192
- 512x512
- 180x180 (Apple)
- 16x16, 32x32 (favicon)

---

## Troubleshooting

**Service worker not registering:**
- Check browser console for errors
- Ensure HTTPS (or localhost)
- Clear browser cache
- Check service worker scope

**Install prompt not showing:**
- App must meet PWA criteria
- Check manifest is valid
- Ensure service worker is active
- Try different browser (Chrome recommended first)

**Icons not showing:**
- Check file paths in manifest
- Verify files exist in public/
- Check file sizes match manifest
- Clear browser cache

---

**Next Steps**: See `PWA_COMPLETION_CHECKLIST.md` for advanced features!
