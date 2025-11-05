import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { AnalyticsProvider } from './analytics-provider'
import { PrivacyHUD } from '@/components/PrivacyHUD'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { PerformanceHUD } from '@/components/PerformanceHUD'
import { IntegrationsLoader } from '@/components/integrations/IntegrationsLoader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hardonia',
  description: 'Modern, fast, and accessible commerce experience.',
  manifest: '/manifest.webmanifest',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hardonia',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Hardonia',
    title: 'Hardonia',
    description: 'Modern, fast, and accessible commerce experience.',
  },
  twitter: {
    card: 'summary',
    title: 'Hardonia',
    description: 'Modern, fast, and accessible commerce experience.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hardonia" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={`${inter.className} min-h-dvh antialiased`}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <Providers>
            <AnalyticsProvider>
              <IntegrationsLoader>
                <header className="sticky top-0 z-50 backdrop-blur bg-bg/70 border-b border-border">
                  <div className="container flex items-center justify-between h-14">
                    <a href="/" className="font-bold">
                      Hardonia
                    </a>
                    <nav aria-label="Primary" className="flex items-center gap-4">
                      <a className="px-3 py-2 hover:underline" href="/shop">
                        Shop
                      </a>
                      <a className="px-3 py-2 hover:underline" href="/about">
                        About
                      </a>
                      <ThemeToggle />
                    </nav>
                  </div>
                </header>
                <main id="main" className="container py-6">
                  {children}
                </main>
                <footer className="border-t border-border py-10 text-sm text-muted-foreground mt-auto">
                  <div className="container">
                    © {new Date().getFullYear()} Hardonia
                  </div>
                </footer>
                <PrivacyHUD />
                <ServiceWorkerRegistration />
                <PerformanceHUD />
              </IntegrationsLoader>
            </AnalyticsProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
