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
import { ConsentBanner } from '@/components/integrations/ConsentBanner'

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
  // [STAKE+TRUST:BEGIN:i18n_attributes]
  // i18n preparation: language and direction attributes
  // In production, these should be determined from user preferences or locale detection
  const locale = 'en-US'; // Default to English
  const language = locale.split('-')[0];
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const direction = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  // [STAKE+TRUST:END:i18n_attributes]

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
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
                    {/* [STAKE+TRUST:BEGIN:footer_links] */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        © {new Date().getFullYear()} Hardonia
                      </div>
                      <nav aria-label="Footer" className="flex flex-wrap gap-4">
                        <a href="/privacy/policy" className="hover:underline">
                          Privacy
                        </a>
                        {/* Trust links - gated by feature flags in production */}
                        {process.env.NEXT_PUBLIC_TRUST_STATUS_PAGE === 'true' && (
                          <a href="/status" className="hover:underline">
                            Status
                          </a>
                        )}
                        {process.env.NEXT_PUBLIC_TRUST_HELP_CENTER === 'true' && (
                          <a href="/help" className="hover:underline">
                            Help
                          </a>
                        )}
                        {process.env.NEXT_PUBLIC_TRUST_EXPORT === 'true' && (
                          <a href="/account/export" className="hover:underline">
                            Export Data
                          </a>
                        )}
                        <a href="/trust" className="hover:underline">
                          Trust & Transparency
                        </a>
                      </nav>
                    </div>
                    {/* [STAKE+TRUST:END:footer_links] */}
                  </div>
                </footer>
                <PrivacyHUD />
                <ServiceWorkerRegistration />
                <PerformanceHUD />
                <ConsentBanner />
              </IntegrationsLoader>
            </AnalyticsProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
